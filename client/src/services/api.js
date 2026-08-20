const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Thin fetch wrapper: attaches the JWT (if present), parses JSON,
// and normalizes errors into a single shape the UI can rely on.
async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = localStorage.getItem('cartify_token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // No JSON body (e.g. 204) — leave data as null.
  }

  if (!res.ok) {
    const error = new Error(data?.message || 'Something went wrong. Please try again.');
    error.status = res.status;
    error.fieldErrors = data?.errors || null;
    throw error;
  }

  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
};
