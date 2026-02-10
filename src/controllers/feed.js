// src/controllers/feed.js
import Product from '../models/Product.js';

export const getFeed = async (req, res) => {
  const { page = 1, limit = 10, all = false } = req.query;
  const user = await User.findById(req.user.id);

  const match = user.interests.length ? { tags: { $in: user.interests } } : {};

  const products = await Product.aggregate([
    { $match: match },
    { $addFields: { score: { $add: [{ $multiply: ['$views.length', 1] }, { $multiply: ['$likes.length', 2] }] } } }, // Adjusted for arrays
    { $sort: { score: -1 } },
    { $skip: all ? 0 : (page - 1) * limit },
    { $limit: all ? Infinity : parseInt(limit) },
  ]);

  res.json({ success: true, products });
};