export default function ConversationListItem({
  conversation,
  currentUserId,
  onSelect,
  active,
}) {
  const otherParticipant = conversation.participants.find(
    (p) => p._id.toString() !== currentUserId.toString()
  );
  const unreadCount = conversation.unreadCount?.[currentUserId.toString()] || 0;
  const listing = conversation.listing;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
        active
          ? 'bg-blue-50 border-blue-200'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
    >
      {otherParticipant?.avatar ? (
        <img src={otherParticipant.avatar} alt={otherParticipant.name} className="h-12 w-12 rounded-full object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-600 font-medium">
          {otherParticipant?.name?.[0] || '?'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h4 className="font-semibold text-gray-900 truncate">
            {otherParticipant?.name || 'Unknown'}
          </h4>
          {unreadCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 truncate">
          {listing?.title || 'Conversation'}
        </p>
      </div>
    </button>
  );
}
