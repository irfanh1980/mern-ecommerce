import { Router } from 'express';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

const router = Router();

router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('name email storeName isVerified role avatar bio phone gender address createdAt');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.status(200).json({ success: true, data: user });
}));

export default router;
