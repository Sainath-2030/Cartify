// Client-side validation mirrors the server so users get instant feedback
// — the server remains the source of truth and re-validates everything.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const POSTAL_CODE_REGEX = /^\d{6}$/;

export const validateEmail = (value) => {
  if (!value?.trim()) return 'Email is required.';
  if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address.';
  return '';
};

export const validateMobile = (value) => {
  if (!value?.trim()) return 'Mobile number is required.';
  if (!INDIAN_MOBILE_REGEX.test(value.trim())) return 'Please enter a valid 10-digit Indian mobile number.';
  return '';
};

export const validatePostalCode = (value) => {
  if (!value?.trim()) return 'Postal code is required.';
  if (!POSTAL_CODE_REGEX.test(value.trim())) return 'Please enter a valid 6-digit postal code.';
  return '';
};

export const validateRequired = (value, label) => {
  if (!value?.trim()) return `${label} is required.`;
  return '';
};

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  return { score, label: labels[score] };
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include uppercase, lowercase and a number.';
  }
  return '';
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password.';
  if (password !== confirmPassword) return 'Passwords do not match.';
  return '';
};
