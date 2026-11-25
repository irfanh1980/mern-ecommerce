import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Check, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import ProductForm from '../components/product/ProductForm.jsx';
import ImageUpload from '../components/ui/ImageUpload.jsx';
import Favorites from './Favorites.jsx';

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

const formatPrice = (price, currency) => {
  const symbol = currencySymbols[currency] || '$';
  return `${symbol}${Number.isInteger(price) ? price : price.toFixed(2)}`;
};

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

const navItems = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'products', label: 'My ads', icon: '📦' },
  { key: 'orders', label: 'Orders', icon: '🛒' },
  { key: 'available', label: 'Available Products', icon: '🛍️' },
  { key: 'favorites', label: 'My favorites', icon: '❤️' },
];

export default function MyProfile() {
  const { api, user, setUser } = useAuth();
  const navigate = useNavigate();
  const isSeller = user?.role === 'Seller' || user?.role === 'Both' || user?.role === 'Admin';

  const [recentUsers, setRecentUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [overviewProducts, setOverviewProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [activeView, setActiveView] = useState('overview');
  const [message, setMessage] = useState('');
  const [alert, setAlert] = useState('');

  const [editing, setEditing] = useState(null);
  const [resendState, setResendState] = useState('idle');
  const [verificationLink, setVerificationLink] = useState('');

  const [phoneError, setPhoneError] = useState('');
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationForm, setLocationForm] = useState({ street: '', apartment: '', city: '', state: '', zipCode: '', country: '' });
  const [savingLocation, setSavingLocation] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneEditForm, setPhoneEditForm] = useState({ countryCode: '+1', customCountryCode: '', phone: '' });
  const [savingPhone, setSavingPhone] = useState(false);
  const [editingDob, setEditingDob] = useState(false);
  const [dobEditValue, setDobEditValue] = useState('');
  const [savingDob, setSavingDob] = useState(false);
  const [editingAccountType, setEditingAccountType] = useState(false);
  const [accountTypeValue, setAccountTypeValue] = useState('Buyer');
  const [savingAccountType, setSavingAccountType] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioEditValue, setBioEditValue] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordVisibility, setPasswordVisibility] = useState({ old: false, new: false, confirm: false });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const roleLabel = roleLabels[user?.role] || user?.role;
  const userId = user?._id;

  useEffect(() => {
    if (!user) return;
    const storedPhone = user.phone || '';
    const countryCodeMatch = storedPhone.match(/^(\+\d+)\s/);
    const extractedCode = countryCodeMatch ? countryCodeMatch[1] : '+1';
    const extractedNumber = countryCodeMatch
      ? storedPhone.slice(countryCodeMatch[1].length).trim()
      : storedPhone;
    const isCustomCode = !COUNTRY_CODES.some((c) => c.code === extractedCode);

    setProfileForm({
      name: user.name || '',
      bio: user.bio || '',
      phone: extractedNumber,
      avatar: user.avatar || '',
      countryCode: isCustomCode ? 'Other' : extractedCode,
      customCountryCode: isCustomCode ? extractedCode : '',
      role: user.role || 'Buyer',
      street: user.address?.street || '',
      apartment: user.address?.apartment || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      zipCode: user.address?.zipCode || '',
      country: user.address?.country || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
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
        params: { seller: userId, limit: 100 },
      });
      const myProducts = data.data || [];
      setProducts(myProducts);
      if (user?.role?.toLowerCase() === 'admin') {
        try {
          const { data: udata } = await api.get('/api/admin/users', { params: { limit: 5 } });
          setRecentUsers(udata.data || udata.users || []);
        } catch (e) {}
      }
    } catch (err) {
      setAlert(err.response?.data?.message || 'Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchOverviewProducts = async () => {
    try {
      const { data } = await api.get('/api/products', {
        params: { limit: 100, isActive: 'true' },
      });
      setOverviewProducts(data.data || []);
    } catch (err) {
      // ignore
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
    fetchOverviewProducts();
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

  const saveLocation = async () => {
    setSavingLocation(true);
    try {
      const { data } = await api.put('/api/auth/profile', {
        address: {
          street: locationForm.street,
          apartment: locationForm.apartment,
          city: locationForm.city,
          state: locationForm.state,
          zipCode: locationForm.zipCode,
          country: locationForm.country,
        },
      });
      setUser(data.user);
      setEditingLocation(false);
      setMessage('Address updated successfully');
    } catch (err) {
      setAlert(err.response?.data?.message || 'Failed to update address');
    } finally {
      setSavingLocation(false);
    }
  };

  const startEditLocation = () => {
    setLocationForm({
      street: user?.address?.street || '',
      apartment: user?.address?.apartment || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || '',
    });
    setEditingLocation(true);
  };

  const savePhone = async () => {
    setSavingPhone(true);
    try {
      const finalCode =
        phoneEditForm.countryCode === 'Other' && phoneEditForm.customCountryCode
          ? phoneEditForm.customCountryCode
          : phoneEditForm.countryCode;
      const cleanPhone = phoneEditForm.phone.replace(/^\+\d+\s*/, '');
      const { data } = await api.put('/api/auth/profile', {
        phone: cleanPhone ? `${finalCode} ${cleanPhone}`.trim() : '',
      });
      setUser(data.user);
      setEditingPhone(false);
      setMessage('Phone updated successfully');
    } catch (err) {
      setAlert(err.response?.data?.message || 'Failed to update phone');
    } finally {
      setSavingPhone(false);
    }
  };

  const startEditPhone = () => {
    const storedPhone = user?.phone || '';
    const countryCodeMatch = storedPhone.match(/^(\+\d+)\s/);
    const extractedCode = countryCodeMatch ? countryCodeMatch[1] : '+1';
    const extractedNumber = countryCodeMatch
      ? storedPhone.slice(countryCodeMatch[1].length).trim()
      : storedPhone;
    const isCustomCode = !COUNTRY_CODES.some((c) => c.code === extractedCode);
    setPhoneEditForm({
      countryCode: isCustomCode ? 'Other' : extractedCode,
      customCountryCode: isCustomCode ? extractedCode : '',
      phone: extractedNumber,
    });
    setEditingPhone(true);
  };

  const saveDob = async () => {
    setSavingDob(true);
    try {
      const { data } = await api.put('/api/auth/profile', {
        dateOfBirth: dobEditValue || null,
      });
      setUser(data.user);
      setEditingDob(false);
      setMessage('Date of birth updated successfully');
    } catch (err) {
      setAlert(err.response?.data?.message || 'Failed to update date of birth');
    } finally {
      setSavingDob(false);
    }
  };

  const startEditDob = () => {
    setDobEditValue(user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '');
    setEditingDob(true);
  };

  const saveAccountType = async () => {
    setSavingAccountType(true);
    try {
      const { data } = await api.put('/api/auth/profile', {
        role: accountTypeValue,
      });
      setUser(data.user);
      setEditingAccountType(false);
      setMessage('Account type updated successfully');
    } catch (err) {
      setAlert(err.response?.data?.message || 'Failed to update account type');
    } finally {
      setSavingAccountType(false);
    }
  };

  const startEditAccountType = () => {
    setAccountTypeValue(user?.role || 'Buyer');
    setEditingAccountType(true);
  };

  const startEditBio = () => {
    setBioEditValue(user?.bio || '');
    setEditingBio(true);
  };

  const saveBio = async () => {
    setSavingBio(true);
    try {
      const { data } = await api.put('/api/auth/profile', {
        bio: bioEditValue,
      });
      setUser(data.user);
      setEditingBio(false);
      setMessage('About you updated successfully');
    } catch (err) {
      setAlert(err.response?.data?.message || 'Failed to update bio');
    } finally {
      setSavingBio(false);
    }
  };

  const startEditPassword = () => {
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setEditingPassword(true);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setAlert('Avatar must be a PNG or JPG image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAlert('Avatar image must be 5 MB or smaller');
      return;
    }
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('images', file);
      const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/uploads`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Avatar upload failed');
      }
      const avatarUrl = data.data.images?.[0]?.url;
      if (!avatarUrl) throw new Error('No image URL returned');
      const { data: profileData } = await api.put('/api/auth/profile', {
        avatar: avatarUrl,
      });
      setUser(profileData.user);
      setMessage('Profile picture updated successfully');
    } catch (err) {
      setAlert(err.response?.data?.message || err.message || 'Failed to update profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const savePassword = async () => {
    setPasswordError('');
    if (!passwordForm.oldPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await api.post('/api/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setEditingPassword(false);
      setMessage('Password changed successfully');
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (backendErrors?.length) {
        setPasswordError(backendErrors.map((e) => e.message).join(' '));
      } else {
        setPasswordError(err.response?.data?.message || 'Failed to change password');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const addressLine = user?.address
    ? [user.address.street, user.address.city, user.address.state, user.address.zipCode, user.address.country]
        .filter(Boolean)
        .join(', ')
    : '';

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

  const availableProducts = overviewProducts.filter((p) => p.seller?._id !== user?._id && p.seller !== user?._id);

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
                  {activeView === 'products' && 'My ads'}
                  {activeView === 'orders' && 'Orders'}
                  {activeView === 'available' && 'Available Products'}
                  {activeView === 'favorites' && 'My favorites'}
                  {activeView === 'profile' && 'Edit profile'}
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.name}. Manage your store from here.
                </p>
              </div>
              {isSeller && activeView === 'products' && (
                <Link
                  to="/my-profile/add-product"
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
                {/* Welcome header + stat cards */}
                <section className="rounded-xl border bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="group relative h-14 w-14 flex-shrink-0 rounded-full overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors disabled:opacity-60"
                        aria-label="Change profile picture"
                        title="Change profile picture"
                      >
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user?.name || 'Profile'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center bg-blue-100 text-lg font-semibold text-blue-700">
                            {initials(user?.name)}
                          </span>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          {uploadingAvatar ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <Pencil size={16} className="text-white" />
                          )}
                        </span>
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <div>
                        <h2 className="text-lg font-semibold">Welcome back, {user?.name}!</h2>
                        <p className="text-sm text-gray-500">
                          Member since {formatDate(user?.createdAt)} · {roleLabel || 'Account'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {isSeller && (
                        <div onClick={() => navigate('/seller/my-profile')} className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 text-center shadow-sm">
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

                {/* User details */}
                <section className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
                  {/* Row 1: Email + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-700">Email</p>
                      <p className="text-sm text-gray-700">{user?.email || '—'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-700">Phone</p>
                      {!editingPhone ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">{user?.phone || '—'}</span>
                          <button
                            type="button"
                            onClick={startEditPhone}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            aria-label="Edit phone"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <select
                            value={phoneEditForm.countryCode}
                            onChange={(e) =>
                              setPhoneEditForm({
                                ...phoneEditForm,
                                countryCode: e.target.value,
                                customCountryCode:
                                  e.target.value === 'Other'
                                    ? phoneEditForm.customCountryCode || ''
                                    : '',
                              })
                            }
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            {COUNTRY_CODES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.label}
                              </option>
                            ))}
                            <option value="Other">Other</option>
                          </select>
                          {phoneEditForm.countryCode === 'Other' && (
                            <input
                              type="text"
                              value={phoneEditForm.customCountryCode}
                              onChange={(e) =>
                                setPhoneEditForm({
                                  ...phoneEditForm,
                                  customCountryCode: e.target.value.replace(/[^\d+]/g, ''),
                                })
                              }
                              placeholder="+45"
                              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                          )}
                          <input
                            type="tel"
                            value={phoneEditForm.phone}
                            onChange={(e) =>
                              setPhoneEditForm({ ...phoneEditForm, phone: e.target.value.replace(/[^\d\s-]/g, '') })
                            }
                            placeholder="555 000 0000"
                            maxLength="20"
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={savePhone}
                              disabled={savingPhone}
                              className="flex-1 rounded-lg bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1"
                            >
                              <Check size={12} /> {savingPhone ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPhone(false)}
                              disabled={savingPhone}
                              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-1"
                            >
                              <X size={12} /> Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address - full width separated */}
                  <div className="border-b border-gray-100 pb-6 mb-6">
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-700">Address</p>
                      {!editingLocation ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">
                            {user?.address?.street || user?.address?.apartment || user?.address?.city || user?.address?.state || user?.address?.zipCode || user?.address?.country ? (
                              <>
                                {user?.address?.street && `${user.address.street}, `}
                                {user?.address?.city && `${user.address.city}, `}
                                {user?.address?.state && `${user.address.state} `}
                                {user?.address?.zipCode && user.address.zipCode}
                                {user?.address?.country && ` · ${user.address.country}`}
                              </>
                            ) : (
                              '—'
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={startEditLocation}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            aria-label="Edit address"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            value={locationForm.street}
                            onChange={(e) => setLocationForm({ ...locationForm, street: e.target.value })}
                            placeholder="Street address"
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <input
                            value={locationForm.apartment}
                            onChange={(e) => setLocationForm({ ...locationForm, apartment: e.target.value })}
                            placeholder="Apartment, suite, etc. (optional)"
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={locationForm.city}
                              onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                              placeholder="City"
                              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <input
                              value={locationForm.state}
                              onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })}
                              placeholder="State / Region"
                              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={locationForm.zipCode}
                              onChange={(e) => setLocationForm({ ...locationForm, zipCode: e.target.value })}
                              placeholder="ZIP / Postal code"
                              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <select
                              value={locationForm.country}
                              onChange={(e) => setLocationForm({ ...locationForm, country: e.target.value })}
                              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                              <option value="">Select country</option>
                              {COUNTRIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={saveLocation}
                              disabled={savingLocation}
                              className="flex-1 rounded-lg bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1"
                            >
                              <Check size={12} /> {savingLocation ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingLocation(false)}
                              disabled={savingLocation}
                              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-1"
                            >
                              <X size={12} /> Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: DOB + Email verified + Account type */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-700">Date of birth</p>
                      {!editingDob ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">{user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '—'}</span>
                          <button
                            type="button"
                            onClick={startEditDob}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            aria-label="Edit date of birth"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="date"
                            value={dobEditValue}
                            onChange={(e) => setDobEditValue(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={saveDob}
                              disabled={savingDob}
                              className="flex-1 rounded-lg bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1"
                            >
                              <Check size={12} /> {savingDob ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingDob(false)}
                              disabled={savingDob}
                              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-1"
                            >
                              <X size={12} /> Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-700">Email verified</p>
                      <div className="flex items-center gap-1.5">
                        {statusBadge(!!user?.isEmailVerified)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-700">Account type</p>
                      {!editingAccountType ? (
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700">
                            {roleLabel || '—'}
                          </span>
                          <button
                            type="button"
                            onClick={startEditAccountType}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            aria-label="Edit account type"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <select
                            value={accountTypeValue}
                            onChange={(e) => setAccountTypeValue(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <option value="Buyer">Buyer</option>
                            <option value="Seller">Seller</option>
                            <option value="Both">Buyer &amp; Seller</option>
                            {user?.role === 'Admin' && <option value="Admin">Admin</option>}
                          </select>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={saveAccountType}
                              disabled={savingAccountType}
                              className="flex-1 rounded-lg bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1"
                            >
                              <Check size={12} /> {savingAccountType ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingAccountType(false)}
                              disabled={savingAccountType}
                              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-1"
                            >
                              <X size={12} /> Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* About you - full width separated */}
                  <div className="border-b border-gray-100 pb-6 mb-6">
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-700">About you</p>
                      {!editingBio ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">{user?.bio?.trim() ? user.bio : 'No bio added yet.'}</span>
                          <button
                            type="button"
                            onClick={startEditBio}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            aria-label="Edit about you"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            value={bioEditValue}
                            onChange={(e) => setBioEditValue(e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder="Tell others about yourself"
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
                          />
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={saveBio}
                              disabled={savingBio}
                              className="flex-1 rounded-lg bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1"
                            >
                              <Check size={12} /> {savingBio ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingBio(false)}
                              disabled={savingBio}
                              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-1"
                            >
                              <X size={12} /> Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Password - full width */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-700">Password</p>
                    {!editingPassword ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">••••••••</span>
                        <button
                          type="button"
                          onClick={startEditPassword}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          aria-label="Change password"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type={passwordVisibility.old ? 'text' : 'password'}
                            value={passwordForm.oldPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                            placeholder="Current password"
                            autoComplete="current-password"
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 pr-9 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setPasswordVisibility((v) => ({ ...v, old: !v.old }))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label={passwordVisibility.old ? 'Hide password' : 'Show password'}
                          >
                            {passwordVisibility.old ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={passwordVisibility.new ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            placeholder="New password"
                            autoComplete="new-password"
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 pr-9 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setPasswordVisibility((v) => ({ ...v, new: !v.new }))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label={passwordVisibility.new ? 'Hide password' : 'Show password'}
                          >
                            {passwordVisibility.new ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={passwordVisibility.confirm ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 pr-9 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setPasswordVisibility((v) => ({ ...v, confirm: !v.confirm }))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label={passwordVisibility.confirm ? 'Hide password' : 'Show password'}
                          >
                            {passwordVisibility.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        {passwordForm.newPassword.length > 0 && (
                          <div className="rounded-lg border border-gray-200 bg-white p-2.5 space-y-1">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Password requirements</p>
                            {[
                              ['At least 8 characters', passwordForm.newPassword.length >= 8],
                              ['One uppercase & one lowercase letter', /[a-z]/.test(passwordForm.newPassword) && /[A-Z]/.test(passwordForm.newPassword)],
                              ['At least one number', /\d/.test(passwordForm.newPassword)],
                              ['At least one special character', /[^A-Za-z0-9]/.test(passwordForm.newPassword)],
                            ].map(([label, ok]) => (
                              <p key={label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-gray-500'}`}>
                                <span className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold ${ok ? 'bg-green-500 text-white' : 'border border-gray-300 text-gray-400'}`}>
                                  {ok ? '✓' : ''}
                                </span>
                                {label}
                              </p>
                            ))}
                          </div>
                        )}
                        {passwordForm.confirmPassword.length > 0 && passwordForm.newPassword !== passwordForm.confirmPassword && (
                          <p className="text-xs text-red-600">Passwords do not match</p>
                        )}
                        {passwordError && (
                          <p className="text-xs text-red-600">{passwordError}</p>
                        )}
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={savePassword}
                            disabled={savingPassword}
                            className="flex-1 rounded-lg bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1"
                          >
                            <Check size={12} /> {savingPassword ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPassword(false)}
                            disabled={savingPassword}
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-1"
                          >
                            <X size={12} /> Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Recent Activity */}
                <section className="mt-8">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h2>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {recentUsers.slice(0, 1).map((u) => (
                      <li key={u._id}>New user registered: <Link to={`/seller/${u._id}`} className="text-blue-600 hover:underline">{u.name}</Link></li>
                    ))}
                    {products.slice(0, 1).map((p) => (
                      <li key={p._id}>New product published: {p.title}</li>
                    ))}
                  </ul>
                </section>

              </>
            )}

            {/* My ads */}
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
                      <h2 className="mb-4 text-lg font-semibold text-gray-900">My ads</h2>
                      {productsLoading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                      ) : products.length === 0 ? (
                        emptyState({
                          icon: '📦',
                          title: 'No products yet',
                          description: 'Publish your first product to start selling.',
                          action: () => navigate('/my-profile/add-product'),
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
                                 <Link to={`/products/${p._id}`} className="block">
                                   {p.images?.[0] ? (
                                     <img
                                       src={(p.images?.[0]?.url ?? p.images?.[0]) || 'https://placehold.co/400x300?text=No+Image'}
                                       alt={p.title}
                                       className="w-full h-full object-contain"
                                     />
                                   ) : (
                                     <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                       No image
                                     </div>
                                   )}
                                  </Link>
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

            {/* Available Products */}
            {activeView === 'available' && (
              <section>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Available Products</h2>
                  {user?.role?.toLowerCase() === 'admin' && (
                    <Link to="/admin" className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
                      Admin Panel
                    </Link>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {availableProducts.length} product(s) available
                </p>
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
                                 className="w-full h-full object-contain"
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
                          By {p.seller?.storeName || p.seller?.name || 'Seller'}
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

            {/* My favorites */}
            {activeView === 'favorites' && (
              <section className="rounded-xl border bg-white p-6 shadow-sm">
                <Favorites />
              </section>
            )}


            {/* Buyer fallback for products view */}

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
