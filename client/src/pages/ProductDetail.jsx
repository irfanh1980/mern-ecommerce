import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import ImageGallery from '../components/ui/ImageGallery.jsx';

export default function ProductDetail() {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/api/products/${id}`);
        if (!cancelled) setProduct(data.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [api, id]);

  const currencySymbols = { SEK: 'kr', USD: '$', EUR: '€' };
  const symbol = currencySymbols[product?.currency] || '$';

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Product Details</h1>
        <p className="mt-2 text-gray-600">Please sign in to view product details.</p>
        <Link to="/login" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <div className="animate-pulse h-8 w-32 rounded bg-gray-200 mb-4" />
        <p className="text-sm text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900">Product not found</h2>
        <p className="mt-2 text-sm text-gray-600">{error}</p>
        <Link to="/" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
        <span>&larr;</span> Back
      </button>

      <nav aria-label="Breadcrumb" className="px-6 py-2 text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link to="/" className="hover:underline">Home</Link></li>
          <li className="flex items-center gap-1"><span>/</span><Link to="/products" className="hover:underline">Products</Link></li>
          <li className="flex items-center gap-1"><span>/</span><span className="text-gray-900">{product?.title || id}</span></li>
        </ol>
      </nav>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <ImageGallery images={product.images || []} />
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            {product.seller && (
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                <span
                  className="font-medium text-blue-600 hover:underline cursor-pointer"
                  onClick={() => navigate(`/seller/${product.seller._id}`)}
                >
                  {product.seller.storeName || product.seller.name || 'Seller'}
                </span>
                {product.seller.isVerified && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700">
                    <span aria-hidden="true">✓</span> Verified
                  </span>
                )}
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
            <p className="text-sm capitalize text-gray-500">{product.category}</p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Price</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-600">{product.price} {product.currency === 'SEK' ? 'sek' : product.currency.toLowerCase()}</span>
              <span className="text-sm text-gray-500">· Stock: {product.inventory}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{product.description || 'No description provided.'}</p>
          </div>

          {user && product.seller?._id !== user._id && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Contact Seller</h3>
              <button
                onClick={async () => {
                  try {
                    const { data } = await api.post('/api/conversations', {
                      listingId: product._id,
                      recipientId: product.seller._id,
                    });
                    navigate(`/messaging?conversation=${data.data._id}`);
                  } catch (err) {
                    setError(err.response?.data?.message || 'Failed to start conversation');
                  }
                }}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Message Seller
              </button>
            </div>
          )}

          {user && product.seller?._id === user._id && (
            <div className="pt-4 border-t border-gray-200 flex gap-2">
              <Link
                to="/dashboard/add-product"
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors text-center"
              >
                Edit Product
              </Link>
              <button
                onClick={() => {
                  if (window.confirm('Delete this product?')) {
                    navigate('/dashboard');
                  }
                }}
                className="flex-1 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors text-center"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
