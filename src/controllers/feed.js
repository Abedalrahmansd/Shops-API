// In src/controllers/feed.js (for Q5: Home Feed algorithm)
// GET /api/feed
import Product from '../models/Product.js';

export const getFeed = async (req, res) => {
  const { page = 1, limit = 10, all = false } = req.query;
  const user = req.user; // From auth

  const match = {};
  if (user.interests.length > 0) {
    match.tags = { $in: user.interests };
  }

  const products = await Product.aggregate([
    { $match: match },
    {
      $addFields: {
        score: {
          $add: [
            { $multiply: ['$rating', 2] }, // Weight rating higher
            '$views',
            '$likes'
          ]
        }
      }
    },
    { $sort: { score: -1 } },
    all ? {} : { $skip: (page - 1) * limit },
    all ? {} : { $limit: parseInt(limit) }
  ]);

  res.json({ success: true, products });
};