import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from './errorMiddleware.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'User role unknown is not authorized to access this route',
      });
    }

    // A "Both" account (Buyer & Seller) satisfies Buyer and/or Seller requirements
    const hasAccess =
      roles.includes(req.user.role) ||
      (req.user.role === 'Both' && (roles.includes('Buyer') || roles.includes('Seller')));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
