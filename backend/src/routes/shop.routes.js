const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/v1/shops
 * @desc    Get shops with filters
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Shops endpoint - Coming soon',
    shops: []
  });
});

/**
 * @route   GET /api/v1/shops/:id
 * @desc    Get shop details
 * @access  Public
 */
router.get('/:id', (req, res) => {
  res.status(200).json({
    message: 'Shop details endpoint - Coming soon'
  });
});

/**
 * @route   GET /api/v1/shops/:id/services
 * @desc    Get shop services
 * @access  Public
 */
router.get('/:id/services', (req, res) => {
  res.status(200).json({
    message: 'Shop services endpoint - Coming soon',
    services: []
  });
});

/**
 * @route   GET /api/v1/shops/:id/available-slots
 * @desc    Get available time slots for a date
 * @access  Public
 */
router.get('/:id/available-slots', (req, res) => {
  res.status(200).json({
    message: 'Available slots endpoint - Coming soon',
    available_slots: []
  });
});

module.exports = router;