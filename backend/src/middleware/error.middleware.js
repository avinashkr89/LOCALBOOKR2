const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Prisma validation error
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    const message = `${field} already exists`;
    error = { code: 'VALIDATION_ERROR', message, statusCode: 400 };
  }

  // Prisma foreign key constraint error
  if (err.code === 'P2003') {
    error = {
      code: 'FOREIGN_KEY_CONSTRAINT',
      message: 'Invalid reference to related record',
      statusCode: 400
    };
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    error = {
      code: 'NOT_FOUND',
      message: 'Record not found',
      statusCode: 404
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      code: 'UNAUTHORIZED',
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      code: 'UNAUTHORIZED',
      message: 'Token expired',
      statusCode: 401
    };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error = {
      code: 'VALIDATION_ERROR',
      message: err.message,
      details: err.details,
      statusCode: 400
    };
  }

  // Default error response
  const statusCode = error.statusCode || err.statusCode || 500;
  const response = {
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error'
    }
  };

  // Add details in development
  if (process.env.NODE_ENV === 'development' && error.details) {
    response.error.details = error.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;