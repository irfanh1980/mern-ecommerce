import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { MAIN_CATEGORIES as CATEGORIES } from '../constants/categories.js';

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
  }, [api, page, category, search]);

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
            <label htmlFor="filter-min-price" className="mb-1 block text-sm font-medium">Price Range</label>
            <div className="flex gap-2">
              <input
                id="filter-min-price"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="w-1/2 rounded border px-2 py-2 text-sm"
              />
              <input
                id="filter-max-price"
                aria-label="Maximum price"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className="w-1/2 rounded border px-2 py-2 text-sm"
              />
            </div>
          </div>
          <button
            onClick={() => {
              setCategory('');
              setSearchInput('');
              setSearch('');
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
