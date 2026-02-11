// src/controllers/user.js
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import bcrypt from 'bcryptjs';

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -refreshToken');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ success: true, user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.name) updates.name = req.body.name;
  if (req.body.bio) updates.bio = req.body.bio;
  if (req.body.interests) updates.interests = req.body.interests;
  if (req.file) updates.avatar = `/uploads/avatars/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true })
    .select('-password -refreshToken');
  res.json({ success: true, user });
});

export const addPhone = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone is required' });

  const existingPhone = await User.findOne({ phone, _id: { $ne: req.user.id } });
  if (existingPhone) return res.status(409).json({ message: 'Phone already in use' });

  await User.findByIdAndUpdate(req.user.id, { phone });
  res.json({ success: true, message: 'Phone added' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Both passwords are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  const user = await User.findById(req.user.id);
  if (!await bcrypt.compare(oldPassword, user.password)) {
    return res.status(401).json({ message: 'Old password is incorrect' });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ success: true, message: 'Password changed' });
});

export const deactivate = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { isActive: false, deactivationDate: new Date() });
  res.json({ success: true, message: 'Account deactivated' });
});

export const reactivate = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user.deactivationDate && (Date.now() - user.deactivationDate) < 30 * 24 * 60 * 60 * 1000) {
    user.isActive = true;
    user.deactivationDate = null;
    await user.save();
    res.json({ success: true, message: 'Account reactivated' });
  } else {
    res.status(400).json({ message: 'Cannot reactivate - 30 days have passed' });
  }
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('name bio avatar -_id');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ success: true, user });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Password is required' });

  const user = await User.findById(req.user.id);
  if (!await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ message: 'Password is incorrect' });
  }

  // Soft delete or hard delete based on requirements
  await User.findByIdAndDelete(req.user.id);
  res.json({ success: true, message: 'Account deleted' });
});