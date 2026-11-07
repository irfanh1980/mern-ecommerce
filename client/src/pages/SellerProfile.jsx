import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { User, Mail, Shield, Calendar, MapPin, Package, Send, Sparkles } from 'lucide-react';

export default function SellerProfile() {
  const { id } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: `Loaded context for ${seller?.name || 'seller'}. How can I assist?` }
  ]);

  const sendCopilotQuery = async (queryText) => {
    if (!queryText.trim()) return;
    setChatHistory((prev) => [...prev, { role: 'user', text: queryText }]);
    setPrompt('');
    setIsThinking(true);
    try {
      const res = await api.post('/api/admin/copilot', { userId: id, prompt: queryText });
      setChatHistory((prev) => [...prev, { role: 'assistant', text: res.data.response }]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { role: 'assistant', text: 'Failed to connect to Admin Copilot backend service.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleProductAction = async (productId, action) => {
    if (!productId) return;
    setIsThinking(true);
    try {
      const res = await api.post('/api/admin/copilot', { userId: id, action, productId });
      setChatHistory((prev) => [...prev, { role: 'assistant', text: res.data.response }]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { role: 'assistant', text: 'Failed to perform product action.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchUser = async () => {
      try {
        const { data } = await api.get(`/api/users/${id}`);
        if (!cancelled) setSeller(data.data);
      } catch (e) {}
    };
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/api/products', { params: { limit: 100 } });
        if (!cancelled) {
          const filtered = (data.data || []).filter(
            (p) => p.seller?._id === id || p.seller === id || p.user?._id === id || p.user === id
          );
          setProducts(filtered);
        }
      } catch (e) {}
    };
    Promise.all([fetchUser(), fetchProducts()]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [api, id]);

  const initials = (seller?.name || seller?.storeName || 'S')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="rounded bg-gray-200 px-3 py-1 text-sm">Back</button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <div className="relative px-6 pb-6">
              <div className="-mt-10 flex items-end gap-4">
                {seller?.avatar ? (
                  <img src={seller.avatar} alt={seller.name} className="h-20 w-20 rounded-full border-4 border-white object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-2xl font-bold text-white">
                    {initials}
                  </div>
                )}
                <div className="pb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{seller?.storeName || seller?.name || 'Seller'}</h1>
                  <p className="text-sm text-gray-500">{seller?.email}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {seller?.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    <Shield size={12} /> Verified
                  </span>
                )}
                {seller?.role && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    <User size={12} /> {seller.role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Micro cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-gray-500"><User size={14} /> Gender</div>
              <p className="mt-1 font-medium text-gray-900">{seller?.gender || '—'}</p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-gray-500"><Calendar size={14} /> Member Since</div>
              <p className="mt-1 font-medium text-gray-900">{seller?.createdAt ? new Date(seller.createdAt).toLocaleDateString() : '—'}</p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-gray-500"><MapPin size={14} /> Address</div>
              <p className="mt-1 font-medium text-gray-900">
                {seller?.address ? [seller.address.street, seller.address.city, seller.address.country].filter(Boolean).join(', ') || '—' : '—'}
              </p>
            </div>
          </div>

          {/* Bio */}
          {seller?.bio && (
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-600">{seller.bio}</p>
            </div>
          )}

          {/* Listings */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Listings & Products</h2>
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
                <Package size={32} className="mb-2" />
                <p className="text-sm">No products listed yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {products.map((p) => (
                  <Link key={p._id} to={`/products/${p._id}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
                    <div className="aspect-[4/3] overflow-hidden bg-[#f8f9fa]">
                      <img src={(p.images?.[0]?.url ?? p.images?.[0]) || 'https://placehold.co/400x300?text=No+Image'} alt={p.title} className="h-full w-full object-contain" />
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-1 font-medium text-gray-900">{p.title}</h3>
                      <span className="text-sm font-bold text-blue-600">{p.price} {p.currency === 'SEK' ? 'sek' : p.currency.toLowerCase()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - AI Copilot */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-600" />
              <h2 className="font-semibold text-gray-900">AI Admin Copilot</h2>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <button onClick={() => sendCopilotQuery('Risk Audit')} className="rounded-full bg-gray-100 px-3 py-1 text-xs hover:bg-gray-200">Risk Audit</button>
              <button onClick={() => sendCopilotQuery('Brief Summary')} className="rounded-full bg-gray-100 px-3 py-1 text-xs hover:bg-gray-200">Brief Summary</button>
            </div>
            <div className="mb-3 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Product Moderation</p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => sendCopilotQuery('Audit and check verification status of all products')} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition-all">📦 Audit Listings</button>
                <button onClick={() => handleProductAction(products[0]?._id, 'VERIFY_PRODUCT')} className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium transition-all">✅ Approve First Item</button>
                <button onClick={() => handleProductAction(products[0]?._id, 'REJECT_PRODUCT')} className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg font-medium transition-all">❌ Reject First Item</button>
              </div>
            </div>
            <div className="mb-3 max-h-40 overflow-y-auto space-y-2 text-xs">
              {chatHistory.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right text-blue-600' : 'text-gray-700 whitespace-pre-wrap'}>{m.text}</div>
              ))}
              {isThinking && <div className="text-gray-400">Thinking...</div>}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendCopilotQuery(prompt); }}
                placeholder="Ask about this seller..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={() => sendCopilotQuery(prompt)} className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
