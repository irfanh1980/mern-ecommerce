import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * GET /api/conversations
 * List all conversations for the current user
 */
/**
 * GET /api/conversations
 * List all conversations for the current user
 */
export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
    isDeleted: { $ne: true },
  })
    .populate('participants', 'name avatar role isVerified')
    .populate('listing', 'title price currency images isActive')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  // Add unread count for current user (retrieve from Map before .toObject())
  const result = conversations.map((c) => {
    const unread = c.unreadCount?.get(req.user._id.toString()) || 0;
    const obj = c.toObject();
    obj.unreadCount = unread;
    return obj;
  });

  res.status(200).json({ success: true, count: result.length, data: result });
});

/**
 * POST /api/conversations
 * Get or create a conversation between current user and a recipient about a listing
 */
export const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { listingId, recipientId } = req.body;

  // Validate listing exists
  const listing = await Product.findById(listingId);
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  // Validate recipient exists
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    return res.status(404).json({ success: false, message: 'Recipient not found' });
  }

  // Cannot message yourself
  if (recipientId === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot start a conversation with yourself' });
  }

  // Find existing conversation between these two participants about this listing
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, recipientId] },
    listing: listingId,
  })
    .populate('participants', 'name avatar role isVerified')
    .populate('listing', 'title price currency images isActive')
    .populate('lastMessage');

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [...new Set([req.user._id.toString(), recipientId])],
      listing: listingId,
    });
    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name avatar role isVerified')
      .populate('listing', 'title price currency images isActive');
  }

  res.status(200).json({ success: true, data: conversation });
});

/**
 * GET /api/conversations/:id/messages
 * Get messages in a conversation (paginated)
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  // Check user is a participant
  if (!conversation.participants.some((p) => p.equals(req.user._id))) {
    return res.status(403).json({ success: false, message: 'Not authorized to view this conversation' });
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 50, 100));
  const skip = (pageNum - 1) * limitNum;

  const [messages, total] = await Promise.all([
    Message.find({ conversation: id })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Message.countDocuments({ conversation: id }),
  ]);

  // Mark messages as read for current user
  await Message.updateMany(
    { conversation: id, sender: { $ne: req.user._id }, read: false },
    { read: true, readAt: new Date() }
  );

  // Reset unread count for current user
  if (conversation.unreadCount) {
    conversation.unreadCount.set(req.user._id.toString(), 0);
    await conversation.save();
  }

  res.status(200).json({
    success: true,
    count: messages.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: messages.reverse(),
  });
});

/**
 * POST /api/conversations/:id/messages
 * Send a message in a conversation
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  // Check user is a participant
  if (!conversation.participants.some((p) => p.equals(req.user._id))) {
    return res.status(403).json({ success: false, message: 'Not authorized to send messages in this conversation' });
  }

  const message = await Message.create({
    conversation: id,
    sender: req.user._id,
    content,
  });

  const populatedMessage = await Message.findById(message._id).populate('sender', 'name avatar role');

  // Update conversation
  conversation.lastMessage = message._id;
  const otherParticipant = conversation.participants.find(
    (p) => p.toString() !== req.user._id.toString()
  );
  if (otherParticipant) {
    const currentUnread = conversation.unreadCount.get(otherParticipant.toString()) || 0;
    conversation.unreadCount.set(otherParticipant.toString(), currentUnread + 1);
  }
  await conversation.save();

  res.status(201).json({ success: true, data: populatedMessage });
});

/**
 * GET /api/conversations/unread-count
 * Get total unread message count for current user
 */
export const deleteMessage = asyncHandler(async (req, res) => {
  const { id, messageId } = req.params;
  const conversation = await Conversation.findById(id);
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }
  if (!conversation.participants.some((p) => p.equals(req.user._id))) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  await Message.deleteOne({ _id: messageId, conversation: id });
  res.status(200).json({ success: true, message: 'Message deleted' });
});

export const clearConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const conversation = await Conversation.findById(id);
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }
  if (!conversation.participants.some((p) => p.equals(req.user._id))) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  await Message.deleteMany({ conversation: id });
  await Conversation.deleteOne({ _id: id });
  res.status(200).json({ success: true, message: 'Conversation deleted' });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  });

  let totalUnread = 0;
  conversations.forEach((c) => {
    totalUnread += c.unreadCount?.get(req.user._id.toString()) || 0;
  });

  res.status(200).json({ success: true, unreadCount: totalUnread });
});
