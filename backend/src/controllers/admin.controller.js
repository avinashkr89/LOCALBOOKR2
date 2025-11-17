const adminService = require('../services/admin.service');
const { HTTP_STATUS, ERROR_CODES } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Admin Controller - Vendor Management
 */
class AdminController {
  /**
   * Get all vendors/partners
   */
  async getVendors(req, res) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        city: req.query.city,
        category: req.query.category,
        search: req.query.search,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await adminService.getVendors(filters);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });

    } catch (error) {
      logger.error('Get vendors error:', error);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to get vendors'
        }
      });
    }
  }

  /**
   * Get vendor details by ID
   */
  async getVendorById(req, res) {
    try {
      const { id } = req.params;

      const vendor = await adminService.getVendorById(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        vendor
      });

    } catch (error) {
      logger.error('Get vendor details error:', error);

      if (error.message.includes('Vendor not found')) {
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
          message: 'Failed to get vendor details'
        }
      });
    }
  }

  /**
   * Create new vendor
   */
  async createVendor(req, res) {
    try {
      const vendorData = req.body;

      const result = await adminService.createVendor(vendorData);

      res.status(HTTP_STATUS.CREATED).json(result);

    } catch (error) {
      logger.error('Create vendor error:', error);

      if (error.message.includes('Unique constraint')) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: {
            code: ERROR_CODES.CONFLICT,
            message: 'Vendor with this email or phone already exists'
          }
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to create vendor'
        }
      });
    }
  }

  /**
   * Update vendor status
   */
  async updateVendorStatus(req, res) {
    try {
      const { id } = req.params;
      const statusData = req.body;

      const result = await adminService.updateVendorStatus(id, statusData);

      res.status(HTTP_STATUS.OK).json(result);

    } catch (error) {
      logger.error('Update vendor status error:', error);

      if (error.message.includes('Vendor not found')) {
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
          message: 'Failed to update vendor status'
        }
      });
    }
  }

  /**
   * Delete vendor
   */
  async deleteVendor(req, res) {
    try {
      const { id } = req.params;
      const { permanent = false } = req.query;

      const result = await adminService.deleteVendor(id, permanent === 'true');

      res.status(HTTP_STATUS.OK).json(result);

    } catch (error) {
      logger.error('Delete vendor error:', error);

      if (error.message.includes('Vendor not found')) {
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
          message: 'Failed to delete vendor'
        }
      });
    }
  }

  /**
   * Bulk vendor operations
   */
  async bulkVendorOperation(req, res) {
    try {
      const operationData = req.body;

      const result = await adminService.bulkVendorOperation(operationData);

      res.status(HTTP_STATUS.OK).json(result);

    } catch (error) {
      logger.error('Bulk vendor operation error:', error);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to perform bulk operation'
        }
      });
    }
  }

  /**
   * Get vendor analytics
   */
  async getVendorAnalytics(req, res) {
    try {
      const { id } = req.params;

      const analytics = await adminService.getVendorAnalytics(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        analytics
      });

    } catch (error) {
      logger.error('Get vendor analytics error:', error);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to get vendor analytics'
        }
      });
    }
  }

  /**
   * Get vendor statistics (overview for dashboard)
   */
  async getVendorStats(req, res) {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const [
        totalVendors,
        activeVendors,
        pendingVendors,
        inactiveVendors,
        verifiedVendors,
        newVendorsThisMonth,
        topPerformingVendors
      ] = await Promise.all([
        // Total vendors
        prisma.shop.count(),
        // Active vendors
        prisma.shop.count({ where: { is_active: true } }),
        // Pending verification
        prisma.shop.count({ where: { is_verified: false, is_active: true } }),
        // Inactive vendors
        prisma.shop.count({ where: { is_active: false } }),
        // Verified vendors
        prisma.shop.count({ where: { is_verified: true } }),
        // New vendors this month
        prisma.shop.count({
          where: {
            created_at: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        // Top performing vendors (by bookings)
        prisma.shop.findMany({
          take: 5,
          include: {
            _count: {
              select: {
                bookings: true
              }
            },
            owner: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            bookings: {
              _count: 'desc'
            }
          }
        })
      ]);

      const stats = {
        overview: {
          total: totalVendors,
          active: activeVendors,
          pending: pendingVendors,
          inactive: inactiveVendors,
          verified: verifiedVendors,
          new_this_month: newVendorsThisMonth
        },
        percentages: {
          active_rate: totalVendors > 0 ? Math.round((activeVendors / totalVendors) * 100) : 0,
          verification_rate: totalVendors > 0 ? Math.round((verifiedVendors / totalVendors) * 100) : 0,
          pending_rate: totalVendors > 0 ? Math.round((pendingVendors / totalVendors) * 100) : 0
        },
        top_performers: topPerformingVendors.map(vendor => ({
          id: vendor.id,
          name: vendor.name,
          owner_name: vendor.owner.name,
          bookings_count: vendor._count.bookings,
          rating: vendor.rating,
          is_verified: vendor.is_verified,
          is_active: vendor.is_active
        }))
      };

      await prisma.$disconnect();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        stats
      });

    } catch (error) {
      logger.error('Get vendor stats error:', error);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to get vendor statistics'
        }
      });
    }
  }

  /**
   * Export vendors data
   */
  async exportVendors(req, res) {
    try {
      const {
        format = 'json',
        status,
        city,
        category,
        date_from,
        date_to
      } = req.query;

      const filters = {
        status,
        city,
        category,
        date_from,
        date_to,
        limit: 10000 // Large limit for export
      };

      const result = await adminService.getVendors(filters);

      if (format === 'csv') {
        // Convert to CSV format
        const csvHeader = 'ID,Shop Name,Owner Name,Email,Phone,Category,City,Status,Rating,Total Bookings,Registration Date\n';
        const csvData = result.vendors.map(vendor =>
          `${vendor.id},"${vendor.shop_name}","${vendor.owner_name}","${vendor.owner_email}","${vendor.owner_phone}","${vendor.category?.name}","${vendor.city?.name}","${vendor.status}","${vendor.rating}","${vendor.statistics.total_bookings}","${vendor.registration_date}"`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=vendors.csv');
        res.send(csvHeader + csvData);
      } else {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          vendors: result.vendors,
          total: result.pagination.total
        });
      }

    } catch (error) {
      logger.error('Export vendors error:', error);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to export vendors'
        }
      });
    }
  }
}

module.exports = new AdminController();