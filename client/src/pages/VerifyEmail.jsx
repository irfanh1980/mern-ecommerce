import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function VerifyEmail() {
  const { token } = useParams();
  const { api, setUser } = useAuth();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      try {
        const { data } = await api.get(`/api/auth/verify-email/${token}`);
        if (cancelled) return;
        setStatus('success');
        setMessage(data.message || 'Your email address has been verified');

        // Sync the signed-in account so the dashboard stops asking to verify.
        try {
          const me = await api.get('/api/auth/me');
          if (!cancelled) setUser(me.data.user);
        } catch {
          /* not signed in - nothing to sync */
        }
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setMessage(
          err.response?.data?.message || 'This verification link is invalid or has expired.'
        );
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [token, api, setUser]);

  return (
    <div className="mx-auto max-w-md rounded-lg border bg-white p-6 text-center shadow-sm">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <span>&larr;</span> Back
      </button>
      {status === 'verifying' && (
        <>
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <h2 className="text-lg font-semibold">Verifying your email…</h2>
          <p className="mt-1 text-sm text-gray-500">Please wait a moment.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
            ✓
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Email verified</h2>
          <p className="mt-1 text-sm text-gray-600">{message}</p>
          <Link
            to="/dashboard"
            className="mt-5 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go to dashboard
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
            !
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Verification failed</h2>
          <p className="mt-1 text-sm text-gray-600">{message}</p>
          <p className="mt-3 text-xs text-gray-500">
            You can request a new verification link from your dashboard.
          </p>
          <Link
            to="/dashboard"
            className="mt-5 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to dashboard
          </Link>
        </>
      )}
    </div>
  );
}
