import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (!decoded.isVerified) return res.status(403).json({ message: 'Email not verified' });
    req.user = decoded; // {id, isAdmin, isVerified}
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};