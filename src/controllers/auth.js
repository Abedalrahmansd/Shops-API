// src/controllers/auth.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import { config } from '../config/index.js';
import crypto from 'crypto'; // For random code
import passport from '../config/passport.js'; // For social login

// Helper to generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req, res) => {
  const { email, password, name, bio } = req.body;
  let user = await User.findOne({ email });
  if (user) return res.status(400).json({ message: 'User exists' });

  const hashed = await bcrypt.hash(password, 10);
  user = new User({ email, password: hashed, name, bio });
  await user.save();

  const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-char hex
  user.verificationCode = code;
  user.verificationExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  await sendEmail(email, 'Verify Your Email', `Your verification code is: ${code}. Expires in 1 hour.`);

  res.status(201).json({ success: true, message: 'User created, check email for verification code' });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin, isVerified: user.isVerified }, config.JWT_SECRET, { expiresIn: '15m' });
  res.json({ success: true, token });
};

export const verifyEmail = async (req, res) => {
  const { code, email } = req.body; // Add email to body for lookup
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
};

export const resendVerification = async (req, res) => {
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
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const code = generateCode();
  user.verificationCode = code;
  user.verificationExpiry = Date.now() + 60 * 60 * 1000;
  await user.save();
  await sendEmail(email, 'Reset Password', `Your code: ${code}`);
  res.json({ success: true, message: 'Reset code sent' });
};

export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.verificationCode !== code || user.verificationExpiry < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }
  user.password = await bcrypt.hash(newPassword, 10);
  user.verificationCode = undefined;
  user.verificationExpiry = undefined;
  await user.save();
  res.json({ success: true, message: 'Password reset' });
};

// Social login placeholder (implement if needed)
// export const socialLogin = (req, res) => res.json({ message: 'Not implemented' });

export const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) return res.status(401).json({ message: 'Google login failed' });

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin, isVerified: user.isVerified }, config.JWT_SECRET, { expiresIn: '15m' });
    // Redirect or JSON (for API/Flutter)
    res.json({ success: true, token });
  })(req, res, next);
};