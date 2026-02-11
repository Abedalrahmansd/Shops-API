import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import { startCron } from './utils/cron.js';

import { errorHandler } from './middleware/error.js';
import mongoSanitize from 'mongo-sanitize';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import logger from './utils/logger.js';
import morgan from 'morgan';

import { generalLimiter } from './middleware/rateLimit.js';
import {Server} from 'socket.io';
import http from 'http';

import passport from './config/passport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Replace console with logger
console.log = logger.info.bind(logger);
console.error = logger.error.bind(logger);

// Server with Socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CORS_ORIGIN } });
io.on('connection', (socket) => {
  // Future: Auth via JWT, namespaces
  socket.emit('message', 'Chat connected - future');
});

app.use(passport.initialize()); // No session needed for JWT, but required

app.use(express.json());
app.use(generalLimiter);
app.use(helmet({ contentSecurityPolicy: false }));
// Serve static files from uploads folder
app.use('/uploads', express.static('src/uploads'));

app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  next();
});

app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } })); // Log to Winston

// Connect DB
// Set custom DNS servers to avoid potential DNS resolution issues with MongoDB Atlas
dns.setServers(["1.1.1.1"]);
// Check if DB_URI is defined
if (!config.DB_URI) {
    throw new Error('DB_URI is not defined in environment variables');
}
// Connect to MongoDB
mongoose.connect(config.DB_URI)
  .then(() => console.log(`MongoDB connected successfully in ${config.NODE_ENV} mode.`))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes (import later)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes); 
app.use('/api/v1/shops', shopRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/carts', cartRoutes);
app.use('/api/v1/orders', orderRoutes);

app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/feed', feedRoutes);

// App version
app.get('/api/app-version', (req, res) => {
  res.json({ success: true, version: process.env.APP_VERSION });
});

// Start cron
startCron();

app.use('/', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

app.use(errorHandler); // At end of middleware stack

const PORT = config.PORT || 5000;
server.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
export default app; // Export for testing