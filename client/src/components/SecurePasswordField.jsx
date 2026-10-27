import { useState } from 'react';

export default function SecurePasswordField() {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const checks = {
    length: password.length >= 8,
    case: /[a-z]/.test(password) && /[A-Z]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const strength = passed === 4 ? 'Strong' : passed === 3 ? 'Medium' : passed === 2 ? 'Fair' : 'Weak';
  const color = passed === 4 ? 'bg-green-500' : passed === 3 ? 'bg-yellow-500' : passed === 2 ? 'bg-orange-500' : 'bg-red-500';
  const width = passed === 4 ? 'w-full' : passed === 3 ? 'w-3/4' : passed === 2 ? 'w-1/2' : 'w-1/4';
  const allPassed = Object.values(checks).every(Boolean) && password.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (allPassed) {
      setMessage('Password updated successfully!');
    } else {
      setMessage('Please fix the password requirements above.');
    }
  };

  const rule = (key, label) => (
    <li className={`flex items-center gap-2 text-sm ${checks[key] ? 'text-green-600' : 'text-red-500'}`}>
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${checks[key] ? 'border-green-500 bg-green-500 text-white' : 'border-red-500 red-check'}`}>
        {checks[key] ? '✓' : '✕'}
      </span>
      <span className={checks[key] ? 'line-through text-gray-400' : 'text-gray-600'}>{label}</span>
    </li>
  );

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6" noValidate>
        <h2 className="text-2xl font-bold text-gray-900">Update Password</h2>
        <p className="text-gray-600 text-sm">Choose a strong password to keep your account secure.</p>
        <div className="relative">
          <label htmlFor="secure-password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              id="secure-password"
              type={visible ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-3 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400"
              placeholder="••••••••"
              required
            />
            <button type="button" onClick={() => setVisible((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {visible ? 'Hide' : 'Show'}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                <span>Strength</span>
                <span>{strength}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full transition-all ${color} ${width}`} />
              </div>
            </div>
          )}
        </div>
        {password.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Password requirements</h3>
            <ul className="space-y-2">
              {rule('length', 'At least 8 characters')}
              {rule('case', 'One uppercase & one lowercase letter')}
              {rule('digit', 'At least one number')}
              {rule('special', 'At least one special character')}
            </ul>
          </div>
        )}
        <button type="submit" disabled={!allPassed} className={`w-full py-3 rounded-lg font-semibold transition-all ${allPassed ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>
          Update Password
        </button>
        {message && <p className="text-sm h-5 text-green-600">{message}</p>}
      </form>
    </div>
  );
}
