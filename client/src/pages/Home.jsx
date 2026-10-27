import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const roleLabels = {
  Buyer: 'Buyer',
  Seller: 'Seller',
  Both: 'Buyer & Seller',
  Admin: 'Admin',
};

export default function Home() {
  const { api, user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/api/products', {
          params: { page: 1, limit: 20, sort: '-createdAt' },
        });
        if (!cancelled) setProducts(data.data || []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load products');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const roleLabel = roleLabels[user?.role] || user?.role;

  const goToProduct = (id) => {
    navigate(`/products/${id}`);
  };

  return (
    <div className="space-y-8 p-6">
      <div className="rounded-xl border bg-white p-8 shadow-sm text-center">
        {!user ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Marketplace</h1>
            <p className="text-gray-600 mb-6">Browse products below or sign in to start selling.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700">
                Sign in
              </Link>
              <Link to="/register" className="rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Create account
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome back, {user.name}!</h1>
            <p className="text-gray-600">Your account type: <span className="font-medium text-gray-800">{roleLabel}</span></p>
          </>
        )}
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
          {user && user.role !== 'Buyer' && (
            <Link
              to="/dashboard/add-product"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <span>+</span> Add product
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border bg-white p-4 shadow-sm">
                <div className="mb-3 h-48 rounded bg-gray-200" />
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
                <div className="mb-2 h-4 w-1/2 rounded bg-gray-200" />
                <div className="h-6 w-1/3 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 shadow-sm text-center">
            <p className="text-sm text-gray-500 mb-4">No products yet.</p>
            {user && user.role !== 'Buyer' && (
              <Link
                to="/dashboard/add-product"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add your first product
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 py-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {products.map((p) => (
              <article
                key={p._id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg group"
                onClick={() => goToProduct(p._id)}
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#f8f9fa]">
                  <img
                    src={(p.images?.[0]?.url ?? p.images?.[0]) || 'https://placehold.co/400x300?text=No+Image'}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                    loading="lazy"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) { alert('Please log in first.'); return; }
                      setSelectedProduct(p);
                    }}
                  />
                </div>
                <div className="p-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                    <span className="uppercase tracking-wide">{p.category || 'Product'}</span>
                    {p.rating != null && (
                      <span>⭐ {p.rating} {p.reviewCount ? `(${p.reviewCount})` : ''}</span>
                    )}
                  </div>
                  <h3 className="mb-1 line-clamp-2 font-bold text-orange-500 group-hover:text-orange-600">{p.title}</h3>
                  {p.seller && (
                    <div className="mb-3 text-xs text-gray-500">
                      By Store:{' '}
                      <span
                        className="font-medium text-blue-600 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) {
                            alert('Please log in first to view seller.');
                            return;
                          }
                          navigate(`/seller/${p.seller._id}`);
                        }}
                      >
                        {p.seller.storeName || p.seller.name || 'Seller'}
                      </span>
                      {p.seller.isVerified && (
                        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700">✓ Verified</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">
                      {p.currency === 'SEK' ? 'kr' : p.currency === 'EUR' ? '€' : '$'}{p.price}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) { alert('Please log in first.'); return; }
                        goToProduct(p._id);
                      }}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Add to Cart
                    </button>
                  </div>
                  {p.inventory != null && p.inventory <= 3 && (
                    <p className="mt-2 text-xs font-medium text-red-600">Only {p.inventory} left!</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedProduct(null)}>
            <div className="max-w-2xl w-full bg-white rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <img src={(selectedProduct.images?.[0]?.url ?? selectedProduct.images?.[0]) || 'https://placehold.co/600x400?text=No+Image'} alt={selectedProduct.title} className="w-full h-auto object-contain bg-[#f8f9fa]" />
              <div className="p-4">
                <h2 className="text-xl font-bold text-orange-500">{selectedProduct.title}</h2>
                <p className="mt-2 text-sky-400">{selectedProduct.description}</p>
                <button className="mt-4 rounded bg-gray-200 px-3 py-1" onClick={() => setSelectedProduct(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
