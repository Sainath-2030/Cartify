import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Heart, Clock, Star, LogOut, Pencil, Save, X, Sparkles, ArrowUpRight } from 'lucide-react';
import Input from '../components/Input.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { userService } from '../services/userService.js';
import { validateMobile, validatePostalCode, validateRequired } from '../utils/validators.js';

const PLACEHOLDER_SECTIONS = [
  { icon: Package, title: 'Orders', description: 'Your order history and tracked packages.' },
  { icon: Heart, title: 'Wishlist', description: 'Saved products and personalized notifications.' },
  { icon: Clock, title: 'Recently Viewed', description: 'Your browsing history across this session.' },
  { icon: Star, title: 'Ratings & Reviews', description: 'Feedback and specifications you have rated.' },
];

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [form, setForm] = useState({
    fullName: user?.full_name || '',
    mobile: user?.mobile || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    postalCode: user?.postal_code || '',
  });

  useEffect(() => {
    if (!user) return;
    const fetchRecs = async () => {
      try {
        setRecLoading(true);
        const res = await userService.getRecommendations(4);
        setRecommendations(res.data?.recommendations || []);
      } catch (err) {
        console.warn('Failed to load user recommendations:', err);
      } finally {
        setRecLoading(false);
      }
    };
    fetchRecs();
  }, [user]);

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
    <div className="container-page py-10 bg-surface min-h-screen">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="card flex flex-col items-center gap-4 p-6 text-center h-fit border border-border-subtle bg-card rounded-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card-elevated border border-border-subtle text-xl font-bold text-accent">
            {initials}
          </div>
          <div>
            <p className="text-base font-semibold text-ink">{user.full_name}</p>
            <p className="text-xs text-muted mt-0.5">{user.email}</p>
          </div>
          <Button variant="secondary" onClick={handleLogout} className="mt-2 w-full text-xs">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </aside>

        {/* Main content */}
        <div className="flex flex-col gap-6">
          <div className="card p-6 border border-border-subtle bg-card rounded-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Account details</h2>
              {!isEditing ? (
                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit details
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
              )}
            </div>

            {!isEditing ? (
              <dl className="grid gap-5 sm:grid-cols-2">
                <ProfileField label="Full name" value={user.full_name} />
                <ProfileField label="Email" value={user.email} />
                <ProfileField label="Mobile" value={user.mobile} />
                <ProfileField label="Postal code" value={user.postal_code} />
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
                  <Button type="submit" variant="primary" isLoading={isSaving} className="w-full">
                    <Save className="h-4 w-4" /> Save changes
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* AI Personalized Recommendations */}
          <div className="card flex flex-col gap-4 p-6 border border-border-subtle bg-card rounded-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-ink">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Recommended for You (AI-Powered)</h3>
                  <p className="text-[11px] text-muted">Personalized picks trained on your recent browsing & shopping affinity.</p>
                </div>
              </div>
              <Link to="/products" className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
                Explore All <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recLoading ? (
              <div className="flex min-h-[140px] items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : recommendations.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {recommendations.map((rec) => (
                  <Link
                    key={rec.productId}
                    to={`/products/${rec.slug || rec.productId}`}
                    className="group flex flex-col justify-between rounded-xl border border-border-subtle bg-card-elevated p-3 transition-all hover:border-accent hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-bold text-muted border border-border-subtle">
                          Rank #{rec.rank}
                        </span>
                        <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                          {rec.affinityPercentage}% Match
                        </span>
                      </div>
                      <div className="my-2.5 flex h-24 items-center justify-center overflow-hidden rounded-lg bg-surface p-1">
                        <img
                          src={rec.mainImage || '/placeholder.png'}
                          alt={rec.name}
                          className="h-20 w-20 object-contain transition group-hover:scale-105"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&fit=crop&q=80';
                          }}
                        />
                      </div>
                      <div className="text-[10px] font-semibold text-muted">{rec.brand}</div>
                      <h4 className="line-clamp-2 text-xs font-bold text-ink mt-0.5" title={rec.name}>
                        {rec.name}
                      </h4>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-border-subtle pt-2">
                      <span className="text-xs font-extrabold text-ink">
                        ₹{Number(rec.finalPrice || rec.price || 0).toLocaleString('en-IN')}
                      </span>
                      {rec.rating > 0 && (
                        <span className="text-[10px] font-semibold text-amber-500">★ {rec.rating}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted text-center py-4">Browse more items to receive tailored neural recommendations.</p>
            )}
          </div>

          {/* Placeholder sections */}
          <div className="grid gap-4 sm:grid-cols-2">
            {PLACEHOLDER_SECTIONS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="card flex flex-col gap-2 p-5 border border-border-subtle bg-card rounded-2xl">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-semibold text-ink">{title}</h3>
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
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{value || '—'}</dd>
    </div>
  );
}
