import { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, GripVertical, Trash2, Plus } from 'lucide-react';

export default function ImageManager({ onChange }) {
  const [items, setItems] = useState([]);
  const fileInputRef = useRef(null);

  const updateParent = (next) => {
    const sorted = next.map((it, idx) => ({ ...it, order: idx }));
    setItems(sorted);
    onChange?.(sorted.map(({ id, file, previewUrl, caption, order }) => ({ file, previewUrl, caption, order })));
  };

  const addFiles = (files) => {
    const newItems = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      caption: '',
      order: 0,
    }));
    updateParent([...items, ...newItems]);
  };

  const move = (index, dir) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updateParent(next);
  };

  const remove = (index) => {
    const item = items[index];
    if (item?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
    const next = items.filter((_, i) => i !== index);
    updateParent(next);
  };

  const updateCaption = (index, caption) => {
    const next = items.map((it, i) => (i === index ? { ...it, caption } : it));
    updateParent(next);
  };

  useEffect(() => {
    return () => items.forEach((it) => {
      if (it.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(it.previewUrl);
    });
  }, []);

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="flex flex-col md:flex-row gap-3 border rounded-lg p-3">
          <div className="flex md:flex-col items-center gap-2">
            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="p-1 disabled:opacity-30">
              <ArrowUp size={16} />
            </button>
            <GripVertical size={16} className="text-gray-400" />
            <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="p-1 disabled:opacity-30">
              <ArrowDown size={16} />
            </button>
          </div>
          <img src={item.previewUrl} alt="" className="w-32 h-32 object-cover rounded" />
          <div className="flex-1 space-y-2">
            <textarea
              value={item.caption}
              onChange={(e) => updateCaption(index, e.target.value)}
              placeholder="Caption (optional)"
              className="w-full border rounded p-2 text-sm"
              rows={3}
            />
            <div className="flex gap-3 text-sm">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="text-blue-600 disabled:opacity-30">Move up</button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="text-blue-600 disabled:opacity-30">Move down</button>
              <button type="button" onClick={() => remove(index)} className="text-red-600 flex items-center gap-1">
                <Trash2 size={14} /> Delete
              </button>
            </div>
            {index === 0 && <p className="text-xs text-gray-500">Cover image</p>}
          </div>
        </div>
      ))}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
        <Plus size={16} /> Add pictures
      </button>
    </div>
  );
}