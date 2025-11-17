const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get admin dashboard stats
 * @access  Admin
 */
router.get('/dashboard', (req, res) => {
  res.status(200).json({
    message: 'Admin dashboard endpoint - Coming soon'
  });
});

/**
 * @route   GET /api/v1/admin/partners
 * @desc    Get all partners/shops
 * @access  Admin
 */
router.get('/partners', (req, res) => {
  res.status(200).json({
    message: 'Admin partners endpoint - Coming soon',
    partners: []
  });
});

/**
 * @route   GET /api/v1/admin/cities
 * @desc    Get all cities
 * @access  Admin
 */
router.get('/cities', (req, res) => {
  res.status(200).json({
    message: 'Admin cities endpoint - Coming soon',
    cities: []
  });
});

/**
 * @route   GET /api/v1/admin/categories
 * @desc    Get all categories
 * @access  Admin
 */
router.get('/categories', (req, res) => {
  res.status(200).json({
    message: 'Admin categories endpoint - Coming soon',
    categories: []
  });
});

module.exports = router;