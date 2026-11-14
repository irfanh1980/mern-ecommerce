import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFavorites } from '../../context/FavoritesContext';

export default function FavoriteHeartButton({ product, className = '', size = 20 }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFavorited, openFavoritesModal } = useFavorites();

  if (!product?._id) return null;

  const active = isFavorited(product._id);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    openFavoritesModal(product);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={active}
      className={`inline-flex items-center justify-center rounded-full bg-white/90 p-2 shadow-sm backdrop-blur transition-colors hover:bg-white ${className}`}
    >
      <Heart
        size={size}
        className={active ? 'fill-red-500 text-red-500' : 'text-gray-500'}
      />
    </button>
  );
}