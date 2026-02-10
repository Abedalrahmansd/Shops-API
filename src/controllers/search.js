// In src/controllers/search.js (for Q6: Search engine)
// GET /api/search?q=query&type=all|shops|products|users
export const search = async (req, res) => {
  const { q, type = 'all', page = 1, limit = 10, all = false } = req.query;

  let results = {};
  if (type === 'all' || type === 'shops') {
    results.shops = await Shop.find({ $text: { $search: q } })
      .skip(all ? 0 : (page - 1) * limit)
      .limit(all ? 0 : limit);
  }
  if (type === 'all' || type === 'products') {
    results.products = await Product.find({ $text: { $search: q } })
      .skip(all ? 0 : (page - 1) * limit)
      .limit(all ? 0 : limit);
  }
  if (type === 'all' || type === 'users') {
    results.users = await User.find({ $text: { $search: q } })
      .select('-password') // Hide sensitive
      .skip(all ? 0 : (page - 1) * limit)
      .limit(all ? 0 : limit);
  }

  // Add more fields: e.g., by ID, desc, tags
  // For ID search: if q is ObjectId-like, use _id: q

  res.json({ success: true, results });
};