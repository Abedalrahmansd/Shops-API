// src/controllers/feed.js
import Product from '../models/Product.js';
import User from '../models/User.js';

export const getFeed = async (req, res) => {
  const { page = 1, limit = 10, all = false } = req.query;
  const user = await User.findById(req.user.id);

  const match = user.interests.length ? { tags: { $in: user.interests } } : {};

  const products = await Product.aggregate([
    { $match: match },
    { $addFields: { score: { $add: [{ $multiply: [{ $size: '$views' }, 1] }, { $multiply: [{ $size: '$likes' }, 2] }] } } },
    { $sort: { score: -1 } },
    { $skip: all ? 0 : (page - 1) * limit },
    { $limit: all ? Infinity : parseInt(limit) },
  ]);

  res.json({ success: true, products });
};