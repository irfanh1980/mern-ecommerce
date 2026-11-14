import { useMemo, useState } from 'react';
import { Search, X, Image as ImageIcon, Check, Plus } from 'lucide-react';

const thumbnail = (listing) => {
  const img = listing?.images?.[0];
  return img?.url ?? img ?? null;
};

export default function AddToFavoritesModal({ product, lists, loading, onClose, onToggle, onCreate }) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const productId = product?._id?.toString();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lists;
    return lists.filter((l) => l.name.toLowerCase().includes(q));
  }, [lists, query]);

  const isInList = (list) =>
    (list.listings || []).some((p) => (p._id?.toString?.() || p.toString?.()) === productId);

  const handleToggle = async (list) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await onToggle(list._id, product._id);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update list');
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      setError('Enter a list name');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const list = await onCreate(name);
      // Immediately add the current listing to the new list
      await onToggle(list._id, product._id);
      setNewName('');
      setCreating(false);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create list');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="favorites-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="favorites-modal-title" className="text-lg font-semibold text-gray-900">
            Add to a favorites list
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Search & create row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name of a list"
                className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-9 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {!creating ? (
              <button
                type="button"
                onClick={() => {
                  setCreating(true);
                  setError('');
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                <Plus size={16} /> Create new list
              </button>
            ) : null}
          </div>

          {creating && (
            <div className="flex gap-2">
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
                Save
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

          {/* Lists */}
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {loading ? (
              <p className="py-6 text-center text-sm text-gray-500">Loading lists...</p>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                {query ? 'No lists match your search.' : 'No lists yet. Create your first list.'}
              </p>
            ) : (
              filtered.map((list) => {
                const cover = thumbnail(list.listings?.[list.listings.length - 1]);
                const saved = isInList(list);
                return (
                  <button
                    key={list._id}
                    type="button"
                    onClick={() => handleToggle(list)}
                    disabled={busy}
                    className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors disabled:opacity-60 ${
                      saved
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                      {cover ? (
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-gray-400" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {list.name}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {list.listings?.length || 0} item{(list.listings?.length || 0) === 1 ? '' : 's'}
                      </span>
                    </span>
                    {saved && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check size={14} />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}