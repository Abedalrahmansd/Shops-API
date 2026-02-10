// src/controllers/analytics.js
import Shop from '../models/Shop.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';

export const getShopAnalytics = async (req, res) => {
  const shop = await Shop.findById(req.params.shopId);
  const orders = await Order.find({ shop: shop._id });
  const reviews = await Review.find({ shop: shop._id });

  const stats = {
    views: shop.views.length, // Using array .length
    likes: shop.likes.length,
    shares: shop.shares,
    followersCount: shop.followers.length,
    orderCount: orders.length,
    totalRevenue: orders.reduce((acc, o) => acc + o.total, 0),
    reviewAvg: reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0,
    // Add accesses (views), etc.
  };

  res.json({ success: true, stats });
};