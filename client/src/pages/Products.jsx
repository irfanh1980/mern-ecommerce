import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { MAIN_CATEGORIES as CATEGORIES } from '../constants/categories.js';

const CONDITIONS = [
  { value: 'brand_new', label: 'Brand new' },
  { value: 'like_new', label: 'Like new' },
  { value: 'used_good', label: 'Used - Good' },
  { value: 'used_wear', label: 'Used - Wear' },
  { value: 'needs_repair', label: 'Needs repair' },
];

const LISTING_TYPES = [
  { value: 'selling', label: 'Selling' },
  { value: 'given', label: 'Given away' },
];

export default function Products() {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [listingType, setListingType] = useState(searchParams.get('listingType') || '');
  const [canBeSent, setCanBeSent] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [listingTypeOpen, setListingTypeOpen] = useState(false);

  const priceMin = useMemo(() => products.length ? Math.min(...products.map(p => p.price), 0) : 0, [products]);
  const priceMax = useMemo(() => products.length ? Math.max(...products.map(p => p.price), 30000) : 30000, [products]);
  const currencies = useMemo(() => [...new Set(products.map(p => p.currency || 'SEK'))], [products]);
  const currencyLabel = currencies.length === 1 ? currencies[0] : 'mixed';
  const currencySymbol = currencyLabel === 'SEK' ? 'kr' : currencyLabel === 'USD' ? '$' : currencyLabel === 'EUR' ? '€' : currencyLabel;
  const sliderMin = minPrice === '' ? priceMin : Number(minPrice);
  const sliderMax = maxPrice === '' ? priceMax : Number(maxPrice);
  const range = priceMax - priceMin;
  const minPercent = range > 0 ? ((sliderMin - priceMin) / range) * 100 : 0;
  const maxPercent = range > 0 ? ((sliderMax - priceMin) / range) * 100 : 100;

  const handleMinChange = (value) => {
    const num = Number(value);
    if (isNaN(num) || num <= sliderMax) setMinPrice(value === '' ? '' : String(Math.max(priceMin, Math.min(num, sliderMax))));
  };
  const handleMaxChange = (value) => {
    const num = Number(value);
    if (isNaN(num) || num >= sliderMin) setMaxPrice(value === '' ? '' : String(Math.min(priceMax, Math.max(num, sliderMin))));
  };
  const handleSliderMinChange = (percent) => {
    if (range === 0) return;
    const value = Math.round(priceMin + (percent / 100) * range);
    setMinPrice(String(Math.max(priceMin, Math.min(value, sliderMax))));
    setPage(1);
  };
  const handleSliderMaxChange = (percent) => {
    if (range === 0) return;
    const value = Math.round(priceMin + (percent / 100) * range);
    setMaxPrice(String(Math.min(priceMax, Math.max(value, sliderMin))));
    setPage(1);
  };

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { page, limit: 12 };
        if (category) params.category = category;
        if (search) params.search = search;
        if (condition) params.condition = condition;
        if (listingType) params.listingType = listingType;
        if (canBeSent) params.canBeSent = 'true';
        if (freeShipping) params.freeShipping = 'true';
        const { data } = await api.get('/api/products', { params });
        if (cancelled) return;
        setProducts(data.data);
        setTotalPages(data.pages);
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
  }, [api, page, category, search, condition, listingType, canBeSent, freeShipping]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const minOk = minPrice === '' || p.price >= Number(minPrice);
      const maxOk = maxPrice === '' || p.price <= Number(maxPrice);
      return minOk && maxOk;
    });
  }, [products, minPrice, maxPrice]);

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <aside className="md:w-64 shrink-0">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Filters</h2>
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setDeliveryOpen(!deliveryOpen)}
              className="flex items-center justify-between w-full mb-2 text-sm font-medium text-gray-900 hover:text-gray-700"
            >
              <span>Delivery options</span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${deliveryOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {deliveryOpen && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={canBeSent}
                    onChange={(e) => {
                      setCanBeSent(e.target.checked);
                      setPage(1);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Can be sent
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={freeShipping}
                    onChange={(e) => {
                      setFreeShipping(e.target.checked);
                      setPage(1);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Free shipping
                </label>
              </div>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="filter-search" className="mb-1 block text-sm font-medium">Search</label>
            <input
              id="filter-search"
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search products..."
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="filter-category" className="mb-1 block text-sm font-medium">Category</label>
            <select
              id="filter-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setConditionOpen(!conditionOpen)}
              className="flex items-center justify-between w-full mb-2 text-sm font-medium text-gray-900 hover:text-gray-700"
            >
              <span>Condition</span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${conditionOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {conditionOpen && (
              <select
                value={condition}
                onChange={(e) => {
                  setCondition(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded border px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setListingTypeOpen(!listingTypeOpen)}
              className="flex items-center justify-between w-full mb-2 text-sm font-medium text-gray-900 hover:text-gray-700"
            >
              <span>Type of ad</span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${listingTypeOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {listingTypeOpen && (
              <select
                value={listingType}
                onChange={(e) => {
                  setListingType(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded border px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {LISTING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setPriceOpen(!priceOpen)}
              className="flex items-center justify-between w-full mb-2 text-sm font-medium text-gray-900 hover:text-gray-700"
            >
              <span>Price</span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${priceOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {priceOpen && (
              <div>
                <div className="relative h-6 mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-1 bg-gray-200 rounded-full" />
                  </div>
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full"
                    style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
                  />
                  <button
                    type="button"
                    role="slider"
                    aria-label="Minimum price"
                    aria-valuemin={priceMin}
                    aria-valuemax={priceMax}
                    aria-valuenow={sliderMin}
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-blue-600 shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"
                    style={{ left: `calc(${minPercent}% - 8px)` }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const sliderTrack = e.currentTarget.parentElement;
                      const onMove = (me) => {
                        const rect = sliderTrack.getBoundingClientRect();
                        const percent = Math.max(0, Math.min(100, ((me.clientX - rect.left) / rect.width) * 100));
                        handleSliderMinChange(percent);
                      };
                      const onUp = () => {
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                      };
                      document.addEventListener('mousemove', onMove);
                      document.addEventListener('mouseup', onUp);
                    }}
                  />
                  <button
                    type="button"
                    role="slider"
                    aria-label="Maximum price"
                    aria-valuemin={priceMin}
                    aria-valuemax={priceMax}
                    aria-valuenow={sliderMax}
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-blue-600 shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"
                    style={{ left: `calc(${maxPercent}% - 8px)` }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const sliderTrack = e.currentTarget.parentElement;
                      const onMove = (me) => {
                        const rect = sliderTrack.getBoundingClientRect();
                        const percent = Math.max(0, Math.min(100, ((me.clientX - rect.left) / rect.width) * 100));
                        handleSliderMaxChange(percent);
                      };
                      const onUp = () => {
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                      };
                      document.addEventListener('mousemove', onMove);
                      document.addEventListener('mouseup', onUp);
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-3">
                  <span>{priceMin} {currencySymbol}</span>
                  <span>{priceMax.toLocaleString()} {currencyLabel}</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label htmlFor="filter-min-price" className="mb-1 block text-xs text-gray-500">From {currencySymbol}</label>
                    <input
                      id="filter-min-price"
                      type="number"
                      value={minPrice}
                      onChange={(e) => {
                        handleMinChange(e.target.value);
                        setPage(1);
                      }}
                      min={priceMin}
                      max={sliderMax}
                      className="w-full rounded border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-1/2">
                    <label htmlFor="filter-max-price" className="mb-1 block text-xs text-gray-500">To {currencySymbol}</label>
                    <input
                      id="filter-max-price"
                      type="number"
                      value={maxPrice}
                      onChange={(e) => {
                        handleMaxChange(e.target.value);
                        setPage(1);
                      }}
                      min={sliderMin}
                      max={priceMax}
                      className="w-full rounded border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setCategory('');
              setSearchInput('');
              setSearch('');
              setCondition('');
              setListingType('');
              setMinPrice('');
              setMaxPrice('');
              setPage(1);
            }}
            className="w-full rounded bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
          >
            Reset
          </button>
        </div>
      </aside>

      <section className="flex-1">
        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border bg-white p-4 shadow-sm">
                <div className="mb-3 h-40 rounded bg-gray-200" />
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
                <div className="mb-2 h-4 w-1/2 rounded bg-gray-200" />
                <div className="h-6 w-1/3 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded bg-white p-8 text-center text-gray-500 shadow-sm">
            No products found.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <article key={p._id} className="overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md">
                  <img
                    src={(p.images?.[0]?.url ?? p.images?.[0]) || 'https://placehold.co/400x300?text=No+Image'}
                    alt={p.title}
                     className="h-44 w-full object-contain"
                    loading="lazy"
                  />
                  <div className="p-4">
                    {p.seller && (
                      <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
                         <span
                           className="truncate cursor-pointer text-blue-600 hover:underline"
                           onClick={(e) => { e.stopPropagation(); navigate(`/seller/${p.seller._id}`); }}
                         >
                           {p.seller.storeName || p.seller.name || 'Seller'}
                         </span>
                        {p.seller.isVerified && (
                          <span
                            title="Verified seller"
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700"
                          >
                            <span aria-hidden="true">✓</span> Verified
                          </span>
                        )}
                      </div>
                    )}
                    <h3 className="mb-1 truncate text-base font-semibold">{p.title}</h3>
                    <p className="mb-2 line-clamp-2 text-sm text-gray-600">{p.description}</p>
                    <div className="flex items-center justify-between">
                       <span className="text-lg font-bold text-blue-600">{p.price} {p.currency === 'SEK' ? 'sek' : p.currency.toLowerCase()}</span>
                      <span className="text-xs text-gray-500">Stock: {p.inventory}</span>
                    </div>
                     <button
                       type="button"
                       onClick={() => {
                         const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                         cart.push(p);
                         localStorage.setItem('cart', JSON.stringify(cart));
                         alert('Added to cart');
                       }}
                       className="mt-3 w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                     >
                       Add to Cart
                     </button>
                    {user && p.seller?._id !== user._id && (
                      <button
                        type="button"
                        onClick={() => {
                          navigate('/messaging');
                          api.post('/api/conversations', {
                            listingId: p._id,
                            recipientId: p.seller._id,
                          }).catch(() => {});
                        }}
                        className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Message Seller
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
