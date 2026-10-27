export default function MessageBubble({ message, currentUserId }) {
  const isSentByMe = message.sender._id === currentUserId || message.sender === currentUserId;

  return (
    <div
      className={`flex ${
        isSentByMe ? 'justify-end' : 'justify-start'
      } mb-3`}
    >
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isSentByMe
            ? 'bg-blue-600 text-white rounded-tr-none'
            : 'bg-gray-100 text-gray-900 rounded-tl-none'
        }`}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        <span className={`text-xs ${isSentByMe ? 'text-blue-200' : 'text-gray-500'} mt-1 block`}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {message.read && !isSentByMe ? ' ✓' : ''}
        </span>
      </div>
    </div>
  );
}
