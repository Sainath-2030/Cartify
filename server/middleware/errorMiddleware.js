// Central error handler. Any error passed to next(err) or thrown inside
// an asyncHandler-wrapped controller ends up here.

export class AppError extends Error {
  constructor(message, statusCode = 500, fieldErrors = null) {
    super(message);
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;

  // PostgreSQL unique violation constraint code
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with these details already exists.',
      error: 'ConflictError',
    });
  }

  // PostgreSQL invalid foreign key reference code
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced entity does not exist.',
      error: 'ForeignKeyViolation',
    });
  }

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error('API Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong on the server.',
    error: err.name || 'Error',
    ...(err.fieldErrors ? { errors: err.fieldErrors } : {}),
  });
};
