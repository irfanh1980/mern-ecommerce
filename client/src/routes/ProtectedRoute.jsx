import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0) {
    const hasAccess =
      roles.includes(user.role) ||
      (user.role === 'Both' && (roles.includes('Buyer') || roles.includes('Seller')));
    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
