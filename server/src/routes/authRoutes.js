import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  verifyEmail,
  resendVerification,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateMiddleware } from '../middleware/validateMiddleware.js';
import { profileUpdateSchema, passwordChangeSchema } from '../validators/userValidator.js';

const router = Router();

// Registration is capped per IP to stop signup spam. Successful registrations
// are not counted.
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again in a few minutes.',
  },
});

router.post('/register', registerLimiter, register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, validateMiddleware(profileUpdateSchema), updateProfile);
router.post('/change-password', protect, validateMiddleware(passwordChangeSchema), changePassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerification);

export default router;
