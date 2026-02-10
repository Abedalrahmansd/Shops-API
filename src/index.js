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

import { errorHandler } from './middleware/error.js';
import mongoSanitize from 'mongo-sanitize';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(helmet());
app.use(rateLimit({ windowMs: config.RATE_LIMIT_WINDOW * 60 * 1000, max: config.RATE_LIMIT_MAX }));
// Serve static files from uploads folder
app.use('/uploads', express.static('src/uploads'));

app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  next();
});


// Connect DB
// Set custom DNS servers to avoid potential DNS resolution issues with MongoDB Atlas
dns.setServers(["1.1.1.1"]);
// Check if DB_URI is defined
if (!config.DB_URI) {
    throw new Error('DB_URI is not defined in environment variables');
}
// Connect to MongoDB
mongoose.connect(config.DB_URI_TEST)
  .then(() => console.log(`MongoDB connected successfully in ${config.NODE_ENV} mode.`))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes (import later)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes); 
app.use('/api/v1/shops', shopRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/carts', cartRoutes);
app.use('/api/v1/orders', orderRoutes);

app.use('/', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});
app.use(errorHandler); // At end of middleware stack

const PORT = config.PORT || 5000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
export default app; // Export for testing