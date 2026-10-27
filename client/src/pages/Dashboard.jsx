import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import ProductForm from '../components/product/ProductForm.jsx';
import ImageUpload from '../components/ui/ImageUpload.jsx';

const roleLabels = {
  Buyer: 'Buyer',
  Seller: 'Seller',
  Both: 'Buyer & Seller',
  Admin: 'Admin',
};

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || '?';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const currencySymbols = { SEK: 'kr', USD: '$', EUR: '€' };

const COUNTRY_CODES = [
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+46', label: '🇸🇪 +46' },
  { code: '+49', label: '🇩🇪 +49' },
  { code: '+33', label: '🇫🇷 +33' },
  { code: '+39', label: '🇮🇹 +39' },
  { code: '+81', label: '🇯🇵 +81' },
  { code: '+86', label: '🇨🇳 +86' },
  { code: '+61', label: '🇦🇺 +61' },
  { code: '+45', label: '🇩🇰 +45' },
  { code: '+7', label: '🇷🇺 +7' },
  { code: '+82', label: '🇰🇷 +82' },
  { code: '+84', label: '🇻🇳 +84' },
  { code: '+27', label: '🇿🇦 +27' },
  { code: '+55', label: '🇧🇷 +55' },
  { code: '+52', label: '🇲🇽 +52' },
];

const COUNTRIES = [
  { code: 'SE', label: '🇸🇪 Sweden' },
  { code: 'US', label: '🇺🇸 United States' },
  { code: 'GB', label: '🇬🇧 United Kingdom' },
  { code: 'IN', label: '🇮🇳 India' },
  { code: 'DE', label: '🇩🇪 Germany' },
  { code: 'FR', label: '🇫🇷 France' },
  { code: 'IT', label: '🇮🇹 Italy' },
  { code: 'JP', label: '🇯🇵 Japan' },
  { code: 'CN', label: '🇨🇳 China' },
  { code: 'AU', label: '🇦🇺 Australia' },
  { code: 'DK', label: '🇩🇰 Denmark' },
  { code: 'RU', label: '🇷🇺 Russia' },
  { code: 'KR', label: '🇰🇷 South Korea' },
  { code: 'VN', label: '🇻🇳 Vietnam' },
  { code: 'ZA', label: '🇿🇦 South Africa' },
  { code: 'BR', label: '🇧🇷 Brazil' },
  { code: 'MX', label: '🇲🇽 Mexico' },
  { code: 'CA', label: '🇨🇦 Canada' },
  { code: 'NL', label: '🇳🇱 Netherlands' },
  { code: 'NO', label: '🇳🇴 Norway' },
  { code: 'FI', label: '🇫🇮 Finland' },
  { code: 'CH', label: '🇨🇭 Switzerland' },
  { code: 'Other', label: '🌐 Other' },
];

const formatPrice = (price, currency) => {
  const symbol = currencySymbols[currency] || '$';
  return `${symbol}${Number.isInteger(price) ? price : price.toFixed(2)}`;
};

const emptyProfileForm = {
  name: '',
  phone: '',
  avatar: '',
  countryCode: '+1',
  customCountryCode: '',
  role: '',
  street: '',
  apartment: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  currentPassword: '',
  newPassword: '',
};

const navItems = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'products', label: 'My Products', icon: '📦' },
  { key: 'orders', label: 'Orders', icon: '🛒' },
  { key: 'profile', label: 'Profile Settings', icon: '⚙️' },
];

export default function Dashboard() {
  const { api, user, setUser } = useAuth();
  const navigate = useNavigate();
  const isSeller = user?.role === 'Seller' || user?.role === 'Both';

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [activeView, setActiveView] = useState('overview');
  const [message, setMessage] = useState('');
  const [alert, setAlert] = useState('');

  const [editing, setEditing] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resendState, setResendState] = useState('idle');
  const [verificationLink, setVerificationLink] = useState('');

  const roleLabel = roleLabels[user?.role] || user?.role;
  const userId = user?._id;

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      name: user.name || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
      street: user.address?.street || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      zipCode: user.address?.zipCode || '',
      country: user.address?.country || '',
    });
  }, [userId]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data.user);
    } catch {
      /* ignore */
    }
  }, [api, setUser]);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const { data } = await api.get('/api/products', {
        params: { limit: 100 },
      });
      setProducts(data.data);
    } catch (err) {
      setAlert(err.response?.data?.message || 'Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data } = await api.get('/api/orders');
      setOrders(data.data || []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchProducts();
    fetchOrders();
  }, [userId]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const onFocus = () => {
      refreshUser();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [refreshUser]);

  const handleResendVerification = async () => {
    setResendState('loading');
    setMessage('');
    setAlert('');
    setVerificationLink('');
    try {
      const { data } = await api.post('/api/auth/resend-verification');
      setResendState('sent');
      setMessage(data.message || 'Verification email sent');
    } catch (err) {
      setResendState('idle');
      setAlert(err.response?.data?.message || 'Failed to send verification email');
      const link = err.response?.data?.verificationUrl;
      if (link) setVerificationLink(link);
    }
  };

  const saveProduct = async (payload) => {
    try {
      if (editing) {
        const { data } = await api.put(`/api/products/${editing._id}`, payload);
        setProducts((prev) => prev.map((p) => (p._id === editing._id ? data.data : p)));
        setEditing(null);
        setMessage('Product updated successfully');
      } else {
        const { data } = await api.post('/api/products', payload);
        setProducts((prev) => [data.data, ...prev]);
        setMessage('Product created successfully');
      }
      setAlert('');
      return { ok: true };
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (backendErrors?.length) {
        const fieldErrors = {};
        backendErrors.forEach(({ field, message }) => {
          fieldErrors[field] = message;
        });
        return { ok: false, fieldErrors };
      }
      return {
        ok: false,
        message: err.response?.data?.message || 'Failed to save product.',
      };
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      if (editing?._id === id) setEditing(null);
      setMessage('Product deleted');
      setAlert('');
    } catch (err) {
      setAlert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setSavingProfile(true);
    try {
      const finalCode =
        profileForm.countryCode === 'Other' && profileForm.customCountryCode
          ? profileForm.customCountryCode
          : profileForm.countryCode;

      const { data } = await api.put('/api/auth/profile', {
        name: profileForm.name,
        phone: `${finalCode} ${profileForm.phone}`.trim(),
        avatar: profileForm.avatar,
        role: profileForm.role,
        address: {
          street: profileForm.street,
          apartment: profileForm.apartment,
          city: profileForm.city,
          state: profileForm.state,
          zipCode: profileForm.zipCode,
          country: profileForm.country,
        },
      });
      setUser(data.user);
      setEditingProfile(false);
      setMessage('Profile updated successfully');

      if (profileForm.newPassword) {
        try {
          await api.post('/api/auth/change-password', {
            currentPassword: profileForm.currentPassword,
            newPassword: profileForm.newPassword,
          });
        } catch (pwErr) {
          setAlert(pwErr.response?.data?.message || 'Profile updated, but password change failed');
        }
      }
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (backendErrors?.length) {
        setProfileError(backendErrors.map((e) => e.message).join(' '));
      } else {
        setProfileError(err.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const startEditProfile = () => {
    const storedPhone = user?.phone || '';
    const countryCodeMatch = storedPhone.match(/^(\+\d+)\s/);
    const extractedCode = countryCodeMatch ? countryCodeMatch[1] : '+1';
    const extractedNumber = countryCodeMatch
      ? storedPhone.slice(countryCodeMatch[1].length).trim()
      : storedPhone;
    const isCustomCode = !COUNTRY_CODES.some((c) => c.code === extractedCode);

    setProfileForm({
      name: user?.name || '',
      phone: extractedNumber,
      avatar: user?.avatar || '',
      countryCode: isCustomCode ? 'Other' : extractedCode,
      customCountryCode: isCustomCode ? extractedCode : '',
      role: user?.role || 'Buyer',
      street: user?.address?.street || '',
      apartment: user?.address?.apartment || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || '',
    });
    setProfileError('');
    setEditingProfile(true);
  };

  const addressLine = user?.address
    ? [user.address.street, user.address.city, user.address.state, user.address.zipCode, user.address.country]
        .filter(Boolean)
        .join(', ')
    : '';

  const statusBadge = (verified) => (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        verified
          ? 'bg-[#DEF7EC] text-[#03543F]'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {verified ? '✓ Verified' : 'Unverified'}
    </span>
  );

  const emptyState = ({ icon, title, description, action, actionLabel }) => (
    <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && actionLabel && (
        <button
          type="button"
          onClick={action}
          className="mt-4 inline-block rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );

  const availableProducts = products.filter((p) => p.seller?._id !== user?._id);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {!user?.isEmailVerified && (
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
            <p className="text-sm font-semibold text-yellow-900">Verify your email address</p>
            <p className="text-sm text-yellow-800">
              We sent a verification link to <span className="font-medium">{user?.email}</span>. Open it to
              activate your account - nothing is verified automatically.
            </p>
            {verificationLink && (
              <p className="mt-2 text-xs text-yellow-800">
                Email delivery is not configured on the server. Open this link to verify:{' '}
                <a href={verificationLink} className="font-medium underline break-all">
                  {verificationLink}
                </a>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendState === 'loading' || resendState === 'sent'}
            className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-xs font-semibold text-yellow-800 shadow-sm hover:bg-yellow-100 disabled:opacity-60 transition-colors"
          >
            {resendState === 'loading'
              ? 'Sending...'
              : resendState === 'sent'
                ? 'Email sent'
                : 'Resend verification email'}
          </button>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0 hidden lg:block">
            <div className="space-y-1">
              {navItems.map((item) => {
                const active = activeView === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActiveView(item.key);
                      setEditing(null);
                      setMessage('');
                      setAlert('');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeView === 'overview' && 'Overview'}
                  {activeView === 'products' && 'My Products'}
                  {activeView === 'orders' && 'Orders'}
                  {activeView === 'profile' && 'Profile Settings'}
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.name}. Manage your store from here.
                </p>
              </div>
              {isSeller && activeView === 'products' && (
                <Link
                  to="/dashboard/add-product"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span>+</span> Add product
                </Link>
              )}
            </header>

            {message && (
              <div className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
                {message}
              </div>
            )}
            {alert && (
              <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                {alert}
              </div>
            )}

            {/* Overview */}
            {activeView === 'overview' && (
              <>
                <section className="rounded-xl border bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user?.name || 'Profile'}
                          className="h-14 w-14 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700 border border-blue-200">
                          {initials(user?.name)}
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-semibold">Welcome back, {user?.name}!</h2>
                        <p className="text-sm text-gray-500">
                          Member since {formatDate(user?.createdAt)} · {roleLabel || 'Account'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {isSeller && (
                        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center shadow-sm">
                          <p className="text-lg font-semibold text-blue-600">{products.length}</p>
                          <p className="text-xs text-gray-500">Products</p>
                        </div>
                      )}
                      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center shadow-sm">
                        <p className="text-lg font-semibold text-gray-700">{orders.length}</p>
                        <p className="text-xs text-gray-500">Orders</p>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Available Products */}
            {activeView === 'overview' && (
              <section className="mt-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Available Products</h2>
                  <p className="text-sm text-gray-500">
                    {availableProducts.length} product(s) available
                  </p>
                </div>
                {productsLoading ? (
                  <div className="text-sm text-gray-500">Loading products...</div>
                ) : availableProducts.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No products available at the moment.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                    {availableProducts.map((p) => (
                      <div
                        key={p._id}
                        className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                          <Link to={`/products/${p._id}`} className="block">
                            {p.images?.[0] ? (
                              <img
                                src={(p.images?.[0]?.url ?? p.images?.[0]) || 'https://placehold.co/400x300?text=No+Image'}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                                No image
                              </div>
                            )}
                          </Link>
                        </div>
                        <h3 className="line-clamp-1 font-medium text-gray-900">{p.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {formatPrice(p.price, p.currency)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          By {p.seller?.email || 'Seller'}
                        </p>
                        <Link
                          to={`/products/${p._id}`}
                          className="mt-auto inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                        >
                          Select <span>→</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* My Products */}
            {activeView === 'products' && isSeller && (
              <>
                {editing ? (
                  <section className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(null);
                          setMessage('');
                          setAlert('');
                        }}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        &larr; Back
                      </button>
                      <h2 className="text-lg font-semibold text-gray-900">Edit Product</h2>
                    </div>
                    <ProductForm
                      key="edit"
                      product={editing}
                      onSave={saveProduct}
                      onCancel={() => setEditing(null)}
                      submitLabel="Update Product"
                    />
                  </section>
                ) : (
                  <>
                    <section className="rounded-xl border bg-white p-6 shadow-sm">
                      <h2 className="mb-4 text-lg font-semibold text-gray-900">My Products</h2>
                      {productsLoading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                      ) : products.length === 0 ? (
                        emptyState({
                          icon: '📦',
                          title: 'No products yet',
                          description: 'Publish your first product to start selling.',
                          action: () => navigate('/dashboard/add-product'),
                          actionLabel: 'Add product',
                        })
                      ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {products.map((p) => (
                            <div
                              key={p._id}
                              className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                            >
                              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                                {p.images?.[0] ? (
                                  <img
                                    src={(p.images?.[0]?.url ?? p.images?.[0]) || 'https://placehold.co/400x300?text=No+Image'}
                                    alt={p.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                                    No image
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="line-clamp-1 font-medium text-gray-900">{p.title}</h3>
                                <p className="mt-1 text-sm text-gray-600">
                                  {formatPrice(p.price, p.currency)} · Stock: {p.inventory}
                                </p>
                                <p className="mt-1 text-xs capitalize text-gray-500">{p.category}</p>
                                <div className="mt-4 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditing(p);
                                      setMessage('');
                                      setAlert('');
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 shadow-sm hover:bg-blue-50 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(p._id)}
                                    className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-100 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </>
                )}
              </>
            )}

            {/* Orders */}
            {activeView === 'orders' && (
              <section className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">My Orders</h2>
                {ordersLoading ? (
                  <div className="text-sm text-gray-500">Loading...</div>
                ) : orders.length === 0 ? (
                  emptyState({
                    icon: '🛒',
                    title: 'No orders yet',
                    description: 'Your orders will appear here once customers purchase your products.',
                  })
                ) : (
                  <ul className="space-y-3">
                    {orders.map((o) => (
                      <li key={o._id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">
                            {formatPrice(o.totalPrice, 'USD')}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              o.orderStatus === 'delivered'
                                ? 'bg-[#DEF7EC] text-[#03543F]'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {o.orderStatus}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          {formatDate(o.createdAt)} · {o.items?.length || 0} item(s) · {o.paymentStatus}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* Profile Settings */}
            {activeView === 'profile' && (
              <section className="rounded-xl border bg-white p-6 shadow-sm max-w-2xl">
                <h2 className="mb-6 text-lg font-semibold text-gray-900">Profile Settings</h2>

                <div className="mb-6 flex items-center gap-3">
                  {!editingProfile && (
                    <>
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user?.name || 'Profile'}
                          className="h-16 w-16 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-semibold text-blue-700 border border-blue-200">
                          {initials(user?.name)}
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{user?.name || '—'}</h3>
                    <p className="text-xs text-gray-500">{user?.email || '—'}</p>
                  </div>
                </div>

                {!editingProfile && (
                  <>
                    {/* Account Overview - read-only statuses side by side */}
                    <section className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm mb-6">
                      <h3 className="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Account overview
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                            Account type
                          </p>
                          <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 block text-center">
                            {roleLabel || '—'}
                          </span>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                            Email verified
                          </p>
                          <div className="flex items-center justify-center gap-1.5">
                            {statusBadge(!!user?.isEmailVerified)}
                          </div>
                        </div>
                         {!user?.isEmailVerified && (
                           <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                             <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                               Verified seller
                             </p>
                             <div className="flex items-center justify-center gap-2">
                               {statusBadge(!!user?.isVerified)}
                               {!user?.isVerified && (
                                 <Link
                                   to="/products"
                                   className="text-xs font-medium text-blue-600 hover:underline"
                                 >
                                   Apply for verification
                                 </Link>
                               )}
                             </div>
                           </div>
                         )}
                      </div>
                    </section>

                    <div className="mt-6 flex gap-2">
                      <button
                        type="button"
                        onClick={startEditProfile}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        Edit profile
                      </button>
                    </div>
                  </>
                )}

                {editingProfile && (
                  <form onSubmit={saveProfile} className="space-y-5" noValidate>
                    {profileError && (
                      <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-800">
                        {profileError}
                      </p>
                    )}

                    <div>
                      <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-gray-700">
                        Full name
                      </label>
                      <input
                        id="profile-name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="profile-role" className="mb-1.5 block text-sm font-medium text-gray-700">
                        Account type
                      </label>
                      <select
                        id="profile-role"
                        value={profileForm.role}
                        onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="Buyer">Buyer</option>
                        <option value="Seller">Seller</option>
                        <option value="Both">Buyer &amp; Seller</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <div
                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors relative"
                      >
                        <select
                          id="profile-country-code"
                          value={profileForm.countryCode}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              countryCode: e.target.value,
                              customCountryCode:
                                e.target.value === 'Other'
                                  ? profileForm.customCountryCode || ''
                                  : '',
                            })
                          }
                          className="border-none bg-transparent px-2 py-2 text-sm text-gray-700 focus:ring-0 sm:px-2 appearance-none cursor-pointer pr-6"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label}
                            </option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                        {profileForm.countryCode === 'Other' && (
                          <input
                            type="text"
                            value={profileForm.customCountryCode}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                customCountryCode: e.target.value,
                              })
                            }
                            placeholder="+45"
                            className="w-16 border-none bg-transparent px-1 py-2 text-sm text-gray-700 focus:ring-0 sm:px-1"
                          />
                        )}
                        <input
                          id="profile-phone"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, phone: e.target.value })
                          }
                          placeholder="555 000 0000"
                          className="flex-1 border-none bg-transparent px-2 py-2 text-sm text-gray-700 focus:ring-0 sm:px-2"
                        />
                      </div>
                    </div>
                    <div>
                      <ImageUpload
                        single
                        label="Profile picture"
                        initialUrls={profileForm.avatar}
                        disabled={savingProfile}
                        onChange={() => {}}
                        onImagesChange={(url) =>
                          setProfileForm({ ...profileForm, avatar: url })
                        }
                      />
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-5">
                      <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-4">
                        Change Password
                      </h3>
                      <div>
                        <label htmlFor="profile-current-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                          Current password
                        </label>
                        <div className="relative w-full">
                          <input
                            id="profile-current-password"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={profileForm.currentPassword}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, currentPassword: e.target.value })
                            }
                            placeholder="••••••••"
                            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                          >
                            {showCurrentPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label htmlFor="profile-new-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                          New password
                        </label>
                        <div className="relative w-full">
                          <input
                            id="profile-new-password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={profileForm.newPassword}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, newPassword: e.target.value })
                            }
                            placeholder="••••••••"
                            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                          >
                            {showNewPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-5">
                      <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-4">
                        Address
                      </h3>
                      <div>
                        <label htmlFor="profile-country" className="mb-1.5 block text-sm font-medium text-gray-700">
                          Country
                        </label>
                        <select
                          id="profile-country"
                          value={profileForm.country}
                          onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Select a country</option>
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-4">
                        <label htmlFor="profile-street" className="mb-1.5 block text-sm font-medium text-gray-700">
                          Street address
                        </label>
                        <input
                          id="profile-street"
                          value={profileForm.street}
                          onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
                          placeholder="Storgatan 12, Apt 4B"
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="mt-4">
                        <label htmlFor="profile-apartment" className="mb-1.5 block text-sm font-medium text-gray-700">
                          Apartment / suite (optional)
                        </label>
                        <input
                          id="profile-apartment"
                          value={profileForm.apartment}
                          onChange={(e) => setProfileForm({ ...profileForm, apartment: e.target.value })}
                          placeholder="Apt 4B"
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="profile-city" className="mb-1.5 block text-sm font-medium text-gray-700">
                            City
                          </label>
                          <input
                            id="profile-city"
                            value={profileForm.city}
                            onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                            placeholder="Stockholm"
                            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label htmlFor="profile-state" className="mb-1.5 block text-sm font-medium text-gray-700">
                            State / province
                          </label>
                          <input
                            id="profile-state"
                            value={profileForm.state}
                            onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                            placeholder="Stockholms län"
                            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label htmlFor="profile-zip" className="mb-1.5 block text-sm font-medium text-gray-700">
                            Postal code
                          </label>
                          <input
                            id="profile-zip"
                            value={profileForm.zipCode}
                            onChange={(e) => setProfileForm({ ...profileForm, zipCode: e.target.value })}
                            placeholder="111 22"
                            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingProfile(false)}
                        disabled={savingProfile}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {savingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}

            {/* Buyer fallback for products view */}
            {activeView === 'products' && !isSeller && (
              <section className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Start selling</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Your account is set up as a buyer. Switch to a seller account to publish and manage
                  products from this page.
                </p>
                <Link
                  to="/products"
                  className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Browse products
                </Link>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
