// src/controllers/auth.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import { config } from '../config/index.js';
import crypto from 'crypto'; // For random code
import passport from '../config/passport.js'; // For social login
import { asyncHandler } from '../utils/asyncHandler.js';

// Helper to generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export const register = asyncHandler(async (req, res) => {
  const { email, password, name, bio } = req.body;
  let user = await User.findOne({ email });
  if (user) return res.status(400).json({ message: 'User already exists' });

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const hashed = await bcrypt.hash(password, 10);
  user = new User({ email, password: hashed, name, bio });
  await user.save();

  const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-char hex
  user.verificationCode = code;
  user.verificationExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  await sendEmail(email, 'Verify Your Email', `Your verification code is: ${code}. Expires in 1 hour.`);

  res.status(201).json({ success: true, message: 'User created, check email for verification code' });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Generate access and refresh tokens
  const accessToken = jwt.sign(
    { id: user._id, isAdmin: user.isAdmin, isVerified: user.isVerified }, 
    config.JWT_SECRET, 
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id }, 
    config.JWT_SECRET, 
    { expiresIn: '7d' }
  );

  // Store refresh token (for token revocation if needed)
  user.refreshToken = refreshToken;
  await user.save();

  res.json({ success: true, accessToken, refreshToken });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin, isVerified: user.isVerified }, 
      config.JWT_SECRET, 
      { expiresIn: '15m' }
    );

    res.json({ success: true, accessToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { code, email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.isVerified) return res.status(400).json({ message: 'Already verified' });
  if (user.verificationCode !== code || user.verificationExpiry < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationExpiry = undefined;
  await user.save();

  res.json({ success: true, message: 'Email verified' });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.isVerified) return res.status(400).json({ message: 'Already verified' });

  const code = crypto.randomBytes(3).toString('hex').toUpperCase();
  user.verificationCode = code;
  user.verificationExpiry = Date.now() + 60 * 60 * 1000;
  await user.save();

  await sendEmail(email, 'Resend Verification', `Your new code: ${code}. Expires in 1 hour.`);

  res.json({ success: true, message: 'Code resent' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const code = generateCode();
  user.verificationCode = code;
  user.verificationExpiry = Date.now() + 60 * 60 * 1000;
  await user.save();
  await sendEmail(email, 'Reset Password', `Your code: ${code}`);
  res.json({ success: true, message: 'Reset code sent' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.verificationCode !== code || user.verificationExpiry < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.verificationCode = undefined;
  user.verificationExpiry = undefined;
  await user.save();
  res.json({ success: true, message: 'Password reset' });
});

export const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) return res.status(401).json({ message: 'Google login failed' });

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin, isVerified: user.isVerified }, config.JWT_SECRET, { expiresIn: '15m' });
    res.json({ success: true, token });
  })(req, res, next);
};

export const logout = asyncHandler(async (req, res) => {
  // Invalidate refresh token
  await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
  res.json({ success: true, message: 'Logged out' });
});