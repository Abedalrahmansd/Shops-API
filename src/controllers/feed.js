// src/controllers/feed.js
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, all = false, type = 'all' } = req.query;
  const user = await User.findById(req.user.id);

  const skip = all ? 0 : (parseInt(page) - 1) * parseInt(limit);
  const limit_int = all ? undefined : parseInt(limit);

  let results = {};

  // Recommended products based on interests
  if (type === 'all' || type === 'products') {
    const matchStage = user.interests && user.interests.length > 0 
      ? { $or: [
          { tags: { $in: user.interests } },
          { category: { $in: user.interests } }
        ]}
      : {};

    results.products = await Product.find(matchStage)
      .populate('shop', 'title rating')
      .skip(skip)
      .limit(limit_int)
      .sort({ likes: -1, views: -1, createdAt: -1 });
  }

  // Recommended shops based on interests and followed shops
  if (type === 'all' || type === 'shops') {
    results.shops = await Shop.find({ isActive: true })
      .populate('owner', 'name avatar')
      .skip(skip)
      .limit(limit_int)
      .sort({ followers: -1, rating: -1, createdAt: -1 });
  }

  res.json({ success: true, feed: results, page: parseInt(page), limit: parseInt(limit) });
});

export const getTrendingFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const trendingProducts = await Product.find()
    .populate('shop', 'title rating')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ likes: -1, views: -1 });

  const trendingShops = await Shop.find({ isActive: true })
    .populate('owner', 'name avatar')
    .sort({ followers: -1, likes: -1, rating: -1 })
    .limit(5);

  res.json({ 
    success: true, 
    feed: {
      products: trendingProducts,
      shops: trendingShops
    },
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

export const updateInterests = asyncHandler(async (req, res) => {
  const { interests } = req.body;

  if (!Array.isArray(interests)) {
    return res.status(400).json({ message: 'Interests must be an array' });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { interests },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  res.json({ success: true, user });
});