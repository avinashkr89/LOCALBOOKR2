const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation error handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errorDetails
      }
    });
  }

  next();
};

/**
 * Authentication validators
 */
const sendOTPValidation = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^(\+\d{1,3}[- ]?)?\d{10}$/)
    .withMessage('Invalid phone number format')
];

const verifyOTPValidation = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^(\+\d{1,3}[- ]?)?\d{10}$/)
    .withMessage('Invalid phone number format'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 4, max: 6 })
    .withMessage('OTP must be 4-6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
];

/**
 * Shop validators
 */
const createShopValidation = [
  body('name')
    .notEmpty()
    .withMessage('Shop name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Shop name must be between 2 and 200 characters'),
  body('category_id')
    .notEmpty()
    .withMessage('Category ID is required')
    .isUUID()
    .withMessage('Invalid category ID format'),
  body('city_id')
    .notEmpty()
    .withMessage('City ID is required')
    .isUUID()
    .withMessage('Invalid city ID format'),
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  body('phone')
    .notEmpty()
    .withMessage('Shop phone number is required')
    .matches(/^(\+\d{1,3}[- ]?)?\d{10}$/)
    .withMessage('Invalid phone number format'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('opening_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Opening time must be in HH:MM format'),
  body('closing_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Closing time must be in HH:MM format'),
  body('price_range')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH'])
    .withMessage('Price range must be LOW, MEDIUM, or HIGH')
];

const updateShopValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Shop name must be between 2 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('address')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  body('phone')
    .optional()
    .matches(/^(\+\d{1,3}[- ]?)?\d{10}$/)
    .withMessage('Invalid phone number format'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('opening_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Opening time must be in HH:MM format'),
  body('closing_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Closing time must be in HH:MM format'),
  body('off_days')
    .optional()
    .isArray()
    .withMessage('Off days must be an array'),
  body('off_days.*')
    .optional()
    .isIn(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])
    .withMessage('Invalid day name'),
  body('price_range')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH'])
    .withMessage('Price range must be LOW, MEDIUM, or HIGH')
];

/**
 * Service validators
 */
const createServiceValidation = [
  body('name')
    .notEmpty()
    .withMessage('Service name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Service name must be between 2 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('duration_minutes')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 5, max: 480 })
    .withMessage('Duration must be between 5 and 480 minutes'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0, max: 99999.99 })
    .withMessage('Price must be between 0 and 99999.99')
];

const updateServiceValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Service name must be between 2 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('duration_minutes')
    .optional()
    .isInt({ min: 5, max: 480 })
    .withMessage('Duration must be between 5 and 480 minutes'),
  body('price')
    .optional()
    .isFloat({ min: 0, max: 99999.99 })
    .withMessage('Price must be between 0 and 99999.99'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

/**
 * Booking validators
 */
const createBookingValidation = [
  body('shop_id')
    .notEmpty()
    .withMessage('Shop ID is required')
    .isUUID()
    .withMessage('Invalid shop ID format'),
  body('service_id')
    .notEmpty()
    .withMessage('Service ID is required')
    .isUUID()
    .withMessage('Invalid service ID format'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('Booking date cannot be in the past');
      }
      return true;
    }),
  body('start_time')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('customer_name')
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  body('customer_phone')
    .notEmpty()
    .withMessage('Customer phone number is required')
    .matches(/^(\+\d{1,3}[- ]?)?\d{10}$/)
    .withMessage('Invalid phone number format'),
  body('customer_notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Customer notes must not exceed 500 characters')
];

const updateBookingStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'])
    .withMessage('Invalid status value'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

/**
 * Review validators
 */
const createReviewValidation = [
  body('booking_id')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isUUID()
    .withMessage('Invalid booking ID format'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment must not exceed 1000 characters')
];

/**
 * Common parameter validators
 */
const uuidValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

module.exports = {
  handleValidationErrors,
  // Auth
  sendOTPValidation,
  verifyOTPValidation,
  updateProfileValidation,
  // Shops
  createShopValidation,
  updateShopValidation,
  // Services
  createServiceValidation,
  updateServiceValidation,
  // Bookings
  createBookingValidation,
  updateBookingStatusValidation,
  // Reviews
  createReviewValidation,
  // Common
  uuidValidation,
  paginationValidation
};