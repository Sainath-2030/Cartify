import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShoppingBag } from 'lucide-react';
import Input from '../components/Input.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import PasswordStrength from '../components/PasswordStrength.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import {
  validateEmail,
  validateMobile,
  validatePassword,
  validateConfirmPassword,
  validatePostalCode,
  validateRequired,
} from '../utils/validators.js';

const INITIAL_FORM = {
  fullName: '',
  email: '',
  mobile: '',
  password: '',
  confirmPassword: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  dateOfBirth: '',
};

export default function Signup() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {
      fullName: validateRequired(form.fullName, 'Full name'),
      email: validateEmail(form.email),
      mobile: validateMobile(form.mobile),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
      address: validateRequired(form.address, 'Address'),
      city: validateRequired(form.city, 'City'),
      state: validateRequired(form.state, 'State'),
      postalCode: validatePostalCode(form.postalCode),
    };
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register(form);
      showToast('Account created successfully. Welcome to Cartify!');
      navigate('/profile', { replace: true });
    } catch (err) {
      if (err.fieldErrors) setErrors((prev) => ({ ...prev, ...err.fieldErrors }));
      setFormError(err.message || 'Unable to create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-page flex items-center justify-center py-16">
      <div className="card w-full max-w-2xl p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <ShoppingBag className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-ink">Create your account</h1>
          <p className="text-sm text-muted">Join Cartify and shop smarter, not harder.</p>
        </div>

        {formError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
        )}

        <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full Name" htmlFor="fullName" error={errors.fullName} required>
            <Input id="fullName" name="fullName" placeholder="Priya Sharma" value={form.fullName} onChange={onChange} error={!!errors.fullName} />
          </FormField>

          <FormField label="Email" htmlFor="email" error={errors.email} required>
            <Input id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={onChange} error={!!errors.email} />
          </FormField>

          <FormField label="Mobile Number" htmlFor="mobile" error={errors.mobile} required>
            <Input id="mobile" name="mobile" type="tel" placeholder="9876543210" value={form.mobile} onChange={onChange} error={!!errors.mobile} />
          </FormField>

          <FormField label="Date of Birth" htmlFor="dateOfBirth" error={errors.dateOfBirth}>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={onChange} error={!!errors.dateOfBirth} />
          </FormField>

          <FormField label="Password" htmlFor="password" error={errors.password} required>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={form.password}
                onChange={onChange}
                error={!!errors.password}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2">
              <PasswordStrength password={form.password} />
            </div>
          </FormField>

          <FormField label="Confirm Password" htmlFor="confirmPassword" error={errors.confirmPassword} required>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={onChange}
                error={!!errors.confirmPassword}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Address" htmlFor="address" error={errors.address} required>
              <Input id="address" name="address" placeholder="House no., street, area" value={form.address} onChange={onChange} error={!!errors.address} />
            </FormField>
          </div>

          <FormField label="City" htmlFor="city" error={errors.city} required>
            <Input id="city" name="city" placeholder="Kolhapur" value={form.city} onChange={onChange} error={!!errors.city} />
          </FormField>

          <FormField label="State" htmlFor="state" error={errors.state} required>
            <Input id="state" name="state" placeholder="Maharashtra" value={form.state} onChange={onChange} error={!!errors.state} />
          </FormField>

          <FormField label="Postal Code" htmlFor="postalCode" error={errors.postalCode} required>
            <Input id="postalCode" name="postalCode" placeholder="416001" value={form.postalCode} onChange={onChange} error={!!errors.postalCode} />
          </FormField>

          <div className="sm:col-span-2">
            <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
              Create Account
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
