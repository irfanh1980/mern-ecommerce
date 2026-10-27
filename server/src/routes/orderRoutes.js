import { Router } from 'express';
import { getMyOrders } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', protect, getMyOrders);

export default router;
