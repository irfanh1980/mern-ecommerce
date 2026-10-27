import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// ========================== USER CRUD ==========================

export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role } = req.query;

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) filter.role = role;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 20, 100));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort('-createdAt').skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: users,
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.status(200).json({ success: true, data: user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const allowedUpdates = ['name', 'email', 'phone', 'role', 'address', 'isVerified', 'password'];
  Object.keys(req.body).forEach((key) => {
    if (allowedUpdates.includes(key)) {
      if (key === 'phone' && req.body[key] === '') {
        user[key] = '';
      } else {
        user[key] = req.body[key];
      }
    }
  });

  await user.save();
  const updatedUser = await User.findById(user._id).select('-password');
  res.status(200).json({ success: true, data: updatedUser });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.role === 'Admin') {
    return res.status(403).json({ success: false, message: 'Cannot delete an admin user' });
  }

  await user.deleteOne();
  res.status(200).json({ success: true, message: 'User deleted' });
});

// ========================== PRODUCT CRUD (Admin) ==========================

export const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, category, seller } = req.query;

  const filter = {};
  if (search) {
    filter.$text = { $search: search };
  }
  if (category) filter.category = category.toLowerCase();
  if (seller) filter.seller = seller;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 20, 100));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('seller', 'name email role')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: products,
  });
});

export const deleteProductAdmin = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  await product.deleteOne();
  res.status(200).json({ success: true, message: 'Product deleted by admin' });
});

// ========================== ORDER CRUD (Admin) ==========================

export const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, orderStatus, paymentStatus } = req.query;

  const filter = {};
  if (orderStatus) filter.orderStatus = orderStatus;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 20, 100));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('buyer', 'name email role')
      .populate('items.product', 'title price')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: orders,
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (orderStatus) order.orderStatus = orderStatus;
  if (paymentStatus) order.paymentStatus = paymentStatus;

  await order.save();
  const updatedOrder = await Order.findById(order._id)
    .populate('buyer', 'name email role')
    .populate('items.product', 'title price');

  res.status(200).json({ success: true, data: updatedOrder });
});

export const deleteOrderAdmin = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  await order.deleteOne();
  res.status(200).json({ success: true, message: 'Order deleted by admin' });
});

// ========================== DASHBOARD STATS ==========================

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalProducts, totalOrders, totalRevenue] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
    },
  });
});
