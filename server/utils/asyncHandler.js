// Wraps an async route/controller so thrown errors are forwarded to
// the centralized error middleware instead of crashing the process.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
