import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function ChangePassword() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [visibility, setVisibility] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const checks = {
    length: form.newPassword.length >= 8,
    case: /[a-z]/.test(form.newPassword) && /[A-Z]/.test(form.newPassword),
    digit: /\d/.test(form.newPassword),
    special: /[^A-Za-z0-9]/.test(form.newPassword),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const strength = passed === 4 ? 'Strong' : passed === 3 ? 'Medium' : passed === 2 ? 'Fair' : 'Weak';
  const color = passed === 4 ? 'bg-green-500' : passed === 3 ? 'bg-yellow-500' : passed === 2 ? 'bg-orange-500' : 'bg-red-500';
  const width = passed === 4 ? 'w-full' : passed === 3 ? 'w-3/4' : passed === 2 ? 'w-1/2' : 'w-1/4';
  const allPassed = Object.values(checks).every(Boolean) && form.newPassword.length > 0;
  const passwordsMatch = form.newPassword === form.confirmPassword && form.confirmPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.oldPassword) {
      setError('Current password is required.');
      return;
    }
    if (!allPassed) {
      setError('Please fix the new password requirements above.');
      return;
    }
    if (!passwordsMatch) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/change-password', {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      setMessage('Password changed successfully.');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const rule = (key, label) => (
    <li key={key} className={`flex items-center gap-2 text-sm ${checks[key] ? 'text-green-600' : 'text-red-500'}`}>
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${checks[key] ? 'border-green-500 bg-green-500 text-white' : 'border-red-500'}`}>
        {checks[key] ? '✓' : '✕'}
      </span>
      <span className={checks[key] ? 'line-through text-gray-400' : 'text-gray-600'}>{label}</span>
    </li>
  );

  const goBack = () => {
    const referrer = document.referrer || window.location.origin + '/dashboard';
    try {
      const url = new URL(referrer);
      if (url.origin === window.location.origin) {
        navigate(url.pathname + url.search + url.hash);
      } else {
        navigate('/dashboard');
      }
    } catch {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-6 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <span>&larr;</span> Back
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Change Password</h2>
          <p className="mb-6 text-sm text-gray-600">Keep your account secure with a strong new password.</p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-800" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-800" role="status">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="old-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Current password
              </label>
              <div className="relative">
                <input
                  id="old-password"
                  type={visibility.old ? 'text' : 'password'}
                  value={form.oldPassword}
                  onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-3 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setVisibility((v) => ({ ...v, old: !v.old }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-600"
                >
                  {visibility.old ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                New password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={visibility.new ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-3 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setVisibility((v) => ({ ...v, new: !v.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-600"
                >
                  {visibility.new ? 'Hide' : 'Show'}
                </button>
              </div>
              {form.newPassword.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                    <span>Strength</span>
                    <span className="font-medium">{strength}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full transition-all ${color} ${width}`} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={visibility.confirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-3 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setVisibility((v) => ({ ...v, confirm: !v.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-600"
                >
                  {visibility.confirm ? 'Hide' : 'Show'}
                </button>
              </div>
              {form.confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
              )}
            </div>

            {form.newPassword.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Password requirements</h3>
                <ul className="space-y-1.5">
                  {rule('length', 'At least 8 characters')}
                  {rule('case', 'One uppercase & one lowercase letter')}
                  {rule('digit', 'At least one number')}
                  {rule('special', 'At least one special character')}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !allPassed || !form.oldPassword || !passwordsMatch}
              className={`w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 ${!loading && allPassed && form.oldPassword && passwordsMatch ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            >
              {loading ? 'Changing...' : 'Change password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
