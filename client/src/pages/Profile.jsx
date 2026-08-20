import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Heart, Clock, Star, LogOut, Pencil, Save, X } from 'lucide-react';
import Input from '../components/Input.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { userService } from '../services/userService.js';
import { validateMobile, validatePostalCode, validateRequired } from '../utils/validators.js';

// Placeholder sections — real functionality arrives in later sections
// (Orders/Wishlist in Sections 2-3, Reviews once the catalogue exists).
const PLACEHOLDER_SECTIONS = [
  { icon: Package, title: 'Orders', description: 'Your order history will appear here once checkout is built.' },
  { icon: Heart, title: 'Wishlist', description: 'Saved products will appear here (Section 3).' },
  { icon: Clock, title: 'Recently Viewed', description: 'Your browsing activity will appear here (Section 4).' },
  { icon: Star, title: 'Ratings & Reviews', description: 'Reviews you write will appear here (Section 2+).' },
];

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    fullName: user?.full_name || '',
    mobile: user?.mobile || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    postalCode: user?.postal_code || '',
  });

  if (!user) return null;

  const initials = user.full_name
    ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const cancelEdit = () => {
    setForm({
      fullName: user.full_name || '',
      mobile: user.mobile || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      postalCode: user.postal_code || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  const onSave = async (e) => {
    e.preventDefault();
    const nextErrors = {
      fullName: validateRequired(form.fullName, 'Full name'),
      mobile: validateMobile(form.mobile),
      address: validateRequired(form.address, 'Address'),
      city: validateRequired(form.city, 'City'),
      state: validateRequired(form.state, 'State'),
      postalCode: validatePostalCode(form.postalCode),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSaving(true);
    try {
      const res = await userService.updateMe(form);
      updateUser(res.data.user);
      showToast('Profile updated successfully.');
      setIsEditing(false);
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors);
      showToast(err.message || 'Unable to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast('You have been logged out.');
    navigate('/');
  };

  return (
    <div className="container-page py-12">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="card flex flex-col items-center gap-4 p-6 text-center h-fit">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-ink">{user.full_name}</p>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
          <Button variant="secondary" onClick={handleLogout} className="mt-2 w-full">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </aside>

        {/* Main content */}
        <div className="flex flex-col gap-8">
          <div className="card p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Profile Information</h2>
              {!isEditing ? (
                <Button variant="ghost" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4" /> Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={cancelEdit}>
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <dl className="grid gap-5 sm:grid-cols-2">
                <ProfileField label="Full Name" value={user.full_name} />
                <ProfileField label="Email" value={user.email} />
                <ProfileField label="Mobile" value={user.mobile} />
                <ProfileField label="Postal Code" value={user.postal_code} />
                <ProfileField label="City" value={user.city} />
                <ProfileField label="State" value={user.state} />
                <div className="sm:col-span-2">
                  <ProfileField label="Address" value={user.address} />
                </div>
              </dl>
            ) : (
              <form onSubmit={onSave} className="grid gap-4 sm:grid-cols-2">
                <FormField label="Full Name" htmlFor="fullName" error={errors.fullName} required>
                  <Input id="fullName" name="fullName" value={form.fullName} onChange={onChange} error={!!errors.fullName} />
                </FormField>
                <FormField label="Mobile" htmlFor="mobile" error={errors.mobile} required>
                  <Input id="mobile" name="mobile" value={form.mobile} onChange={onChange} error={!!errors.mobile} />
                </FormField>
                <div className="sm:col-span-2">
                  <FormField label="Address" htmlFor="address" error={errors.address} required>
                    <Input id="address" name="address" value={form.address} onChange={onChange} error={!!errors.address} />
                  </FormField>
                </div>
                <FormField label="City" htmlFor="city" error={errors.city} required>
                  <Input id="city" name="city" value={form.city} onChange={onChange} error={!!errors.city} />
                </FormField>
                <FormField label="State" htmlFor="state" error={errors.state} required>
                  <Input id="state" name="state" value={form.state} onChange={onChange} error={!!errors.state} />
                </FormField>
                <FormField label="Postal Code" htmlFor="postalCode" error={errors.postalCode} required>
                  <Input id="postalCode" name="postalCode" value={form.postalCode} onChange={onChange} error={!!errors.postalCode} />
                </FormField>
                <div className="sm:col-span-2">
                  <Button type="submit" isLoading={isSaving} className="w-full">
                    <Save className="h-4 w-4" /> Save Changes
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Placeholder sections for future modules */}
          <div className="grid gap-4 sm:grid-cols-2">
            {PLACEHOLDER_SECTIONS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="card flex flex-col gap-2 p-6">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-ink">{title}</h3>
                </div>
                <p className="text-xs text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-ink">{value || '—'}</dd>
    </div>
  );
}
