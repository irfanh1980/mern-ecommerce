import { Router } from 'express';
import { validateMiddleware } from '../middleware/validateMiddleware.js';
import {
  conversationCreateSchema,
  messageSendSchema,
} from '../validators/conversationValidator.js';
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  getUnreadCount,
  deleteMessage,
  clearConversation,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getConversations);
router.post('/', validateMiddleware(conversationCreateSchema), getOrCreateConversation);
router.get('/unread-count', getUnreadCount);
router.delete('/:id/messages', clearConversation);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', validateMiddleware(messageSendSchema), sendMessage);
router.delete('/:id/messages/:messageId', deleteMessage);

export default router;
