import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded; // {id, isAdmin}
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};