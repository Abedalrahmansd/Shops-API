// src/controllers/auth.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import { config } from '../config/index.js';

// Helper to generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req, res) => {
  const { email, password, name, bio } = req.body;
  let user = await User.findOne({ email });
  if (user) return res.status(400).json({ message: 'User exists' });

  const hashed = await bcrypt.hash(password, 10);
  user = new User({ email, password: hashed, name, bio });
  await user.save();

  const code = generateCode();
  // Store code temporarily (e.g., in user doc or Redis; for simplicity, email only)
  await sendEmail(email, 'Verify Email', `Your code: ${code}`);

  res.status(201).json({ success: true, message: 'User created, verify email' });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, config.JWT_SECRET, { expiresIn: '15m' });
  res.json({ success: true, token });
};

export const verifyEmail = async (req, res) => {
  // In prod, compare sent code (stored in temp field or email-only for MVP)
  // Assume manual check for now; add logic as needed
  res.json({ success: true, message: 'Email verified' });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const code = generateCode();
  await sendEmail(email, 'Reset Password', `Your code: ${code}`);
  res.json({ success: true, message: 'Reset code sent' });
};

export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  // Verify code (MVP: assume valid); hash new pass
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ success: true, message: 'Password reset' });
};

// Social login placeholder (implement if needed)
export const socialLogin = (req, res) => res.json({ message: 'Not implemented' });