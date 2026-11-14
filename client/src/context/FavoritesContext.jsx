import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AddToFavoritesModal from '../components/favorites/AddToFavoritesModal';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { api, user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);

  const fetchLists = useCallback(async () => {
    if (!user) {
      setLists([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/api/favorites');
      setLists(data.data || []);
    } catch (e) {
      setLists([]);
    } finally {
      setLoading(false);
    }
  }, [api, user]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const openFavoritesModal = useCallback((product) => {
    if (!user) return false;
    setModalProduct(product);
    return true;
  }, [user]);

  const closeFavoritesModal = useCallback(() => setModalProduct(null), []);

  const toggleInList = useCallback(async (listId, productId) => {
    const { data } = await api.put(`/api/favorites/${listId}/toggle`, { listingId: productId });
    const updated = data.data;
    setLists((prev) => {
      const exists = prev.some((l) => l._id === updated._id);
      if (!exists) return [...prev, updated];
      return prev.map((l) => (l._id === updated._id ? updated : l));
    });
    return data.saved;
  }, [api]);

  const createList = useCallback(async (name) => {
    const { data } = await api.post('/api/favorites', { name });
    setLists((prev) => [...prev, data.data]);
    return data.data;
  }, [api]);

  const deleteList = useCallback(async (listId) => {
    await api.delete(`/api/favorites/${listId}`);
    setLists((prev) => prev.filter((l) => l._id !== listId));
  }, [api]);

  const savedListIds = useMemo(() => {
    const map = {};
    lists.forEach((l) => {
      (l.listings || []).forEach((p) => {
        const id = p._id?.toString?.() || p.toString?.() || p;
        map[id] = true;
      });
    });
    return map;
  }, [lists]);

  const isFavorited = useCallback(
    (productId) => Boolean(productId && savedListIds[productId.toString()]),
    [savedListIds]
  );

  const value = useMemo(
    () => ({
      lists,
      loading,
      fetchLists,
      openFavoritesModal,
      closeFavoritesModal,
      toggleInList,
      createList,
      deleteList,
      isFavorited,
    }),
    [lists, loading, fetchLists, openFavoritesModal, closeFavoritesModal, toggleInList, createList, deleteList, isFavorited]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      {modalProduct && (
        <AddToFavoritesModal
          product={modalProduct}
          lists={lists}
          loading={loading}
          onClose={closeFavoritesModal}
          onToggle={toggleInList}
          onCreate={createList}
        />
      )}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
};