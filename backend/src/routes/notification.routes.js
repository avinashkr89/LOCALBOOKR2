const express = require('express');
const router = express.Router();

/**
 * @route   POST /api/v1/notifications/send
 * @desc    Send notification
 * @access  Private
 */
router.post('/send', (req, res) => {
  res.status(200).json({
    message: 'Send notification endpoint - Coming soon'
  });
});

/**
 * @route   GET /api/v1/notifications
 * @desc    Get notifications
 * @access  Private
 */
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Get notifications endpoint - Coming soon',
    notifications: []
  });
});

module.exports = router;