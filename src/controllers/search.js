// src/controllers/search.js
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

export const search = async (req, res) => {
  const { q, type = 'all', page = 1, limit = 10, all = false } = req.query;
  let results = {};

  const textQuery = { $text: { $search: q } };
  const idQuery = mongoose.Types.ObjectId.isValid(q) ? { _id: q } : null;
  const query = idQuery ? { $or: [textQuery, idQuery] } : textQuery;

  if (type === 'all' || type === 'users') {
    results.users = await User.find(query).select('-password')
      .skip(all ? 0 : (page - 1) * limit)
      .limit(all ? Infinity : parseInt(limit));
  }
  if (type === 'all' || type === 'shops') {
    results.shops = await Shop.find({ ...query, uniqueId: q }) // Extra for uniqueId
      .skip(all ? 0 : (page - 1) * limit)
      .limit(all ? Infinity : parseInt(limit));
  }
  if (type === 'all' || type === 'products') {
    results.products = await Product.find(query)
      .skip(all ? 0 : (page - 1) * limit)
      .limit(all ? Infinity : parseInt(limit));
  }

  res.json({ success: true, results });
};