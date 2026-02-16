// src/controllers/search.js
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';

export const search = asyncHandler(async (req, res) => {
  const { q, type = 'all', page = 1, limit = 10, all = false } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  const query = q.trim();
  let results = {};

  const skip = all ? 0 : (parseInt(page) - 1) * parseInt(limit);
  const limit_int = all ? undefined : parseInt(limit);

  // Build query using only regex to avoid text index conflicts
  const idQuery = mongoose.Types.ObjectId.isValid(query) ? { _id: query } : null;

  if (type === 'all' || type === 'users') {
    results.users = await User.find({
      $or: [
        idQuery,
        { bio: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
      ].filter(Boolean)
    })
      .select('-password -refreshToken')
      .skip(skip)
      .limit(limit_int)
      .sort({ createdAt: -1 });
  }

  if (type === 'all' || type === 'shops') {
    results.shops = await Shop.find({
      $or: [
        idQuery,
        { uniqueId: { $regex: query, $options: 'i' } },
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ].filter(Boolean)
    })
      .populate('owner', 'name avatar')
      .skip(skip)
      .limit(limit_int)
      .sort({ rating: -1, createdAt: -1 });
  }

  if (type === 'all' || type === 'products') {
    results.products = await Product.find({
      $or: [
        idQuery,
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ].filter(Boolean)
    })
      .populate('shop', 'title')
      .skip(skip)
      .limit(limit_int)
      .sort({ createdAt: -1 });
  }

  res.json({ 
    success: true, 
    results,
    query,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Shop.distinct('category');
  res.json({ success: true, categories: categories.filter(Boolean) });
});

export const getTrending = asyncHandler(async (req, res) => {
  // Get trending shops by views and likes
  const trendingShops = await Shop.find({ isActive: true })
    .sort({ views: -1, rating: -1, createdAt: -1 })
    .limit(10)
    .populate('owner', 'name avatar');

  // Get trending products by views and likes
  const trendingProducts = await Product.find()
    .sort({ views: -1, createdAt: -1 })
    .limit(10)
    .populate('shop', 'title');

  res.json({ 
    success: true, 
    trending: {
      shops: trendingShops,
      products: trendingProducts
    }
  });
});