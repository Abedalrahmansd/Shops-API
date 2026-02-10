// src/controllers/user.js
import User from '../models/User.js';
import multer from 'multer'; // For avatar upload (setup in routes)

export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json({ success: true, user });
};

export const updateMe = async (req, res) => {
  const updates = { name: req.body.name, bio: req.body.bio, interests: req.body.interests };
  if (req.file) updates.avatar = `/uploads/avatars/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
  res.json({ success: true, user });
};

export const addPhone = async (req, res) => {
  const { phone } = req.body;
  await User.findByIdAndUpdate(req.user.id, { phone });
  res.json({ success: true });
};

export const deactivate = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { isActive: false, deactivationDate: new Date() });
  res.json({ success: true, message: 'Account deactivated' });
};

export const reactivate = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user.deactivationDate && (Date.now() - user.deactivationDate) < 30 * 24 * 60 * 60 * 1000) {
    user.isActive = true;
    user.deactivationDate = null;
    await user.save();
    res.json({ success: true });
  } else {
    res.status(400).json({ message: 'Cannot reactivate' });
  }
};

export const getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('name bio avatar');
  res.json({ success: true, user });
};