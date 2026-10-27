import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createCheckoutSession } from '../controllers/paymentController.js';

const router = Router();

router.post('/create-checkout-session', protect, createCheckoutSession);

export default router;
