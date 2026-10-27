import 'dotenv/config';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import popularSearchRoutes from './routes/popularSearchRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import { webhookHandler } from './controllers/paymentController.js';

const app = express();

const isDev = process.env.NODE_ENV !== 'production';
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Vite React Fast Refresh needs eval + inline scripts in development only
        scriptSrc: isDev ? ["'self'", "'unsafe-eval'", "'unsafe-inline'"] : ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        // Cloudinary serves product images
        imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: isDev
          ? ["'self'", frontendOrigin, 'ws://localhost:5173', 'ws://localhost:5000', 'https://api.cloudinary.com']
          : ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: isDev ? null : [],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);
// General safety net. Authentication endpoints have their own stricter limiter
// (see routes/authRoutes.js) so that normal app traffic is never throttled.
// The window is short so a runaway client can never lock the app out for long.
app.use(
  rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
    message: {
      success: false,
      message: 'Too many requests from this IP. Please wait a moment and try again.',
    },
  })
);

// Stripe webhook needs raw body - must run before express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), webhookHandler);

app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/popular-searches', popularSearchRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/conversations', conversationRoutes);

app.use(errorMiddleware);

export default app;