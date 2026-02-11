import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid ID format'
    });
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ 
      success: false, 
      message: `${field} already exists`
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ 
      success: false, 
      message: err.message
    });
  }

  // Default error
  res.status(500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message
  });
};