import { useState } from 'react';

const SELLER = {
  name: 'Alex Rivera',
  avatar: 'https://i.pravatar.cc/120?img=12',
  verified: true,
  rating: 4.9,
  reviews: 42,
  memberSince: 'Jan 2024',
  response: 'Usually responds within 30 mins',
  shipOnTime: '100% Ship-on-time rate',
  location: 'Austin, TX',
  badges: ['Local Pickup Only', 'Meets in Public Places'],
};

const LISTINGS = [
  { id: 1, title: 'Vintage Leather Jacket', price: 85, condition: 'Like New', shipping: false, image: 'https://picsum.photos/seed/jacket/400/300', status: 'active' },
  { id: 2, title: 'Mechanical Keyboard', price: 120, condition: 'Good', shipping: true, image: 'https://picsum.photos/seed/kb/400/300', status: 'reserved' },
  { id: 3, title: 'Road Bike Helmet', price: 40, condition: 'Good', shipping: true, image: 'https://picsum.photos/seed/helmet/400/300', status: 'active' },
  { id: 4, title: 'Portable Speaker', price: 35, condition: 'Fair', shipping: false, image: 'https://picsum.photos/seed/speaker/400/300', status: 'active' },
];

const REVIEWS = [
  { id: 1, author: 'Jamie L.', rating: 5, text: 'Fast, friendly, item exactly as described.' },
  { id: 2, author: 'Chris M.', rating: 4, text: 'Great communication, smooth pickup.' },
];

export default function SellerStorefront() {
  const [tab, setTab] = useState('active');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Hero Header */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <img src={SELLER.avatar} alt={SELLER.name} className="h-24 w-24 rounded-full object-cover ring-4 ring-blue-100" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{SELLER.name}</h1>
                {SELLER.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    ✓ Verified Seller
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span>★ {SELLER.rating}/5 ({SELLER.reviews} reviews)</span>
                <span>• Member since {SELLER.memberSince}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                <span>⏱ {SELLER.response}</span>
                <span>📦 {SELLER.shipOnTime}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Message Seller</button>
              <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Follow</button>
            </div>
          </div>

          {/* Preferences */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {SELLER.badges.map((b) => (
              <span key={b} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{b}</span>
            ))}
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">📍 {SELLER.location}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="flex gap-6 text-sm font-medium">
            {[
              { key: 'active', label: `Active Listings (${LISTINGS.filter(l=>l.status==='active').length})` },
              { key: 'sold', label: 'Past Sold Items' },
              { key: 'reviews', label: 'Reviews' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`border-b-2 pb-3 ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6">
          {tab === 'active' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {LISTINGS.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                  <div className="relative">
                    <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
                    {item.status === 'reserved' && (
                      <span className="absolute left-2 top-2 rounded bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">Reserved</span>
                    )}
                    <span className="absolute right-2 top-2 rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-700">{item.condition}</span>
                  </div>
                  <div className="p-3">
                    <h3 className="truncate text-sm font-semibold text-gray-900">{item.title}</h3>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">${item.price}</span>
                      <span className="text-xs text-gray-500">{item.shipping ? '🚚 Shipping' : '📍 Local Pickup'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'sold' && (
            <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">No past sold items yet.</div>
          )}
          {tab === 'reviews' && (
            <div className="space-y-3">
              {REVIEWS.map((r) => (
                <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{r.author}</span>
                    <span className="text-sm text-amber-500">{'★'.repeat(r.rating)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
