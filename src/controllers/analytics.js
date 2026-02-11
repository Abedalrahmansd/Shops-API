// src/controllers/analytics.js
import Shop from '../models/Shop.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';

export const getShopAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query; // e.g., YYYY-MM-DD
  const shop = await Shop.findById(req.params.shopId);
  const orders = await Order.find({ shop: shop._id, ...dateFilter });
  const reviews = await Review.find({ shop: shop._id });
  const dateFilter = startDate ? { createdAt: { $gte: new Date(startDate), $lte: endDate ? new Date(endDate) : new Date() } } : {};

  const stats = {
    views: shop.views.length, // Using array .length
    likes: shop.likes.length,
    shares: shop.shares,
    followersCount: shop.followers.length,
    orderCount: orders.length,
    totalRevenue: orders.reduce((acc, o) => acc + o.total, 0),
    reviewAvg: reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0,
  };

  // Top products: Aggregate
  const topProducts = await Order.aggregate([
    { $match: { shop: shop._id, ...dateFilter } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', count: { $sum: '$items.quantity' } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
  ]);
  stats.topProducts = topProducts;

  res.json({ success: true, stats });
};