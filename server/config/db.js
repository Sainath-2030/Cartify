import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables. Check your .env file.');
}

/**
 * Pool sizing
 * ----------
 * Managed Postgres providers (Supabase/RDS/etc.) cap concurrent server-side
 * clients. Supabase's *session* pooler, for example, allows only 15. When the
 * BI dashboard fans out its requests with wide `Promise.all` calls, the app can
 * easily exceed that and the provider rejects the surplus connections with
 * `EMAXCONNSESSION` / SQLSTATE 53300 ("max clients reached in session mode").
 *
 * The fix is to stay *well* under the provider cap by default rather than trying
 * to grab as many connections as possible. Raise it with DB_POOL_MAX only after
 * confirming the provider's limit.
 */
const PROVIDER_CLIENT_CAP = 15;
const configuredMax = parseInt(process.env.DB_POOL_MAX, 10);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  // Never exceed the provider's session cap minus headroom for migrations,
  // admin tooling, or other services sharing the same project.
  max: Number.isFinite(configuredMax) && configuredMax > 0
    ? configuredMax
    : Math.max(2, PROVIDER_CLIENT_CAP - 7), // 8 on a 15-connection pooler
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // Never let a runaway analytical query hold a connection indefinitely.
  statement_timeout: 20000,
  query_timeout: 25000,
  application_name: 'cartify-api'
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error on idle connection:', err);
});

/**
 * Detect connection-capacity rejections so we can back off instead of failing
 * the whole request.
 */
const isConnectionExhaustion = (err) => {
  const code = err?.code;
  const message = String(err?.message || '');
  return (
    code === '53300' || // insufficient resources (Supabase / PgBouncer)
    code === 'EMAXCONNSESSION' ||
    code === '53400' || // configuration_limit_exceeded
    code === '08006' || // connection_failure
    code === '57P03' || // cannot_connect_now
    /max clients reached|too many clients|remaining connection slots|sorry, too many clients/i.test(message)
  );
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Run a query, retrying once on connection-capacity errors after a short
 * randomized backoff. Concurrency bursts (e.g. the BI dashboard loading six
 * panels at once) otherwise fail every panel with the same scary toast even
 * though the requests would succeed if they were merely spaced out.
 *
 * Retries are deliberately capped at one extra attempt: if the database is
 * genuinely at capacity, a second immediate attempt only adds load.
 */
export const query = async (text, params, options = {}) => {
  const { retries = 1, retryDelayMs = 350 } = options;

  for (let attempt = 0; ; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      if (attempt >= retries || !isConnectionExhaustion(err)) throw err;

      // Jitter keeps a burst of simultaneous retries from re-colliding.
      const wait = retryDelayMs + Math.floor(Math.random() * 250);
      console.warn(
        `[db] Connection capacity reached (${err.code || 'unknown'}). ` +
        `Retrying query in ${wait}ms (attempt ${attempt + 2}/${retries + 1}).`
      );
      await sleep(wait);
    }
  }
};

/**
 * Map over `items` with at most `limit` in-flight operations.
 *
 * Used by the BI aggregation layers in place of wide `Promise.all` calls so a
 * dashboard load occupies only a handful of pool connections instead of one
 * per query. Results preserve input order.
 */
export const mapLimit = async (items, limit, fn) => {
  const results = new Array(items.length);
  const concurrency = Math.max(1, limit);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
};

/**
 * Resolve several thunks with a bounded number of concurrent calls.
 * Convenience wrapper over `mapLimit` for the 3-6 query fan-outs used by the
 * BI services.
 */
export const settleLimit = (thunks, limit = 3) => mapLimit(thunks, limit, (fn) => fn());

// Graceful pool shutdown on termination signals
const closePool = async () => {
  try {
    await pool.end();
    console.log('PostgreSQL pool closed successfully.');
  } catch (err) {
    console.error('Error closing PostgreSQL pool:', err);
  }
};

process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);