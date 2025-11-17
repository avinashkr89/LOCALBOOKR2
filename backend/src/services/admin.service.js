const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const { paginateResults, formatCurrency, formatDate } = require('../utils/helpers');

const prisma = new PrismaClient();

/**
 * Admin Service - Vendor Management
 */
class AdminService {
  /**
   * Get all vendors/partners with pagination and filters
   */
  async getVendors(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        city,
        category,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where = {};

      // Status filter
      if (status) {
        if (status === 'ACTIVE') {
          where.is_active = true;
        } else if (status === 'INACTIVE') {
          where.is_active = false;
        } else if (status === 'PENDING') {
          where.is_verified = false;
        } else if (status === 'VERIFIED') {
          where.is_verified = true;
        }
      }

      // City filter
      if (city) {
        where.city_id = city;
      }

      // Category filter
      if (category) {
        where.category_id = category;
      }

      // Search filter (name, email, phone)
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { owner: { name: { contains: search, mode: 'insensitive' } } },
          { owner: { email: { contains: search, mode: 'insensitive' } } },
          { owner: { phone: { contains: search, mode: 'insensitive' } } },
          { address: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Execute query with counts and analytics
      const [vendors, totalCount] = await Promise.all([
        prisma.shop.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { [sortBy]: sortOrder },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                is_active: true
              }
            },
            category: {
              select: {
                id: true,
                name: true
              }
            },
            city: {
              select: {
                id: true,
                name: true,
                state: true
              }
            },
            _count: {
              select: {
                bookings: true,
                services: true,
                reviews: true
              }
            }
          }
        }),
        prisma.shop.count({ where })
      ]);

      // Format response
      const formattedVendors = vendors.map(vendor => ({
        id: vendor.id,
        shop_name: vendor.name,
        description: vendor.description,
        owner_name: vendor.owner.name,
        owner_email: vendor.owner.email,
        owner_phone: vendor.owner.phone,
        category: vendor.category,
        city: vendor.city,
        address: vendor.address,
        phone: vendor.phone,
        email: vendor.email,
        website: vendor.website,
        price_range: vendor.price_range,
        rating: vendor.rating,
        total_reviews: vendor.total_reviews,
        photos: vendor.photos,
        is_verified: vendor.is_verified,
        is_active: vendor.is_active,
        status: this.getVendorStatus(vendor),
        registration_date: formatDate(vendor.created_at),
        statistics: {
          total_bookings: vendor._count.bookings,
          total_services: vendor._count.services,
          total_reviews: vendor._count.reviews
        }
      }));

      return {
        vendors: formattedVendors,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      logger.error('Error getting vendors:', error);
      throw error;
    }
  }

  /**
   * Get vendor details by ID
   */
  async getVendorById(vendorId) {
    try {
      const vendor = await prisma.shop.findUnique({
        where: { id: vendorId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              is_active: true,
              created_at: true
            }
          },
          category: true,
          city: true,
          services: {
            where: { is_active: true },
            orderBy: { name: 'asc' },
            select: {
              id: true,
              name: true,
              description: true,
              duration_minutes: true,
              price: true,
              is_active: true,
              _count: {
                select: {
                  bookings: true
                }
              }
            }
          },
          bookings: {
            take: 10,
            orderBy: { created_at: 'desc' },
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              },
              service: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          },
          reviews: {
            take: 5,
            orderBy: { created_at: 'desc' },
            include: {
              customer: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              bookings: true,
              services: true,
              reviews: true
            }
          }
        }
      });

      if (!vendor) {
        throw new Error('Vendor not found');
      }

      // Calculate analytics
      const analytics = await this.getVendorAnalytics(vendorId);

      return {
        ...vendor,
        status: this.getVendorStatus(vendor),
        registration_date: formatDate(vendor.created_at),
        analytics
      };

    } catch (error) {
      logger.error('Error getting vendor details:', error);
      throw error;
    }
  }

  /**
   * Create new vendor
   */
  async createVendor(vendorData) {
    try {
      const {
        shop_name,
        owner_name,
        owner_email,
        owner_phone,
        category_id,
        city_id,
        address,
        phone,
        email,
        website,
        description,
        opening_time,
        closing_time,
        off_days,
        price_range
      } = vendorData;

      // Check if owner already exists
      let owner = await prisma.user.findUnique({
        where: { email: owner_email }
      });

      if (!owner) {
        // Create new owner user
        owner = await prisma.user.create({
          data: {
            name: owner_name,
            email: owner_email,
            phone: owner_phone,
            role: 'PARTNER',
            is_verified: true,
            is_active: true
          }
        });
      }

      // Create shop
      const vendor = await prisma.shop.create({
        data: {
          owner_id: owner.id,
          name: shop_name,
          category_id,
          city_id,
          address,
          phone,
          email,
          website,
          description,
          opening_time: opening_time ? new Date(`2024-01-01T${opening_time}:00Z`) : null,
          closing_time: closing_time ? new Date(`2024-01-01T${closing_time}:00Z`) : null,
          off_days: off_days || [],
          price_range,
          is_active: true,
          is_verified: false
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          },
          city: {
            select: {
              id: true,
              name: true,
              state: true
            }
          }
        }
      });

      logger.info(`New vendor created: ${vendor.id} by admin`);

      return {
        success: true,
        vendor,
        message: 'Vendor created successfully'
      };

    } catch (error) {
      logger.error('Error creating vendor:', error);
      throw error;
    }
  }

  /**
   * Update vendor status (active/inactive/verified)
   */
  async updateVendorStatus(vendorId, statusData) {
    try {
      const { status, reason, notes } = statusData;

      const updateData = {};

      switch (status) {
        case 'ACTIVE':
          updateData.is_active = true;
          break;
        case 'INACTIVE':
          updateData.is_active = false;
          break;
        case 'VERIFIED':
          updateData.is_verified = true;
          updateData.is_active = true;
          break;
        case 'UNVERIFIED':
          updateData.is_verified = false;
          break;
        case 'SUSPENDED':
          updateData.is_active = false;
          updateData.is_verified = false;
          break;
      }

      const vendor = await prisma.shop.update({
        where: { id: vendorId },
        data: updateData,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          },
          city: {
            select: {
              id: true,
              name: true,
              state: true
            }
          }
        }
      });

      logger.info(`Vendor status updated: ${vendorId} -> ${status}`);

      return {
        success: true,
        vendor: {
          ...vendor,
          status: this.getVendorStatus(vendor)
        },
        message: `Vendor ${status.toLowerCase()} successfully`
      };

    } catch (error) {
      logger.error('Error updating vendor status:', error);
      throw error;
    }
  }

  /**
   * Delete vendor (soft delete by deactivating)
   */
  async deleteVendor(vendorId, permanent = false) {
    try {
      if (permanent) {
        // Hard delete - be careful with this
        await prisma.shop.delete({
          where: { id: vendorId }
        });
      } else {
        // Soft delete - deactivate
        await prisma.shop.update({
          where: { id: vendorId },
          data: {
            is_active: false,
            is_verified: false
          }
        });
      }

      logger.info(`Vendor deleted: ${vendorId}, permanent: ${permanent}`);

      return {
        success: true,
        message: permanent ? 'Vendor permanently deleted' : 'Vendor deactivated'
      };

    } catch (error) {
      logger.error('Error deleting vendor:', error);
      throw error;
    }
  }

  /**
   * Get vendor analytics
   */
  async getVendorAnalytics(vendorId) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const [
        thisMonthBookings,
        lastMonthBookings,
        totalRevenue,
        averageRating,
        topServices,
        recentCustomers
      ] = await Promise.all([
        // This month's bookings
        prisma.booking.count({
          where: {
            shop_id: vendorId,
            created_at: { gte: startOfMonth }
          }
        }),
        // Last month's bookings
        prisma.booking.count({
          where: {
            shop_id: vendorId,
            created_at: {
              gte: startOfLastMonth,
              lte: endOfLastMonth
            }
          }
        }),
        // Total revenue
        prisma.booking.aggregate({
          where: {
            shop_id: vendorId,
            status: 'COMPLETED'
          },
          _sum: {
            total_amount: true
          }
        }),
        // Average rating
        prisma.review.aggregate({
          where: {
            shop_id: vendorId
          },
          _avg: {
            rating: true
          }
        }),
        // Top services
        prisma.service.findMany({
          where: {
            shop_id: vendorId,
            is_active: true
          },
          include: {
            _count: {
              select: {
                bookings: true
              }
            }
          },
          orderBy: {
            bookings: {
              _count: 'desc'
            }
          },
          take: 5
        }),
        // Recent unique customers
        prisma.booking.findMany({
          where: {
            shop_id: vendorId
          },
          distinct: ['customer_id'],
          orderBy: {
            created_at: 'desc'
          },
          take: 5,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        })
      ]);

      const growthRate = lastMonthBookings > 0
        ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100
        : 0;

      return {
        bookings: {
          this_month: thisMonthBookings,
          last_month: lastMonthBookings,
          growth_rate: Math.round(growthRate * 10) / 10
        },
        revenue: {
          total: totalRevenue._sum.total_amount || 0,
          formatted: formatCurrency(totalRevenue._sum.total_amount || 0)
        },
        rating: {
          average: averageRating._avg.rating || 0,
          formatted: (averageRating._avg.rating || 0).toFixed(1)
        },
        top_services: topServices.map(service => ({
          id: service.id,
          name: service.name,
          price: service.price,
          formatted_price: formatCurrency(service.price),
          bookings_count: service._count.bookings
        })),
        recent_customers: recentCustomers.map(booking => ({
          id: booking.customer.id,
          name: booking.customer.name,
          phone: booking.customer.phone,
          last_booking: formatDate(booking.created_at)
        }))
      };

    } catch (error) {
      logger.error('Error getting vendor analytics:', error);
      throw error;
    }
  }

  /**
   * Bulk operations on vendors
   */
  async bulkVendorOperation(operationData) {
    try {
      const { operation, vendor_ids, reason, notes } = operationData;

      const updateData = {};

      switch (operation) {
        case 'ACTIVATE':
          updateData.is_active = true;
          break;
        case 'DEACTIVATE':
          updateData.is_active = false;
          break;
        case 'VERIFY':
          updateData.is_verified = true;
          updateData.is_active = true;
          break;
        case 'UNVERIFY':
          updateData.is_verified = false;
          break;
        case 'SUSPEND':
          updateData.is_active = false;
          updateData.is_verified = false;
          break;
      }

      const result = await prisma.shop.updateMany({
        where: {
          id: { in: vendor_ids }
        },
        data: updateData
      });

      logger.info(`Bulk ${operation} on ${result.count} vendors`);

      return {
        success: true,
        updated_count: result.count,
        operation,
        message: `Successfully ${operation.toLowerCase()}d ${result.count} vendors`
      };

    } catch (error) {
      logger.error('Error in bulk vendor operation:', error);
      throw error;
    }
  }

  /**
   * Get vendor status
   */
  getVendorStatus(vendor) {
    if (!vendor.is_active) {
      return 'INACTIVE';
    }
    if (!vendor.is_verified) {
      return 'PENDING';
    }
    return 'ACTIVE';
  }
}

module.exports = new AdminService();