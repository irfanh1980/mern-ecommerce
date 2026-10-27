import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/api/conversations/unread-count');
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, api]);

  return (
    <nav className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-green-300">Welcome to</span>
          <img src="/logo.jfif" alt="Logo" className="h-8 w-auto" />
          <span className="text-xl font-bold">Marketplace</span>
        </Link>
        <div className="flex items-center gap-4">
          {user?.role === 'Buyer' && (
            <Link to="/cart" className={`hover:text-gray-300 ${location.pathname === '/cart' ? 'text-blue-400' : ''}`}>Cart</Link>
          )}
            {user ? (
            <>
            {user && location.pathname !== '/' && (
              <span className="text-sm text-gray-300">Logged in as: {user.role}</span>
            )}
               <Link to="/dashboard" className={`hover:text-gray-300 ${location.pathname === '/dashboard' ? 'text-blue-400' : ''}`}>Dashboard</Link>
              <Link
                to="/messaging"
                className={`relative hover:text-gray-300 ${location.pathname === '/messaging' ? 'text-blue-400' : ''}`}
              >
                Messages
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded bg-red-600 px-3 py-1 text-sm hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {location.pathname !== '/' && (
                <>
                  <Link to="/login" className={`hover:text-gray-300 ${location.pathname === '/login' ? 'text-blue-400' : ''}`}>Login</Link>
                  <Link to="/register" className={`rounded bg-blue-600 px-3 py-1 text-sm hover:bg-blue-700 ${location.pathname === '/register' ? 'bg-blue-800' : ''}`}>
                    Register
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
