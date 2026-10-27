import Order from '../models/Order.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ buyer: req.user._id })
    .populate('items.product', 'title price images')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});
