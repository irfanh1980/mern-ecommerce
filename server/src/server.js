import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { isCloudinaryConfigured } from './config/cloudinary.js';
import { isEmailConfigured } from './utils/emailSender.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

const PORT = process.env.PORT || 5000;

if (!isCloudinaryConfigured) {
  console.warn(
    '[warning] Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in server/.env to enable image uploads.'
  );
}

if (!isEmailConfigured) {
  console.warn(
    '[warning] SMTP is not configured - verification emails will NOT be sent.\n[warning] Set SMTP_HOST, SMTP_USER and SMTP_PASS in server/.env, then run "npm run test:email" to verify the connection.'
  );
}

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.name} (${socket.userId})`);

  // Join conversation room
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`${socket.user.name} joined conversation ${conversationId}`);
  });

  // Leave conversation room
  socket.on('leaveConversation', (conversationId) => {
    socket.leave(conversationId);
  });

  // Send message via socket
  socket.on('sendMessage', async ({ conversationId, content }) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(socket.userId)) {
        socket.emit('messageError', { message: 'Conversation not found or access denied' });
        return;
      }

      const message = await Message.create({
        conversation: conversationId,
        sender: socket.userId,
        content,
      });

      const populatedMessage = await Message.findById(message._id).populate('sender', 'name avatar role');

      // Update conversation
      conversation.lastMessage = message._id;
      const otherParticipant = conversation.participants.find(
        (p) => p.toString() !== socket.userId
      );
      if (otherParticipant) {
        const currentUnread = conversation.unreadCount.get(otherParticipant.toString()) || 0;
        conversation.unreadCount.set(otherParticipant.toString(), currentUnread + 1);
      }
      await conversation.save();

      // Emit to all in the conversation room
      io.to(conversationId).emit('newMessage', populatedMessage);

      // Notify the other participant specifically if they're in a different room
      if (otherParticipant) {
        io.to(otherParticipant.toString()).emit('unreadCountUpdate', {
          conversationId,
          unreadCount: conversation.unreadCount.get(otherParticipant.toString()) || 0,
        });
      }
    } catch (error) {
      socket.emit('messageError', { message: error.message });
    }
  });

  // Mark messages as read
  socket.on('markAsRead', async ({ conversationId }) => {
    try {
      await Message.updateMany(
        { conversation: conversationId, sender: { $ne: socket.userId }, read: false },
        { read: true, readAt: new Date() }
      );

      const conversation = await Conversation.findById(conversationId);
      if (conversation && conversation.unreadCount) {
        conversation.unreadCount.set(socket.userId, 0);
        await conversation.save();
      }

      socket.to(conversationId).emit('messagesRead', { conversationId, userId: socket.userId });
    } catch (error) {
      socket.emit('messageError', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.name} (${socket.userId})`);
  });
});

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
