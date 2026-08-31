import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ShoppingBag } from 'lucide-react';
import Input from '../components/Input.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { validateEmail, validateRequired } from '../utils/validators.js';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {
      email: validateEmail(form.email),
      password: validateRequired(form.password, 'Password'),
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
      const loggedInUser = await login(form.email, form.password);
      showToast('Welcome back!');

      // Admins/Content Managers land on their dashboard by default; a
      // deep-link (location.state.from) still takes priority for anyone
      // who was redirected here from a protected page.
      const roleHome =
        loggedInUser?.role === 'ADMIN' ? '/admin'
        : loggedInUser?.role === 'CONTENT_MANAGER' ? '/content-manager'
        : '/profile';
      const redirectTo = location.state?.from?.pathname || roleHome;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors);
      setFormError(err.message || 'Unable to log in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <ShoppingBag className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
          <p className="text-sm text-muted">Log in to continue to Cartify.</p>
        </div>

        {formError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
        )}

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <FormField label="Email" htmlFor="email" error={errors.email} required>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={onChange}
              error={!!errors.email}
            />
          </FormField>

          <FormField label="Password" htmlFor="password" error={errors.password} required>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={onChange}
                error={!!errors.password}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Log In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
