import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const TYPE_CONFIG = {
  vehicle: { icon: '🚗', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  furniture: { icon: '🛋️', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  pet: { icon: '🐱', color: 'bg-pink-50 border-pink-200 text-pink-700' },
  electronics: { icon: '📱', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  clothing: { icon: '👕', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  other: { icon: '📦', color: 'bg-gray-50 border-gray-200 text-gray-700' },
};

export default function PopularAnnonserTags() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchPopular = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/api/popular-searches');
        if (!cancelled) setItems(data.data || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load popular searches');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPopular();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const handleClick = async (item) => {
    try {
      await api.post(`/api/popular-searches/${item._id}/click`);
    } catch {
      /* click tracking failure should not block navigation */
    }

    if (item.categorySlug) {
      navigate(`/products?category=${item.categorySlug}`);
    } else if (item.query) {
      navigate(`/products?search=${encodeURIComponent(item.query)}`);
    }
  };

  const typeConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.other;

  if (loading) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Populära annonser</h2>
        <div className="flex gap-2 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <span
              key={i}
              className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs text-gray-400"
            >
              {' '.repeat(8)}
            </span>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Populära annonser</h2>
      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <div className="flex flex-wrap gap-2">
        {items.length === 0 ? (
          <span className="text-sm text-gray-500">No popular searches available.</span>
        ) : (
          items.map((item) => {
            const config = typeConfig(item.type);
            const label = item.label;
            return (
              <button
                key={item._id || item.label}
                type="button"
                onClick={() => handleClick(item)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-150 ${
                  config.color
                }`}
              >
                <span className="text-xs">{config.icon}</span>
                {label}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
