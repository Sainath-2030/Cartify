// Server-side validation for auth routes.
// Mirrors (and enforces independently of) the client-side checks —
// never trust the client alone.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/; // 10 digits, starts 6-9
const POSTAL_CODE_REGEX = /^\d{6}$/; // Indian PIN code

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

export const validateRegister = (body) => {
  const errors = {};
  const {
    fullName, email, mobile, password, confirmPassword,
    address, city, state, postalCode, dateOfBirth,
  } = body;

  if (!isNonEmptyString(fullName) || fullName.trim().length < 2) {
    errors.fullName = 'Please enter your full name.';
  }

  if (!isNonEmptyString(email) || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!isNonEmptyString(mobile) || !INDIAN_MOBILE_REGEX.test(mobile.trim())) {
    errors.mobile = 'Please enter a valid 10-digit Indian mobile number.';
  }

  if (!isNonEmptyString(password) || password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Password must include uppercase, lowercase and a number.';
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (!isNonEmptyString(address)) {
    errors.address = 'Please enter your address.';
  }

  if (!isNonEmptyString(city)) {
    errors.city = 'Please enter your city.';
  }

  if (!isNonEmptyString(state)) {
    errors.state = 'Please enter your state.';
  }

  if (!isNonEmptyString(postalCode) || !POSTAL_CODE_REGEX.test(postalCode.trim())) {
    errors.postalCode = 'Please enter a valid 6-digit postal code.';
  }

  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime()) || dob > new Date()) {
      errors.dateOfBirth = 'Please enter a valid date of birth.';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

export const validateLogin = (body) => {
  const errors = {};
  const { email, password } = body;

  if (!isNonEmptyString(email) || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!isNonEmptyString(password)) {
    errors.password = 'Please enter your password.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
};
