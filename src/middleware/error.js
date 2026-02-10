import logger from '../utils/logger.js';
export const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ success: false, message: 'Server error' });
};