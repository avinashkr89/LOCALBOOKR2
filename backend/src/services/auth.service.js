const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const { generateOTP, formatPhoneNumber } = require('../utils/helpers');
const { OTP_CONFIG, ERROR_CODES, USER_ROLES } = require('../utils/constants');

const prisma = new PrismaClient();

/**
 * Authentication Service
 */
class AuthService {
  /**
   * Send OTP to phone number
   */
  async sendOTP(phone) {
    try {
      // Format phone number
      const formattedPhone = formatPhoneNumber(phone);

      // Check rate limiting (max 3 OTPs in 15 minutes)
      const recentOTPs = await prisma.oTPCode.findMany({
        where: {
          phone: formattedPhone,
          created_at: {
            gte: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
          }
        }
      });

      if (recentOTPs.length >= 3) {
        throw new Error('Too many OTP requests. Please try again later.');
      }

      // Mark previous OTPs as used
      await prisma.oTPCode.updateMany({
        where: { phone: formattedPhone, is_used: false },
        data: { is_used: true }
      });

      // Generate new OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

      // Save OTP to database
      await prisma.oTPCode.create({
        data: {
          phone: formattedPhone,
          code: otp,
          expires_at: expiresAt
        }
      });

      // TODO: Send OTP via SMS/WhatsApp
      logger.info(`OTP sent to ${formattedPhone}: ${otp}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        otp_sent: true
      };

    } catch (error) {
      logger.error('Error sending OTP:', error);
      throw error;
    }
  }

  /**
   * Verify OTP and create/authenticate user
   */
  async verifyOTP(phone, otp) {
    try {
      const formattedPhone = formatPhoneNumber(phone);

      // Find valid OTP
      const otpRecord = await prisma.oTPCode.findFirst({
        where: {
          phone: formattedPhone,
          code: otp,
          is_used: false,
          expires_at: {
            gt: new Date()
          }
        }
      });

      if (!otpRecord) {
        throw new Error('Invalid or expired OTP');
      }

      // Mark OTP as used
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { is_used: true }
      });

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { phone: formattedPhone }
      });

      const isNewUser = !user;

      if (isNewUser) {
        // Create new user
        user = await prisma.user.create({
          data: {
            phone: formattedPhone,
            name: 'User', // Default name, should be updated later
            role: USER_ROLES.CUSTOMER,
            is_verified: true
          }
        });

        logger.info(`New user created: ${user.id}`);
      } else {
        // Update existing user as verified
        user = await prisma.user.update({
          where: { id: user.id },
          data: { is_verified: true }
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          phone: user.phone,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      logger.info(`User authenticated: ${user.id}`);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          is_verified: user.is_verified
        },
        is_new_user: isNewUser
      };

    } catch (error) {
      logger.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Create user with email and password (for admins/partners)
   */
  async createUser(userData) {
    try {
      const { name, email, password, role = USER_ROLES.CUSTOMER, phone } = userData;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email || undefined },
            { phone: phone || undefined }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new Error('Email already registered');
        }
        if (existingUser.phone === phone) {
          throw new Error('Phone number already registered');
        }
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone: phone ? formatPhoneNumber(phone) : null,
          password: hashedPassword,
          role,
          is_verified: true
        }
      });

      logger.info(`User created with email/password: ${user.id}`);

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_verified: user.is_verified
        }
      };

    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.password) {
        throw new Error('Account created with phone number. Please use OTP login.');
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      logger.info(`User logged in: ${user.id}`);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_verified: user.is_verified
        }
      };

    } catch (error) {
      logger.error('Error in login:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          is_verified: true,
          is_active: true,
          created_at: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;

    } catch (error) {
      logger.error('Error getting profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    try {
      const { name, email } = updateData;

      // Check if email is being updated and if it's already taken
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            id: { not: userId }
          }
        });

        if (existingUser) {
          throw new Error('Email already taken');
        }
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(email && { email })
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          is_verified: true,
          is_active: true,
          updated_at: true
        }
      });

      logger.info(`Profile updated: ${userId}`);

      return user;

    } catch (error) {
      logger.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Validate JWT token
   */
  validateToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      });

      if (!user || !user.password) {
        throw new Error('Password change not allowed for this account type');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);

      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      logger.info(`Password changed: ${userId}`);

      return {
        success: true,
        message: 'Password changed successfully'
      };

    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();