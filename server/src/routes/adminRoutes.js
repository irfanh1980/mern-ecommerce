import { Router } from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllProductsAdmin,
  deleteProductAdmin,
  getAllOrdersAdmin,
  updateOrderStatus,
  deleteOrderAdmin,
  getDashboardStats,
} from '../controllers/adminController.js';

const router = Router();

// All admin routes require authentication and Admin role
router.use(protect);
router.use(restrictTo('Admin'));

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Products (admin override)
router.get('/products', getAllProductsAdmin);
router.delete('/products/:id', deleteProductAdmin);

// Orders
router.get('/orders', getAllOrdersAdmin);
router.patch('/orders/:id/status', updateOrderStatus);
router.delete('/orders/:id', deleteOrderAdmin);

export default router;
