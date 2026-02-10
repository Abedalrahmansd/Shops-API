// src/controllers/admin.js
import Report from '../models/Report.js';
import User from '../models/User.js';
import Shop from '../models/Shop.js';

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

// Seed admin (run as script)
export const seedAdmin = async (req, res) => {
  // Example: Create admin user if none
  res.json({ message: 'Admin seeded' });
};