import { AppError } from './errorMiddleware.js';

// Wraps a validator function (body) => { valid, errors } into middleware.
export const validateBody = (validatorFn) => (req, res, next) => {
  const { valid, errors } = validatorFn(req.body || {});
  if (!valid) {
    return next(new AppError('Validation failed.', 422, errors));
  }
  next();
};
