// src/controllers/analytics.js
import Shop from '../models/Shop.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getShopAnalytics = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const { startDate, endDate } = req.query;

  const shop = await Shop.findById(shopId);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  // Build date filter
  const dateFilter = {};
  if (startDate) {
    dateFilter.createdAt = { $gte: new Date(startDate) };
  }
  if (endDate) {
    if (dateFilter.createdAt) {
      dateFilter.createdAt.$lte = new Date(endDate);
    } else {
      dateFilter.createdAt = { $lte: new Date(endDate) };
    }
  }

  const orders = await Order.find({ shop: shopId, ...dateFilter });
  const reviews = await Review.find({ shop: shopId, ...dateFilter });

  // Top products
  const topProducts = await Order.aggregate([
    { $match: { shop: new mongoose.Types.ObjectId(shopId), ...dateFilter } },
    { $unwind: '$items' },
    { $group: { 
        _id: '$items.product', 
        sales: { $sum: '$items.quantity' }, 
        revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } } 
      } 
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $project: { _id: 0, product: '$product.title', sales: 1, revenue: 1 } },
  ]);

  // Revenue by day
  const revenueByDay = await Order.aggregate([
    { $match: { shop: new mongoose.Types.ObjectId(shopId), ...dateFilter } },
    { $group: { 
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, 
        total: { $sum: '$total' },
        count: { $sum: 1 }
      } 
    },
    { $sort: { _id: 1 } },
  ]);

  const stats = {
    views: shop.views.length,
    likes: shop.likes.length,
    shares: shop.shares,
    followersCount: shop.followers.length,
    orderCount: orders.length,
    totalRevenue: orders.reduce((acc, o) => acc + o.total, 0),
    reviewAvg: reviews.length ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0,
    reviewCount: reviews.length,
    topProducts,
    revenueByDay,
    averageOrderValue: orders.length ? orders.reduce((acc, o) => acc + o.total, 0) / orders.length : 0,
  };

  res.json({ success: true, stats });
});

export const getProductAnalytics = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId).populate('shop');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const orders = await Order.find({ 'items.product': productId });

  const stats = {
    views: product.views.length,
    likes: product.likes.length,
    stock: product.stock,
    ordersCount: orders.length,
  };

  res.json({ success: true, stats });
});