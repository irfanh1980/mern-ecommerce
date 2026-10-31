import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function SellerProfile() {
  const { id } = useParams();
  const { api } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/api/products', { params: { seller: id, limit: 50 } });
        if (!cancelled) setProducts(data.data || []);
      } catch (e) {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [api, id]);

  const seller = products[0]?.seller;

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{seller?.storeName || seller?.name || 'Seller'}</h1>
        {seller?.isVerified && <span className="text-sm text-blue-700">✓ Verified</span>}
      </div>
      <h2 className="text-xl font-bold text-gray-900">Products</h2>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">No products.</p>
      ) : (
        <div className="grid gap-6 py-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {products.map((p) => (
            <Link key={p._id} to={`/products/${p._id}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="aspect-[4/3] overflow-hidden bg-[#f8f9fa]">
                <img src={(p.images?.[0]?.url ?? p.images?.[0]) || 'https://placehold.co/400x300?text=No+Image'} alt={p.title} className="w-full h-full object-contain" />
              </div>
              <div className="p-4">
                <h3 className="mb-1 line-clamp-2 font-bold text-orange-500">{p.title}</h3>
                <span className="text-lg font-bold text-blue-600">{p.price} {p.currency === 'SEK' ? 'sek' : p.currency.toLowerCase()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
