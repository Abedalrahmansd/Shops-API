// src/middleware/owner.js
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import Review from '../models/Review.js';

export const isShopOwner = async (req, res, next) => {
  const shop = await Shop.findById(req.params.id || req.params.shopId);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });
  if (shop.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not owner' });
  next();
};

export const isProductOwner = async (req, res, next) => {
  console.log('Checking product ownership of:', req.params.productId);
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const shop = await Shop.findById(product.shop);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });
  if (shop.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not owner' });
  next();
};

export const isOrderOwner = async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const shop = await Shop.findById(order.shop);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });
  if (shop.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not owner' });
  next();
};

export const isReviewOwner = async (req, res, next) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  const shop = await Shop.findById(review.shop);
  if (shop.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not shop owner' });
  next();
};