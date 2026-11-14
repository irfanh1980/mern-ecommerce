import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Image as ImageIcon, Plus, Trash2, ArrowLeft, X, Search } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

const cover = (list) => {
  const last = list.listings?.[list.listings.length - 1];
  const img = last?.images?.[0];
  return img?.url ?? img ?? null;
};

const currencySymbols = { SEK: 'kr', USD: '$', EUR: '€' };

export default function Favorites() {
  const { lists, loading, fetchLists, toggleInList, createList, deleteList } = useFavorites();
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [listQuery, setListQuery] = useState('');
  const [itemQuery, setItemQuery] = useState('');

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const selected = useMemo(
    () => lists.find((l) => l._id === selectedId) || null,
    [lists, selectedId]
  );

  const filteredLists = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return lists;
    return lists.filter((l) => l.name.toLowerCase().includes(q));
  }, [lists, listQuery]);

  const filteredListings = useMemo(() => {
    if (!selected?.listings) return [];
    const q = itemQuery.trim().toLowerCase();
    if (!q) return selected.listings;
    return selected.listings.filter((p) => (p.title || '').toLowerCase().includes(q));
  }, [selected, itemQuery]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    setError('');
    try {
      await createList(name);
      setNewName('');
      setCreating(false);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create list');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (list) => {
    if (!window.confirm(`Delete list "${list.name}"?`)) return;
    setBusy(true);
    try {
      await deleteList(list._id);
      if (selectedId === list._id) setSelectedId(null);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (list, productId) => {
    setBusy(true);
    try {
      await toggleInList(list._id, productId);
    } finally {
      setBusy(false);
    }
  };

  if (selected) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft size={16} /> All lists
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selected.name}</h1>
            <p className="text-sm text-gray-500">
              {selected.listings?.length || 0} item{(selected.listings?.length || 0) === 1 ? '' : 's'}
            </p>
          </div>
          {!selected.isDefault && (
            <button
              type="button"
              onClick={() => handleDelete(selected)}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 size={16} /> Delete list
            </button>
          )}
        </div>

        {selected.listings?.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <Heart size={32} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No saved items in this list yet. Browse products and tap the heart to save them.
            </p>
            <Link
              to="/products"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <div className="relative max-w-md">
              <input
                type="text"
                value={itemQuery}
                onChange={(e) => setItemQuery(e.target.value)}
                placeholder="Search in this list"
                className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-9 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {itemQuery ? (
                <button
                  type="button"
                  onClick={() => setItemQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              ) : (
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              )}
            </div>
            {filteredListings.length === 0 ? (
              <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
                No items match "{itemQuery}".
              </p>
            ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((p) => (
              <article
                key={p._id}
                className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <Link to={`/products/${p._id}`} className="relative block aspect-[4/3] overflow-hidden bg-gray-100">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]?.url ?? p.images[0]}
                      alt={p.title}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-gray-400">
                      <ImageIcon size={28} />
                    </span>
                  )}
                </Link>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <h3 className="truncate text-sm font-semibold text-gray-900">{p.title}</h3>
                  <p className="text-sm text-gray-600">
                    {currencySymbols[p.currency] || ''}
                    {p.price}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemove(selected, p._id)}
                    disabled={busy}
                    className="mt-2 inline-flex items-center gap-1 self-start rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    <X size={14} /> Remove
                  </button>
                </div>
              </article>
            ))}
            </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart size={24} className="text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Favorites</h1>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} /> New list
          </button>
        )}
      </div>

      {lists.length > 0 && (
        <div className="relative max-w-md">
          <input
            type="text"
            value={listQuery}
            onChange={(e) => setListQuery(e.target.value)}
            placeholder="Search lists"
            className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-9 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {listQuery ? (
            <button
              type="button"
              onClick={() => setListQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          ) : (
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          )}
        </div>
      )}

      {creating && (
        <div className="flex max-w-md gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="List name"
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false);
              setNewName('');
            }}
            className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500">Loading lists...</p>
      ) : lists.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <Heart size={32} className="mx-auto text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No favorites lists yet.</p>
        </div>
      ) : filteredLists.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
          No lists match "{listQuery}".
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLists.map((list) => {
            const img = cover(list);
            return (
              <div
                key={list._id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(list._id)}
                  className="relative block aspect-[16/9] overflow-hidden bg-gray-100"
                >
                  {img ? (
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-gray-400">
                      <ImageIcon size={32} />
                    </span>
                  )}
                </button>
                <div className="flex flex-1 items-center justify-between gap-2 p-4">
                  <button type="button" onClick={() => setSelectedId(list._id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {list.name}
                      {list.isDefault && (
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                          Default
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {list.listings?.length || 0} item{(list.listings?.length || 0) === 1 ? '' : 's'}
                    </span>
                  </button>
                  {!list.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleDelete(list)}
                      disabled={busy}
                      aria-label={`Delete ${list.name}`}
                      className="rounded-lg border border-red-100 bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}