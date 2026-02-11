import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import dns from "node:dns/promises";
import { config } from './config/index.js'; // Load env

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import shopRoutes from './routes/shop.js';
import productRoutes from './routes/product.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/order.js';
import reviewRoutes from './routes/review.js';
import searchRoutes from './routes/search.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';
import feedRoutes from './routes/feed.js';
import notificationRoutes from './routes/notification.js';
import { startCron } from './utils/cron.js';

import { errorHandler } from './middleware/error.js';
import mongoSanitize from 'mongo-sanitize';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import logger from './utils/logger.js';
import morgan from 'morgan';

import i18n from './config/i18n.js';

import { generalLimiter } from './middleware/rateLimit.js';
import {Server} from 'socket.io';
import http from 'http';

import Message from './models/Message.js';

import jwt from 'jsonwebtoken';
import passport from './config/passport.js';

// Import controllers to set io instance
import * as orderController from './controllers/order.js';
import * as chatController from './controllers/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Replace console with logger
console.log = logger.info.bind(logger);
console.error = logger.error.bind(logger);

// Server with Socket.io
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Set io instance in controllers
orderController.setIO(io);
chatController.setIO(io);

// Socket.io authentication and connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token provided'));
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  logger.info(`User ${socket.user.id} connected via Socket.io`);
  socket.join(`user:${socket.user.id}`); // Auto-join own room

  socket.on('joinShop', (shopId) => {
    socket.join(`shop:${shopId}`);
    logger.info(`User ${socket.user.id} joined shop ${shopId}`);
  });

  socket.on('leaveShop', (shopId) => {
    socket.leave(`shop:${shopId}`);
    logger.info(`User ${socket.user.id} left shop ${shopId}`);
  });

  socket.on('sendMessage', async ({ shopId, content, productId }) => {
    try {
      if (!content || content.trim().length === 0) {
        socket.emit('error', 'Message content is required');
        return;
      }

      const message = new Message({ 
        shop: shopId, 
        from: socket.user.id, 
        to: 'ownerIdLogic', // TODO: Dynamic to
        content: content.trim(), 
        productId 
      });
      await message.save();
      await message.populate('from', 'name avatar');
      io.to(`shop:${shopId}`).emit('newMessage', message);
    } catch (err) {
      logger.error('Socket message error:', err);
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('disconnect', () => {
    logger.info(`User ${socket.user.id} disconnected from Socket.io`);
  });

  socket.on('error', (err) => {
    logger.error('Socket error:', err);
  });
});

// Middleware setup
app.use(passport.initialize());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(generalLimiter);
app.use(helmet({ contentSecurityPolicy: false }));

// Serve static files from uploads folder
app.use('/uploads', express.static('src/uploads'));

app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  next();
});

app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Set custom DNS servers to avoid potential DNS resolution issues with MongoDB Atlas
dns.setServers(["1.1.1.1"]);

// Check if DB_URI is defined
if (!config.DB_URI) {
  throw new Error('DB_URI is not defined in environment variables');
}

// Connect to MongoDB
mongoose.connect(config.DB_URI)
  .then(() => logger.info(`MongoDB connected successfully in ${config.NODE_ENV} mode.`))
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes); 
app.use('/api/v1/shops', shopRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/carts', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/feed', feedRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// App version
app.get('/api/app-version', (req, res) => {
  res.json({ success: true, version: process.env.APP_VERSION || '1.0.0' });
});

// Start cron jobs
try {
  startCron();
  logger.info('Cron jobs started');
} catch (err) {
  logger.error('Failed to start cron jobs:', err);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found', path: req.path });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = config.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    logger.info(`Environment: PRODUCTION`);
  } else {
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  }
});

export default app; // Export for testing
export { io }; // Export io for other modules