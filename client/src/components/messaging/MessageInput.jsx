import { useState } from 'react';

export default function MessageInput({ onSend }) {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSend(content.trim());
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 bg-white p-4 border-t border-gray-200">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a message..."
        className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={!content.trim()}
        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
      >
        Send
      </button>
    </form>
  );
}
