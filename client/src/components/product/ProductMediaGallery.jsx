import { ChevronLeft, ChevronRight, Heart, Maximize, X, Share2, Flag } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useFavorites } from '../../context/FavoritesContext.jsx';

// Lightbox toggle is managed by the parent via the `isOpen` prop.
// This component renders both the inline gallery and (optionally) a fullscreen lightbox.
export default function ProductMediaGallery({
  images,
  isOpen = false,
  onClose,
  productId,
}) {
  const { user } = useAuth();
  const { isFavorited, toggleInList, lists } = useFavorites();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(isOpen);

  const imageList = Array.isArray(images) ? images : [];
  const currentImage = imageList[currentIndex] || imageList[0];
  const isFav = productId ? isFavorited(productId) : false;

  // Count how many of the user's lists contain this product (like count).
  const likeCount = productId
    ? lists.reduce((n, list) => {
        const ids = (list.listings || []).map((l) => (l._id?.toString?.() || l.toString?.() || l).toString());
        return n + (ids.includes(productId.toString()) ? 1 : 0);
      }, 0)
    : 0;

  const handlePrev = () => setCurrentIndex((i) => (i === 0 ? imageList.length - 1 : i - 1));
  const handleNext = () => setCurrentIndex((i) => (i === imageList.length - 1 ? 0 : i + 1));
  const handleSelect = (idx) => setCurrentIndex(idx);

  const handleToggleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (!productId) return;
    try {
      const saved = await toggleInList('default', productId);
      // toggleInList returns whether it was saved; we don't strictly need to update state here
      // because `isFavorited` derives from the context's `lists` which is updated internally.
    } catch (err) {
      // silently ignore toggle errors in gallery
    }
  };

  const handleLightbox = () => setLightboxOpen((o) => !o);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/products/${productId}`);
    } catch (e) {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = `${window.location.origin}/products/${productId}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!imageList.length) return null;

  const galleryClass =
    'relative rounded-xl border border-gray-200 bg-gray-100 overflow-hidden aspect-square group';

  const thumbnailClass = (idx) =>
    `flex h-12 w-12 shrink-0 items-center justify-center rounded border-2 transition-colors ${
      idx === currentIndex ? 'border-blue-600 ring-1 ring-blue-600' : 'border-transparent hover:border-gray-300'
    }`;

  return (
    <>
      {/* Inline gallery (desktop left column / mobile top) */}
      <div className={galleryClass}>
        <img
          src={currentImage.url || currentImage}
          alt="Product"
          className="w-full h-full object-contain bg-white"
          loading="lazy"
          onClick={() => setLightboxOpen(true)}
          style={{ cursor: imageList.length > 1 ? 'zoom-in' : 'default' }}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
        />

        {/* Hover zoom icon overlay */}
        <div
          className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none"
          style={{ cursor: imageList.length > 1 ? 'zoom-in' : 'default' }}
        >
          <span className="flex items-center justify-center h-12 w-12 rounded-full bg-white/80 backdrop-blur-sm shadow-sm">
            <Maximize size={22} className="text-gray-800" />
          </span>
        </div>

        {/* Counter badge */}
        <div className="absolute inset-x-0 bottom-2 flex justify-center">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-xs text-white backdrop-blur-sm">
            {currentIndex + 1} / {imageList.length}
          </span>
        </div>

        {/* Navigation arrows */}
        {imageList.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 px-2 items-center justify-center text-white hover:bg-black/60 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 px-2 items-center justify-center text-white hover:bg-black/60 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Favorite + like count (top right) */}
        <div className="absolute right-2 top-2 z-20 flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={handleToggleFav}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            className={`h-10 w-10 rounded-full bg-white/90 flex items-center justify-center shadow-sm backdrop-blur transition-colors hover:bg-white ${
              isFav ? 'text-red-500' : 'text-gray-700'
            }`}
          >
            <Heart size={20} />
          </button>
          {likeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-[10px] font-bold text-red-700 border border-red-200">
              {likeCount}
            </span>
          )}
        </div>

        <img
          src={currentImage.url || currentImage}
          alt="Product"
          className="w-full h-full object-contain bg-white"
          loading="lazy"
          onClick={() => setLightboxOpen(true)}
          style={{ cursor: imageList.length > 1 ? 'zoom-in' : 'default' }}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
        />

        {/* Counter badge */}
        <div className="absolute inset-x-0 bottom-2 flex justify-center">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-xs text-white backdrop-blur-sm">
            {currentIndex + 1} / {imageList.length}
          </span>
        </div>

        {/* Navigation arrows */}
        {imageList.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 px-2 items-center justify-center text-white hover:bg-black/60 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 px-2 items-center justify-center text-white hover:bg-black/60 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {imageList.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {imageList.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              className={thumbnailClass(idx)}
              aria-label={`Image ${idx + 1}`}
            >
              <img
                src={imageList[idx].url || imageList[idx]}
                alt={`Thumbnail ${idx + 1}`}
                className="h-10 w-10 object-contain bg-white rounded p-0.5"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxOpen(false);
          }}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-10 right-0 h-11 w-11 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/40 transition-colors"
              aria-label="Close"
            >
              <X size={22} strokeWidth={2} />
            </button>

            <img
              src={currentImage.url || currentImage}
              alt="Product"
              className="w-full max-h-[80vh] object-contain rounded-lg"
              loading="lazy"
            />

            {imageList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/30 transition-colors z-20"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/30 transition-colors z-20"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {imageList.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setLightboxOpen(true);
                  }}
                  className={`h-8 w-8 rounded border-2 transition-colors ${
                    idx === currentIndex ? 'border-blue-600' : 'border-transparent hover:border-white/40'
                  }`}
                >
                  <img
                    src={imageList[idx].url || imageList[idx]}
                    alt={`Thumbnail ${idx + 1}`}
                    className="h-6 w-6 object-contain bg-white rounded p-0"
                  />
                </button>
              ))}
            </div>

            <div className="mt-4 text-xs text-gray-400">
              {currentIndex + 1} / {imageList.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}