import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const COUNTRY_CODES = [
  { code: '+1', name: '🇺🇸 United States (+1)' },
  { code: '+44', name: '🇬🇧 United Kingdom (+44)' },
  { code: '+46', name: '🇸🇪 Sweden (+46)' },
  { code: '+49', name: '🇩🇪 Germany (+49)' },
  { code: '+33', name: '🇫🇷 France (+33)' },
  { code: '+39', name: '🇮🇹 Italy (+39)' },
  { code: '+61', name: '🇦🇺 Australia (+61)' },
  { code: '+91', name: '🇮🇳 India (+91)' },
  { code: '+81', name: '🇯🇵 Japan (+81)' },
  { code: '+86', name: '🇨🇳 China (+86)' },
  { code: '+45', name: '🇩🇰 Denmark (+45)' },
  { code: '+7', name: '🇷🇺 Russia (+7)' },
  { code: '+82', name: '🇰🇷 South Korea (+82)' },
  { code: '+84', name: '🇻🇳 Vietnam (+84)' },
  { code: '+27', name: '🇿🇦 South Africa (+27)' },
  { code: '+55', name: '🇧🇷 Brazil (+55)' },
  { code: '+52', name: '🇲🇽 Mexico (+52)' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', countryCode: '+1', countryName: '🇺🇸 United States', password: '', confirmPassword: '', role: 'Buyer' });
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [notice, setNotice] = useState('');
  const [verificationLink, setVerificationLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      const payload = {
        ...form,
        phone: `${form.countryCode} ${form.phone}`.trim(),
      };
      const result = await register(payload);
      setForm({ name: '', email: '', phone: '', countryCode: '+1', countryName: '🇺🇸 United States (+1)', password: '', confirmPassword: '', role: 'Buyer' });
      setNotice(
        result?.message ||
          'Account created. Check your inbox to verify your email address.'
      );
      if (result?.verificationUrl) setVerificationLink(result.verificationUrl);
      // Stay on this page: the account is not active until the user opens the
      // link from their inbox.
      setRegistered(true);
    } catch (err) {
      if (err.response) {
        const data = err.response.data;
        setError(data.message || data.error || 'Registration failed');
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="mx-auto max-w-md rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Verify your email</h2>
        <div className="rounded border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <p>{notice}</p>
          <p className="mt-2 text-yellow-700">
            Your account stays unverified until you open that link. Nothing is verified automatically.
          </p>
          {verificationLink && (
            <p className="mt-3 text-xs">
              <span className="block font-medium text-yellow-800">
                Email delivery is not configured on the server - open this link to verify:
              </span>
              <a href={verificationLink} className="font-medium underline break-all">
                {verificationLink}
              </a>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mt-5 w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border bg-white p-6 shadow-sm">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <span>&larr;</span> Back
      </button>
      <h2 className="mb-4 text-xl font-semibold">Register</h2>
      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="register-name" className="mb-1 block text-sm font-medium">Name</label>
          <input id="register-name" name="name" value={form.name} onChange={handleChange} required className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label htmlFor="register-email" className="mb-1 block text-sm font-medium">Email</label>
          <input id="register-email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" required className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label htmlFor="register-phone" className="mb-1 block text-sm font-medium">Mobile Number <span className="text-gray-400 font-normal text-xs ml-1">(optional)</span></label>
          <div className="relative">
            <select
              id="register-country-code"
              name="countryCode"
              value={form.countryCode}
              onChange={(e) => {
                const selected = COUNTRY_CODES.find((c) => c.code === e.target.value);
                setForm((p) => ({
                  ...p,
                  countryCode: e.target.value,
                  countryName: selected ? selected.name : e.target.value,
                }));
              }}
              className="border-r-0 border-gray-300 rounded-l-lg rounded-r-none px-3 py-3 text-sm text-gray-700 focus:ring-0 appearance-none cursor-pointer"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              id="register-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
              className="w-full pl-4 pr-3 py-3 rounded-r-lg rounded-l-none border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="relative group">
          <label htmlFor="register-password" className="mb-1 block text-sm font-medium">Password</label>
          <div className="relative">
            <input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
              className="w-full rounded border px-3 py-2 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="absolute left-0 top-full mt-1 z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Minimum 6 characters
          </div>
        </div>
        <div className="relative group">
          <label htmlFor="register-confirm-password" className="mb-1 block text-sm font-medium">Confirm Password</label>
          <div className="relative">
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
              className="w-full rounded border px-3 py-2 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((p) => !p)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="register-role" className="mb-1 block text-sm font-medium">Account Type</label>
          <select
            id="register-role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="Buyer">Buyer</option>
            <option value="Seller">Seller</option>
            <option value="Both">Both (Buyer & Seller)</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
