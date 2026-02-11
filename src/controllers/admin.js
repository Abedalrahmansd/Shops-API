// src/controllers/admin.js
import Report from '../models/Report.js';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getReports = asyncHandler(async (req, res) => {
  const { status = 'pending', page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const reports = await Report.find({ status })
    .populate('reporter', 'name email')
    .populate('targetId')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Report.countDocuments({ status });

  res.json({ success: true, reports, total, page: parseInt(page), limit: parseInt(limit) });
});

export const resolveReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { action = 'ignore', note = '' } = req.body;

  if (!['delete', 'warn', 'ignore'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  const report = await Report.findById(reportId);
  if (!report) return res.status(404).json({ message: 'Report not found' });

  report.status = 'resolved';
  report.resolvedAt = new Date();
  report.resolvedBy = req.user.id;
  report.note = note;
  await report.save();

  res.json({ success: true, message: 'Report resolved', report });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  let query = {};
  if (search) {
    query = { $or: [{ email: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } }] };
  }

  const users = await User.find(query)
    .select('-password -refreshToken')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.json({ success: true, users, total, page: parseInt(page), limit: parseInt(limit) });
});

export const getShops = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  let query = {};
  if (search) {
    query = { $or: [{ title: { $regex: search, $options: 'i' } }, { uniqueId: { $regex: search, $options: 'i' } }] };
  }

  const shops = await Shop.find(query)
    .populate('owner', 'name email')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Shop.countDocuments(query);

  res.json({ success: true, shops, total, page: parseInt(page), limit: parseInt(limit) });
});

export const seedAdmin = asyncHandler(async (req, res) => {
  const existing = await User.findOne({ isAdmin: true });
  if (existing) return res.status(400).json({ message: 'Admin already exists' });

  const admin = new User({
    email: 'admin@example.com',
    password: await bcrypt.hash('adminpass', 10),
    name: 'Admin',
    isAdmin: true,
    isVerified: true,
  });
  await admin.save();
  res.json({ success: true, message: 'Admin seeded', email: 'admin@example.com' });
});

export const banUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.isActive = false;
  await user.save();

  res.json({ success: true, message: 'User banned', user });
});

export const unbanUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.isActive = true;
  await user.save();

  res.json({ success: true, message: 'User unbanned', user });
});

export const suspendShop = asyncHandler(async (req, res) => {
  const { shopId } = req.params;

  const shop = await Shop.findById(shopId);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  shop.isActive = false;
  await shop.save();

  res.json({ success: true, message: 'Shop suspended', shop });
});

export const unsuspendShop = asyncHandler(async (req, res) => {
  const { shopId } = req.params;

  const shop = await Shop.findById(shopId);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  shop.isActive = true;
  await shop.save();

  res.json({ success: true, message: 'Shop unsuspended', shop });
});

export const getStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const totalShops = await Shop.countDocuments();
  const activeShops = await Shop.countDocuments({ isActive: true });
  const pendingReports = await Report.countDocuments({ status: 'pending' });

  res.json({ 
    success: true, 
    stats: {
      totalUsers,
      activeUsers,
      totalShops,
      activeShops,
      pendingReports
    }
  });
});