import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { io } from 'socket.io-client';
import ConversationListItem from '../components/messaging/ConversationListItem.jsx';
import MessageBubble from '../components/messaging/MessageBubble.jsx';
import MessageInput from '../components/messaging/MessageInput.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Messaging() {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [newConversationLoading, setNewConversationLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Keep a ref for activeConversation so the socket listener always knows the current value
  const activeConversationRef = useRef(activeConversation);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Initialize socket connection ONCE on mount to prevent duplicate event listeners
  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();

    const token = localStorage.getItem('token');
    if (token) {
      socketRef.current = io(API, {
        auth: { token },
      });

      socketRef.current.on('newMessage', (message) => {
        if (activeConversationRef.current && message.conversation === activeConversationRef.current._id) {
          setMessages((prev) => {
            const exists = prev.some((msg) => msg._id === message._id);
            if (exists) return prev;
            return [...prev, message];
          });
          api.post(`/api/conversations/${activeConversationRef.current._id}/messages/read`);
        } else {
          fetchConversations();
          fetchUnreadCount();
        }
      });

      socketRef.current.on('unreadCountUpdate', () => {
        fetchConversations();
        fetchUnreadCount();
      });

      socketRef.current.on('messagesRead', () => {
        fetchConversations();
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Handle joining/leaving conversation rooms when activeConversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
      socketRef.current?.emit('joinConversation', activeConversation._id);
    }
    return () => {
      if (activeConversation && socketRef.current) {
        socketRef.current.emit('leaveConversation', activeConversation._id);
      }
    };
  }, [activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

const fetchConversations = async () => {
    try {
      const { data } = await api.get('/api/conversations');
      setConversations(data.data);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false); // <-- Add this so the loading skeleton hides and your conversations render!
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/api/conversations/unread-count');
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  const fetchMessages = async (conversationId) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/conversations/${conversationId}/messages`);
      setMessages(data.data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
    setLoading(true);
  };
  
  const handleSendMessage = async (content) => {
    if (!activeConversation) return;
    setSending(true);
    try {
      await api.post(`/api/conversations/${activeConversation._id}/messages`, { content });
      socketRef.current?.emit('sendMessage', {
        conversationId: activeConversation._id,
        content,
      });
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const handleStartConversation = async (listingId, recipientId) => {
    setNewConversationLoading(true);
    try {
      const { data } = await api.post('/api/conversations', { listingId, recipientId });
      setActiveConversation(data.data);
      setMessages([]);
      setLoading(false);
      setNewConversationLoading(false);
      // Add to conversations list
      fetchConversations();
    } catch (err) {
      setNewConversationLoading(false);
      console.error('Failed to start conversation', err);
    }
  };

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-500">
              {activeConversation ? 'Conversation' : 'Select a conversation to start messaging'}
            </p>
            <button
              onClick={async () => {
                if (!activeConversation) return;
                await api.delete(`/api/conversations/${activeConversation._id}/messages`);
                setMessages([]);
              }}
              className="ml-2 text-sm text-red-600 hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${unreadCount > 0 ? 'bg-red-500' : 'bg-gray-300'} text-xs font-medium ${unreadCount > 0 ? 'text-white' : 'text-gray-600'}`}
            >
              {unreadCount > 0 ? unreadCount : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Conversations</h3>
          </div>
          {loading ? (
            <div className="p-4">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200 mb-2" />
              <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">No conversations yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 overflow-y-auto">
              {conversations.map((c) => (
                <ConversationListItem
                  key={c._id}
                  conversation={c}
                  currentUserId={user._id}
                  onSelect={handleSelectConversation}
                  active={activeConversation?._id === c._id}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Chat View */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-xl mb-3">
                💬
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Select a conversation</h3>
              <p className="text-sm text-gray-500 mt-1">
                Choose a conversation from the list to start messaging.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-2">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200 mb-2" />
                    <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg._id}
                        message={msg}
                        currentUserId={user._id}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <MessageInput
                onSend={handleSendMessage}
                disabled={sending}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
