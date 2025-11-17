const express = require('express');
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  handleValidationErrors,
  sendOTPValidation,
  verifyOTPValidation,
  updateProfileValidation
} = require('../middleware/validation.middleware');

const router = express.Router();

// Strict rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 OTP requests per window per IP
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many OTP requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/v1/auth/send-otp
 * @desc    Send OTP to phone number
 * @access  Public
 */
router.post('/send-otp',
  otpRateLimit,
  sendOTPValidation,
  handleValidationErrors,
  authController.sendOTP
);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP and authenticate user
 * @access  Public
 */
router.post('/verify-otp',
  authRateLimit,
  verifyOTPValidation,
  handleValidationErrors,
  authController.verifyOTP
);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Create user with email and password (for admins/partners)
 * @access  Public
 */
router.post('/register',
  authRateLimit,
  // TODO: Add registration validation middleware
  authController.createUser
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post('/login',
  authRateLimit,
  // TODO: Add login validation middleware
  authController.login
);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile',
  authenticateToken,
  authController.getProfile
);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  authenticateToken,
  updateProfileValidation,
  handleValidationErrors,
  authController.updateProfile
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password',
  authenticateToken,
  // TODO: Add change password validation middleware
  authController.changePassword
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh-token',
  // Don't require authentication for token refresh
  authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
  authenticateToken,
  authController.logout
);

module.exports = router;