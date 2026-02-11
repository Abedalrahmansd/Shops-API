// src/controllers/admin.js
import Report from '../models/Report.js';
import User from '../models/User.js';

export const getReports = async (req, res) => {
  const reports = await Report.find({ status: 'pending' }).populate('reporter targetId');
  res.json({ success: true, reports });
};

export const resolveReport = async (req, res) => {
  await Report.findByIdAndUpdate(req.params.reportId, { status: 'resolved' });
  res.json({ success: true });
};

export const getUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json({ success: true, users });
};

// Update seedAdmin
export const seedAdmin = async (req, res) => {
  const existing = await User.findOne({ isAdmin: true });
  if (existing) return res.json({ message: 'Admin already exists' });

  const admin = new User({
    email: 'admin@example.com',
    password: await bcrypt.hash('adminpass', 10), // Change in prod
    name: 'Admin',
    isAdmin: true,
  });
  await admin.save();
  res.json({ success: true, message: 'Admin seeded' });
};

export const banUser = async (req, res) => {
  await User.findByIdAndUpdate(req.params.userId, { isActive: false });
  res.json({ success: true });
};

export const suspendShop = async (req, res) => {
  await Shop.findByIdAndUpdate(req.params.shopId, { isActive: false });
  res.json({ success: true });
};