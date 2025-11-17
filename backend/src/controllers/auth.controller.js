const authService = require('../services/auth.service');
const { HTTP_STATUS, ERROR_CODES } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Authentication Controller
 */
class AuthController {
  /**
   * Send OTP to phone number
   */
  async sendOTP(req, res) {
    try {
      const { phone } = req.body;

      const result = await authService.sendOTP(phone);

      res.status(HTTP_STATUS.OK).json(result);

    } catch (error) {
      logger.error('Send OTP error:', error);

      if (error.message.includes('Too many OTP requests')) {
        return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
          error: {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: error.message
          }
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to send OTP'
        }
      });
    }
  }

  /**
   * Verify OTP and authenticate user
   */
  async verifyOTP(req, res) {
    try {
      const { phone, otp } = req.body;

      const result = await authService.verifyOTP(phone, otp);

      res.status(HTTP_STATUS.OK).json(result);

    } catch (error) {
      logger.error('Verify OTP error:', error);

      if (error.message.includes('Invalid or expired OTP')) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: error.message
          }
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to verify OTP'
        }
      });
    }
  }

  /**
   * Create user with email and password (for admins/partners)
   */
  async createUser(req, res) {
    try {
      const userData = req.body;

      const result = await authService.createUser(userData);

      res.status(HTTP_STATUS.CREATED).json(result);

    } catch (error) {
      logger.error('Create user error:', error);

      if (error.message.includes('already registered')) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: {
            code: ERROR_CODES.CONFLICT,
            message: error.message
          }
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to create user'
        }
      });
    }
  }

  /**
   * Login with email and password
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      res.status(HTTP_STATUS.OK).json(result);

    } catch (error) {
      logger.error('Login error:', error);

      if (error.message.includes('Invalid email or password') ||
          error.message.includes('deactivated') ||
          error.message.includes('phone number')) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: error.message
          }
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Login failed'
        }
      });
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await authService.getProfile(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        user
      });

    } catch (error) {
      logger.error('Get profile error:', error);

      if (error.message.includes('User not found')) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: error.message
          }
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to get profile'
        }
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      const user = await authService.updateProfile(userId, updateData);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        user
      });

    } catch (error) {
      logger.error('Update profile error:', error);

      if (error.message.includes('User not found')) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: error.message
          }
        });
      }

      if (error.message.includes('Email already taken')) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: {
            code: ERROR_CODES.CONFLICT,
            message: error.message
          }
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to update profile'
        }
      });
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      res.status(HTTP_STATUS.OK).json(result);

    } catch (error) {
      logger.error('Change password error:', error);

      if (error.message.includes('Current password is incorrect') ||
          error.message.includes('Password change not allowed')) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: error.message
          }
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to change password'
        }
      });
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Token required'
          }
        });
      }

      // Validate token (even if expired)
      const decoded = authService.validateToken(token);

      // Get fresh user data
      const user = await authService.getProfile(decoded.userId);

      // Generate new token
      const jwt = require('jsonwebtoken');
      const newToken = jwt.sign(
        {
          userId: user.id,
          phone: user.phone,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        token: newToken,
        user
      });

    } catch (error) {
      logger.error('Refresh token error:', error);

      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid token'
        }
      });
    }
  }

  /**
   * Logout user (client-side token removal)
   */
  async logout(req, res) {
    try {
      // In a stateless JWT system, logout is typically handled client-side
      // by removing the token. Here we just acknowledge the request.

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout error:', error);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Logout failed'
        }
      });
    }
  }
}

module.exports = new AuthController();