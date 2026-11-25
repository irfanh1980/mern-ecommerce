import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useFavorites } from '../context/FavoritesContext.jsx';
import ProductMediaGallery from '../components/product/ProductMediaGallery.jsx';
import { getCategoryAttributes } from '../constants/categoryAttributes.js';
import { Share2, Heart } from 'lucide-react';

const CONDITION_LABELS = {
  brand_new: 'Brand new',
  like_new: 'Like new',
  used_good: 'Good',
  used_wear: 'Fair / Okay',
  needs_repair: 'Not working / For parts',
};

const LISTING_TYPE_LABELS = {
  selling: 'For sale',
  wanted: 'Wanted / Looking to buy',
  rent: 'For rent',
  given: 'Free / Giveaway',
};

export default function ProductDetail() {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showSeller, setShowSeller] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  const [suggested, setSuggested] = useState([]);
  const [sellerAds, setSellerAds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/api/products/${id}`);
        const p = data.data;
        if (!cancelled) setProduct(p);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [api, id]);

  useEffect(() => {
    if (!product?.seller?._id) return;
    let cancelled = false;
    const loadSeller = async () => {
      try {
        const { data } = await api.get(`/api/users/${product.seller._id}`);
        if (!cancelled) setSeller(data.data);
      } catch (e) {
        // seller profile optional
      }
    };
    loadSeller();
    return () => {
      cancelled = true;
    };
  }, [api, product?.seller?._id]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    const loadRelated = async () => {
      try {
        // More from the same seller (excluding current)
        const { data: sellerData } = await api.get('/api/products', {
          params: {
            seller: product.seller._id,
            limit: 8,
          },
        });
        const sellerListings = (sellerData.data || []).filter((p) => p._id !== id);
        if (!cancelled) setSellerAds(sellerListings.slice(0, 5));

        // More like this - same category (excluding current)
        const { data: catData } = await api.get('/api/products', {
          params: {
            category: product.category,
            limit: 8,
          },
        });
        const similar = (catData.data || []).filter((p) => p._id !== id);
        if (!cancelled) setSuggested(similar.slice(0, 5));
      } catch (e) {
        // related listings optional
      }
    };
    loadRelated();
    return () => {
      cancelled = true;
    };
  }, [api, product]);

  const currencySymbols = { SEK: 'kr', USD: '$', EUR: '€' };
  const symbol = currencySymbols[product?.currency] || '$';
  const isOwner = user && product?.seller?._id === user._id;
  const showPrice = product?.listingType !== 'given';

  const conditionLabel = CONDITION_LABELS[product?.condition] || product?.condition;
  const listingTypeLabel = LISTING_TYPE_LABELS[product?.listingType] || 'For sale';

  const attributeBadges = [];
  if (product?.attributes) {
    const defs = getCategoryAttributes(product.category);
    const entries = Object.entries(product.attributes).filter(
      ([, v]) => v !== '' && v != null,
    );
    for (const [key, value] of entries) {
      const label = defs.find((d) => d.key === key)?.label || key;
      attributeBadges.push({ label, value });
    }
  }

  const shareAd = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/products/${id}`);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    } catch (e) {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const sellerName = seller?.name || product?.seller?.name || 'Seller';
  const sellerStore = seller?.storeName || product?.seller?.storeName;
  const sellerAvatar = seller?.avatar || product?.seller?.avatar;
  const sellerSince = seller?.createdAt || product?.seller?.createdAt;
  const sellerVerified = seller?.isVerified ?? product?.seller?.isVerified ?? false;

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

  const compactCard = (p) => (
    <article
      key={p._id}
      className="flex-shrink-0 w-48 flex flex-col gap-1.5 cursor-pointer"
      onClick={() => navigate(`/products/${p._id}`)}
    >
      <div className="relative aspect-square overflow-hidden rounded border border-gray-200 bg-gray-50 flex-shrink-0">
          <img
            src={(p.images?.[0]?.url ?? p.images?.[0]) || 'https://placehold.co/300x300?text=No+Image'}
            alt={p.title}
            className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        <div className="absolute right-1 top-1 z-10">
          <span className="h-6 w-6 rounded-full bg-white/90 flex items-center justify-center text-[10px]">
            <Heart size={14} />
          </span>
        </div>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[44px]">{p.title}</h3>
      <div className="flex items-center gap-1 text-sm mt-auto">
        <span className="font-bold text-blue-600">{p.price} {symbol}</span>
        <span className="text-gray-500">📍 {seller?.address?.city || ''}</span>
      </div>
    </article>
  );

  return (
    <div className="p-4 md:p-6 max-w-[1120px] mx-auto">
      <nav aria-label="Breadcrumb" className="px-6 py-2 text-sm text-gray-500 mb-2">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link to="/" className="hover:underline text-amber-600">Home</Link></li>
          <li className="flex items-center gap-1"><span>/</span><Link to="/products" className="hover:underline text-amber-600">Products</Link></li>
          <li className="flex items-center gap-1"><span>/</span><Link
            to={`/products?category=${encodeURIComponent(product.category || '')}`}
            className="hover:underline text-amber-600"
          >
            {product.category}
          </Link></li>
          <li className="flex items-center gap-1"><span>/</span><span className="text-gray-900 truncate max-w-[200px]">{product.title}</span></li>
        </ol>
      </nav>

      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-gray-900 px-4 py-2.5 text-xs text-white shadow-lg">
          Link copied to clipboard
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column - Media Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <ProductMediaGallery
            images={product.images || []}
            productId={product._id}
          />
        </div>

        {/* Right column - Listing Details */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header & Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded border border-green-100 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                {listingTypeLabel}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{product.title}</h1>
            <div className="flex items-baseline gap-2">
              {showPrice ? (
                <>
                  <span className="text-3xl md:text-4xl font-bold text-blue-600">
                    {product.price} {symbol}
                  </span>
                  {product.inventory && product.inventory > 1 && (
                    <span className="text-sm text-gray-500">· {product.inventory} in stock</span>
                  )}
                </>
              ) : (
                <span className="text-3xl md:text-4xl font-bold text-blue-600">Free · 0 SEK</span>
              )}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="space-y-2">
            {isOwner ? (
              <Link
                to="/my-profile/add-product"
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors text-center"
              >
                Edit listing
              </Link>
            ) : (
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
                Send message
              </button>
            )}
          </div>

          {/* Attribute Pill Badges */}
          {attributeBadges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attributeBadges.map(({ label, value }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5"
                >
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{label}:</span>
                  <span className="text-[11px] font-semibold text-gray-900">{value}</span>
                </span>
              ))}
            </div>
          )}

          {/* Description & Location */}
          <div className="space-y-2">
            <p className="text-gray-700 leading-relaxed text-sm">
              {product.description || 'No description provided.'}
            </p>
            {seller?.address?.city || seller?.address?.zipCode && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span>📍</span>
                <span>
                  {seller.address.city}{seller.address.zipCode && `, ${seller.address.zipCode}`}
                </span>
              </div>
            )}
          </div>

          {/* Seller Profile Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                {sellerAvatar ? (
                  <img src={sellerAvatar} alt={sellerName} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-gray-600">{getInitials(sellerName)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/seller/${seller?._id || product.seller._id}`}
                    className="text-base font-semibold text-blue-600 hover:underline truncate"
                  >
                    {sellerName}
                  </Link>
                  {sellerVerified && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      <span aria-hidden="true">✓</span> Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Member since {formatDate(sellerSince)}
                </p>
              </div>
            </div>
          </div>

          {/* Utility & Metadata Footer */}
          <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-sm">
            <button
              type="button"
              onClick={shareAd}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Share2 size={16} /> Share ad
            </button>
            <div className="text-gray-500">
              Last modified : {formatDate(product.updatedAt)} · Ad ID : {product._id.toString().slice(-6)}
            </div>
            <button
              type="button"
              onClick={() => setError('Report functionality coming soon.')}
              className="text-[11px] font-medium text-red-500 hover:underline"
            >
              Report ad
            </button>
          </div>
        </div>
      </div>

      {/* Below the fold - Discovery Carousels */}
      <div className="mt-8">
        {sellerAds.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">More from the seller</h2>
              <button
                type="button"
                onClick={() => setShowSeller(!showSeller)}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Show all ({sellerAds.length})
              </button>
            </div>
            <div className={`flex gap-4 overflow-x-auto ${showSeller ? 'max-h-[340px]' : ''}`} style={{ minHeight: '340px' }}>
              {sellerAds.map(compactCard)}
            </div>
          </section>
        )}

        {suggested.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">More like this</h2>
              <button
                type="button"
                onClick={() => setShowSimilar(!showSimilar)}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Show all ({suggested.length})
              </button>
            </div>
            <div className={`flex gap-4 overflow-x-auto ${showSimilar ? 'max-h-[340px]' : ''}`} style={{ minHeight: '340px' }}>
              {suggested.map(compactCard)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}