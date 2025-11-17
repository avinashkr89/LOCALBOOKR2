const crypto = require('crypto');
const moment = require('moment');

/**
 * Generate a random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

/**
 * Generate booking number
 */
const generateBookingNumber = () => {
  const date = moment().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `LBK${date}${random}`;
};

/**
 * Generate OTP code
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Format phone number to international format
 */
const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // If already has country code, return as is
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  // If 10 digits (Indian number), add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  // If starts with 0, remove it and add +91
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+91${cleaned.slice(1)}`;
  }

  return phone;
};

/**
 * Validate time slot format
 */
const isValidTimeSlot = (timeSlot) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeSlot);
};

/**
 * Calculate end time based on start time and duration
 */
const calculateEndTime = (startTime, durationMinutes) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
};

/**
 * Check if time slot is within business hours
 */
const isWithinBusinessHours = (timeSlot, openingTime, closingTime) => {
  const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
  const [openHours, openMinutes] = openingTime.split(':').map(Number);
  const [closeHours, closeMinutes] = closingTime.split(':').map(Number);

  const slotMinutesTotal = slotHours * 60 + slotMinutes;
  const openMinutesTotal = openHours * 60 + openMinutes;
  const closeMinutesTotal = closeHours * 60 + closeMinutes;

  return slotMinutesTotal >= openMinutesTotal && slotMinutesTotal <= closeMinutesTotal;
};

/**
 * Generate available time slots for a given date
 */
const generateAvailableTimeSlots = (openingTime, closingTime, durationMinutes, bookedSlots = []) => {
  const slots = [];
  const [openHours, openMinutes] = openingTime.split(':').map(Number);
  const [closeHours, closeMinutes] = closingTime.split(':').map(Number);

  const openMinutesTotal = openHours * 60 + openMinutes;
  const closeMinutesTotal = closeHours * 60 + closeMinutes;

  let currentTime = openMinutesTotal;

  while (currentTime + durationMinutes <= closeMinutesTotal) {
    const timeSlot = `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(currentTime % 60).padStart(2, '0')}`;

    if (!bookedSlots.includes(timeSlot)) {
      slots.push(timeSlot);
    }

    currentTime += 30; // 30-minute intervals
  }

  return slots;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance;
};

/**
 * Format currency
 */
const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date for display
 */
const formatDate = (date, format = 'DD MMM YYYY') => {
  return moment(date).format(format);
};

/**
 * Format time for display
 */
const formatTime = (time, format = 'hh:mm A') => {
  return moment(time, 'HH:mm').format(format);
};

/**
 * Check if a date is a weekend
 */
const isWeekend = (date) => {
  const day = moment(date).day();
  return day === 0 || day === 6; // Sunday or Saturday
};

/**
 * Get price range symbol
 */
const getPriceRangeSymbol = (priceRange) => {
  switch (priceRange) {
    case 'LOW': return '₹';
    case 'MEDIUM': return '₹₹';
    case 'HIGH': return '₹₹₹';
    default: return '₹';
  }
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Paginate results
 */
const paginateResults = (data, page = 1, limit = 20) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const results = data.slice(startIndex, endIndex);

  return {
    data: results,
    pagination: {
      page,
      limit,
      total: data.length,
      pages: Math.ceil(data.length / limit),
      hasNext: endIndex < data.length,
      hasPrev: page > 1
    }
  };
};

/**
 * Generate file name for upload
 */
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${randomString}.${extension}`;
};

/**
 * Mask phone number for privacy
 */
const maskPhoneNumber = (phone) => {
  if (phone.length <= 4) return phone;
  const visible = phone.slice(-4);
  const masked = '*'.repeat(phone.length - 4);
  return masked + visible;
};

/**
 * Calculate commission amount
 */
const calculateCommission = (amount, commissionRate = 10) => {
  return (amount * commissionRate) / 100;
};

/**
 * Generate random color
 */
const generateRandomColor = () => {
  return `#${Math.floor(Math.random()*16777215).toString(16)}`;
};

module.exports = {
  generateRandomString,
  generateBookingNumber,
  generateOTP,
  formatPhoneNumber,
  isValidTimeSlot,
  calculateEndTime,
  isWithinBusinessHours,
  generateAvailableTimeSlots,
  calculateDistance,
  formatCurrency,
  formatDate,
  formatTime,
  isWeekend,
  getPriceRangeSymbol,
  isValidEmail,
  sanitizeString,
  paginateResults,
  generateFileName,
  maskPhoneNumber,
  calculateCommission,
  generateRandomColor
};