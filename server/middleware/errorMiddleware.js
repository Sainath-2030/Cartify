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

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with these details already exists.',
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong on the server.',
    ...(err.fieldErrors ? { errors: err.fieldErrors } : {}),
  });
};
