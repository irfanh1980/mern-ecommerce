import { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';

export default function ImageGallery({ images = [] }) {
  const [current, setCurrent] = useState(0);
  if (!images.length) {
    return (
      <div className="aspect-[4/3] rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
        No image
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  const src = (img) => (typeof img === 'string' ? img : img.url);

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
        {/* Blurred background fill */}
        <img
          src={src(images[current])}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover filter blur-2xl scale-110"
        />
        <div className="absolute inset-0 bg-white/40" />
        {/* Contained main image */}
        <img
          src={src(images[current])}
          alt=""
          className="relative w-full h-full object-contain"
        />
        {/* Counter badge */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
          {current + 1} / {images.length}
        </div>
        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        {/* Favorite FAB */}
        <button
          aria-label="Add to favorites"
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow hover:bg-gray-50"
        >
          <Heart size={18} className="text-gray-700" />
        </button>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-16 h-16 rounded-md overflow-hidden border-2 transition ${
                i === current ? 'border-blue-600' : 'border-transparent'
              }`}
            >
              <img src={src(img)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}