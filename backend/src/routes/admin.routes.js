const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');
const {
  handleValidationErrors,
  uuidValidation,
  paginationValidation
} = require('../middleware/validation.middleware');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get admin dashboard stats
 * @access  Admin
 */
router.get('/dashboard', adminController.getVendorStats);

// =================== VENDOR MANAGEMENT ROUTES ===================

/**
 * @route   GET /api/v1/admin/vendors
 * @desc    Get all vendors/partners with filters and pagination
 * @access  Admin
 */
router.get('/vendors',
  paginationValidation,
  handleValidationErrors,
  adminController.getVendors
);

/**
 * @route   GET /api/v1/admin/vendors/export
 * @desc    Export vendors data (JSON/CSV)
 * @access  Admin
 */
router.get('/vendors/export',
  adminController.exportVendors
);

/**
 * @route   GET /api/v1/admin/vendors/stats
 * @desc    Get vendor statistics for dashboard
 * @access  Admin
 */
router.get('/vendors/stats',
  adminController.getVendorStats
);

/**
 * @route   POST /api/v1/admin/vendors
 * @desc    Create new vendor
 * @access  Admin
 */
router.post('/vendors',
  // TODO: Add vendor creation validation
  adminController.createVendor
);

/**
 * @route   GET /api/v1/admin/vendors/:id
 * @desc    Get vendor details by ID
 * @access  Admin
 */
router.get('/vendors/:id',
  uuidValidation,
  handleValidationErrors,
  adminController.getVendorById
);

/**
 * @route   PUT /api/v1/admin/vendors/:id/status
 * @desc    Update vendor status (active/inactive/verified)
 * @access  Admin
 */
router.put('/vendors/:id/status',
  uuidValidation,
  handleValidationErrors,
  adminController.updateVendorStatus
);

/**
 * @route   DELETE /api/v1/admin/vendors/:id
 * @desc    Delete vendor (soft delete by default)
 * @access  Admin
 */
router.delete('/vendors/:id',
  uuidValidation,
  handleValidationErrors,
  adminController.deleteVendor
);

/**
 * @route   GET /api/v1/admin/vendors/:id/analytics
 * @desc    Get vendor analytics
 * @access  Admin
 */
router.get('/vendors/:id/analytics',
  uuidValidation,
  handleValidationErrors,
  adminController.getVendorAnalytics
);

/**
 * @route   POST /api/v1/admin/vendors/bulk-operation
 * @desc    Perform bulk operations on vendors
 * @access  Admin
 */
router.post('/vendors/bulk-operation',
  adminController.bulkVendorOperation
);

// =================== LEGACY ROUTES (for backward compatibility) ===================

/**
 * @route   GET /api/v1/admin/partners
 * @desc    Get all partners/shops (alias for /vendors)
 * @access  Admin
 */
router.get('/partners',
  paginationValidation,
  handleValidationErrors,
  adminController.getVendors
);

/**
 * @route   POST /api/v1/admin/partners
 * @desc    Create new partner (alias for /vendors)
 * @access  Admin
 */
router.post('/partners',
  adminController.createVendor
);

/**
 * @route   GET /api/v1/admin/partners/:id
 * @desc    Get partner details by ID (alias for /vendors)
 * @access  Admin
 */
router.get('/partners/:id',
  uuidValidation,
  handleValidationErrors,
  adminController.getVendorById
);

/**
 * @route   PUT /api/v1/admin/partners/:id/status
 * @desc    Update partner status (alias for /vendors)
 * @access  Admin
 */
router.put('/partners/:id/status',
  uuidValidation,
  handleValidationErrors,
  adminController.updateVendorStatus
);

// =================== CITIES & CATEGORIES MANAGEMENT ===================

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
 * @route   POST /api/v1/admin/cities
 * @desc    Create new city
 * @access  Admin
 */
router.post('/cities', (req, res) => {
  res.status(201).json({
    message: 'Create city endpoint - Coming soon'
  });
});

/**
 * @route   PUT /api/v1/admin/cities/:id
 * @desc    Update city
 * @access  Admin
 */
router.put('/cities/:id', (req, res) => {
  res.status(200).json({
    message: 'Update city endpoint - Coming soon'
  });
});

/**
 * @route   DELETE /api/v1/admin/cities/:id
 * @desc    Delete city
 * @access  Admin
 */
router.delete('/cities/:id', (req, res) => {
  res.status(200).json({
    message: 'Delete city endpoint - Coming soon'
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

/**
 * @route   POST /api/v1/admin/categories
 * @desc    Create new category
 * @access  Admin
 */
router.post('/categories', (req, res) => {
  res.status(201).json({
    message: 'Create category endpoint - Coming soon'
  });
});

/**
 * @route   PUT /api/v1/admin/categories/:id
 * @desc    Update category
 * @access  Admin
 */
router.put('/categories/:id', (req, res) => {
  res.status(200).json({
    message: 'Update category endpoint - Coming soon'
  });
});

/**
 * @route   DELETE /api/v1/admin/categories/:id
 * @desc    Delete category
 * @access  Admin
 */
router.delete('/categories/:id', (req, res) => {
  res.status(200).json({
    message: 'Delete category endpoint - Coming soon'
  });
});

module.exports = router;