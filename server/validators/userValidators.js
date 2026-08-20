const POSTAL_CODE_REGEX = /^\d{6}$/;
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export const validateProfileUpdate = (body) => {
  const errors = {};
  const { fullName, mobile, postalCode, dateOfBirth } = body;

  if (fullName !== undefined && fullName.trim().length < 2) {
    errors.fullName = 'Please enter a valid full name.';
  }

  if (mobile !== undefined && !INDIAN_MOBILE_REGEX.test(String(mobile).trim())) {
    errors.mobile = 'Please enter a valid 10-digit Indian mobile number.';
  }

  if (postalCode !== undefined && !POSTAL_CODE_REGEX.test(String(postalCode).trim())) {
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
