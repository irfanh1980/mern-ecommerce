import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, MessageCircle, User, Heart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
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
          <img src="/logo.jpg" alt="Logo" className="h-8 w-auto" />
          <span className="text-xl font-bold">E-Market</span>
        </Link>
        <div className="flex items-center gap-6">
          {location.pathname !== '/login' && (
            <>
              {user?.role === 'Buyer' ? (
                <button onClick={() => { alert('Please change your account role to Seller or Both in your profile to post ads.'); navigate('/dashboard'); }} className="flex items-center gap-1 hover:text-gray-300 hover:underline">
                  <PlusCircle size={18} /> New ad
                </button>
              ) : (
                <Link to="/dashboard/add-product" className="flex items-center gap-1 hover:text-gray-300 hover:underline">
                  <PlusCircle size={18} /> New ad
                </Link>
              )}
          {user && (
            <Link to="/messaging" className="flex items-center gap-1 hover:text-gray-300 hover:underline">
              <MessageCircle size={18} /> Messages
            </Link>
          )}
          {user && (
            <Link to="/favorites" className={`flex items-center gap-1 hover:text-gray-300 hover:underline ${location.pathname === '/favorites' ? 'text-red-400' : ''}`}>
              <Heart size={18} /> Favorites
            </Link>
          )}
              {user?.role === 'Buyer' && (
                <Link to="/cart" className={`hover:text-gray-300 hover:underline ${location.pathname === '/cart' ? 'text-blue-400' : ''}`}>Cart</Link>
              )}
            </>
          )}
              {user?.role?.toLowerCase() === 'admin' && (
                <Link to="/admin" className={`hover:text-gray-300 hover:underline ${location.pathname === '/admin' ? 'text-blue-400' : ''}`}>Control Center</Link>
              )}
              {user && (
            <>
                <Link to="/dashboard" className={`hover:text-gray-300 hover:underline ${location.pathname === '/dashboard' ? 'text-blue-400' : ''}`}>Dashboard</Link>
              <button
                onClick={handleLogout}
                className="rounded bg-red-600 px-3 py-1 text-sm hover:bg-red-700"
              >
                Logout
              </button>
            </>
          )}
          {!user && (
            <>
              {location.pathname !== '/' && location.pathname !== '/login' && (
                <>
                  <Link to="/login" className={`hover:text-gray-300 hover:underline ${location.pathname === '/login' ? 'text-blue-400' : ''}`}>Login</Link>
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
