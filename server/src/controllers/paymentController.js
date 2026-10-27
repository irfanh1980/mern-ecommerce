import 'dotenv/config';
import Stripe from 'stripe';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ productId, quantity }]
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart items required' });
  }

  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const lineItems = [];
  let totalPrice = 0;
  const orderItems = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
    }
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }
    if (quantity > product.inventory) {
      return res.status(400).json({ success: false, message: `Insufficient inventory for ${product.title}` });
    }

    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: product.title,
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity,
    });

    totalPrice += product.price * quantity;
    orderItems.push({
      product: product._id,
      quantity,
      price: product.price,
    });
  }

  const order = await Order.create({
    buyer: req.user._id,
    items: orderItems,
    totalPrice,
    paymentStatus: 'pending',
    shippingAddress: req.body.shippingAddress || {},
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: `${process.env.FRONTEND_ORIGIN}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_ORIGIN}/checkout/cancel`,
    metadata: { orderId: order._id.toString() },
  });

  order.paymentId = session.id;
  await order.save();

  res.status(200).json({ success: true, sessionId: session.id, url: session.url });
});

export const webhookHandler = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    const order = await Order.findById(orderId);
    if (order && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      await order.save();

      // decrement inventory
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { inventory: -item.quantity },
        });
      }
    }
  }

  res.status(200).json({ received: true });
});
