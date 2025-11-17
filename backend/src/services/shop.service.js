const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const {
  calculateDistance,
  generateAvailableTimeSlots,
  isWithinBusinessHours,
  formatCurrency,
  formatDate,
  getPriceRangeSymbol
} = require('../utils/helpers');

const prisma = new PrismaClient();

/**
 * Shop Service - Customer Search and Discovery
 */
class ShopService {
  /**
   * Search shops by location, category, and filters
   */
  async searchShops(searchFilters = {}) {
    try {
      const {
        city_id,
        category_id,
        search,
        page = 1,
        limit = 20,
        sort_by = 'distance',
        lat, // User's latitude for distance calculation
        lng, // User's longitude for distance calculation
        price_range,
        is_verified,
        rating_min,
        rating_max
      } = searchFilters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where = {
        is_active: true,
        is_verified: is_verified !== false ? true : undefined
      };

      // City filter
      if (city_id) {
        where.city_id = city_id;
      }

      // Category filter
      if (category_id) {
        where.category_id = category_id;
      }

      // Price range filter
      if (price_range) {
        where.price_range = price_range;
      }

      // Rating range filter
      if (rating_min || rating_max) {
        where.rating = {};
        if (rating_min) where.rating.gte = parseFloat(rating_min);
        if (rating_max) where.rating.lte = parseFloat(rating_max);
      }

      // Search filter (name, description, address)
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          // Also search owner name
          { owner: { name: { contains: search, mode: 'insensitive' } } }
        ];
      }

      // Execute base query
      const shops = await prisma.shop.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          owner: {
            select: {
              id: true,
              name: true,
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
          },
          services: {
            where: { is_active: true },
            take: 5, // Limit services shown in search results
            select: {
              id: true,
              name: true,
              duration_minutes: true,
              price: true
            },
            orderBy: { name: 'asc' }
          },
          _count: {
            select: {
              services: true,
              reviews: true
            }
          }
        }
      });

      // Calculate total count
      const totalCount = await prisma.shop.count({ where });

      // Enhance shops with additional data
      const enhancedShops = shops.map(shop => {
        let distance = null;

        // Calculate distance if user coordinates provided
        if (lat && lng && shop.latitude && shop.longitude) {
          distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            parseFloat(shop.latitude),
            parseFloat(shop.longitude)
          );
        }

        return {
          id: shop.id,
          name: shop.name,
          description: shop.description,
          photos: shop.photos,
          rating: parseFloat(shop.rating) || 0,
          total_reviews: shop.total_reviews,
          price_range: shop.price_range,
          price_range_symbol: getPriceRangeSymbol(shop.price_range),
          distance: distance ? parseFloat(distance.toFixed(2)) : null,
          address: shop.address,
          phone: shop.phone,
          category: shop.category,
          city: shop.city,
          owner: shop.owner,
          services_count: shop._count.services,
          reviews_count: shop._count.reviews,
          is_verified: shop.is_verified,
          is_active: shop.is_active,
          opening_time: shop.opening_time,
          closing_time: shop.closing_time,
          off_days: shop.off_days
        };
      });

      // Sort results
      if (sort_by === 'distance' && lat && lng) {
        enhancedShops.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      } else if (sort_by === 'rating') {
        enhancedShops.sort((a, b) => b.rating - a.rating);
      } else if (sort_by === 'reviews') {
        enhancedShops.sort((a, b) => b.total_reviews - a.total_reviews);
      } else {
        // Default sort by created_at
        enhancedShops.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }

      return {
        success: true,
        shops: enhancedShops,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        filters_applied: {
          city_id,
          category_id,
          search,
          price_range,
          sort_by
        }
      };

    } catch (error) {
      logger.error('Error searching shops:', error);
      throw error;
    }
  }

  /**
   * Get shop details with services and availability
   */
  async getShopById(shopId, date = null) {
    try {
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
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
          services: {
            where: { is_active: true },
            orderBy: { name: 'asc' },
            include: {
              _count: {
                select: {
                  bookings: true
                }
              }
            }
          },
          reviews: {
            take: 10,
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
              services: true,
              reviews: true,
              bookings: true
            }
          }
        }
      });

      if (!shop) {
        throw new Error('Shop not found');
      }

      // Get available time slots if date provided
      let availableSlots = [];
      if (date) {
        // Get existing bookings for the date
        const existingBookings = await prisma.booking.findMany({
          where: {
            shop_id: shopId,
            date: new Date(date),
            status: { in: ['CONFIRMED', 'PENDING'] }
          },
          select: { start_time: true, end_time: true }
        });

        // Extract booked time slots
        const bookedSlots = existingBookings.map(booking => {
          const startTime = booking.start_time.toTimeString().slice(0, 5);
          const endTime = booking.end_time.toTimeString().slice(0, 5);
          return { startTime, endTime };
        });

        // Generate available slots
        if (shop.opening_time && shop.closing_time) {
          const openingTime = shop.opening_time.toTimeString().slice(0, 5);
          const closingTime = shop.closing_time.toTimeString().slice(0, 5);

          availableSlots = generateAvailableTimeSlots(
            openingTime,
            closingTime,
            60, // Default 1-hour slots
            bookedSlots
          );
        }
      }

      // Format services with booking counts
      const formattedServices = shop.services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        duration_minutes: service.duration_minutes,
        price: parseFloat(service.price),
        formatted_price: formatCurrency(service.price),
        booking_count: service._count.bookings
      }));

      // Format reviews
      const formattedReviews = shop.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        customer_name: review.customer.name,
        created_at: formatDate(review.created_at)
      }));

      return {
        success: true,
        shop: {
          id: shop.id,
          name: shop.name,
          description: shop.description,
          photos: shop.photos,
          address: shop.address,
          phone: shop.phone,
          email: shop.email,
          website: shop.website,
          rating: parseFloat(shop.rating) || 0,
          total_reviews: shop.total_reviews,
          price_range: shop.price_range,
          price_range_symbol: getPriceRangeSymbol(shop.price_range),
          is_verified: shop.is_verified,
          is_active: shop.is_active,
          opening_time: shop.opening_time?.toTimeString().slice(0, 5),
          closing_time: shop.closing_time?.toTimeString().slice(0, 5),
          off_days: shop.off_days,
          owner: shop.owner,
          category: shop.category,
          city: shop.city,
          statistics: shop._count,
          services: formattedServices,
          reviews: formattedReviews,
          available_slots: availableSlots
        }
      };

    } catch (error) {
      logger.error('Error getting shop details:', error);
      throw error;
    }
  }

  /**
   * Get shop services with time slots for specific date
   */
  async getShopServices(shopId, date = null) {
    try {
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: {
          opening_time: true,
          closing_time: true,
          off_days: true
        }
      });

      if (!shop) {
        throw new Error('Shop not found');
      }

      const services = await prisma.service.findMany({
        where: {
          shop_id: shopId,
          is_active: true
        },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              bookings: true
            }
          }
        }
      });

      let availableSlots = [];

      if (date && shop.opening_time && shop.closing_time) {
        // Get existing bookings for the date
        const existingBookings = await prisma.booking.findMany({
          where: {
            shop_id: shopId,
            date: new Date(date),
            status: { in: ['CONFIRMED', 'PENDING'] }
          },
          select: { start_time: true, end_time: true }
        });

        // Check if requested date is an off day
        const requestedDate = new Date(date);
        const dayOfWeek = requestedDate.getDay(); // 0 = Sunday, 6 = Saturday
        const offDaysMap = {
          0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
          4: 'thursday', 5: 'friday', 6: 'saturday'
        };
        const isOffDay = shop.off_days.includes(offDaysMap[dayOfWeek]);

        if (!isOffDay) {
          // Extract booked time slots
          const bookedSlots = existingBookings.map(booking => {
            const startTime = booking.start_time.toTimeString().slice(0, 5);
            const endTime = booking.end_time.toTimeString().slice(0, 5);
            return { startTime, endTime };
          });

          // Generate available slots
          const openingTime = shop.opening_time.toTimeString().slice(0, 5);
          const closingTime = shop.closing_time.toTimeString().slice(0, 5);

          availableSlots = generateAvailableTimeSlots(
            openingTime,
            closingTime,
            60, // 1-hour slots
            bookedSlots
          );
        }
      }

      // Format services
      const formattedServices = services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        duration_minutes: service.duration_minutes,
        price: parseFloat(service.price),
        formatted_price: formatCurrency(service.price),
        booking_count: service._count.bookings
      }));

      return {
        success: true,
        services: formattedServices,
        shop_info: {
          opening_time: shop.opening_time?.toTimeString().slice(0, 5),
          closing_time: shop.closing_time?.toTimeString().slice(0, 5),
          off_days: shop.off_days,
          available_slots: availableSlots
        }
      };

    } catch (error) {
      logger.error('Error getting shop services:', error);
      throw error;
    }
  }

  /**
   * Get featured shops (homepage)
   */
  async getFeaturedShops(cityId = null, limit = 6) {
    try {
      const where = {
        is_active: true,
        is_verified: true,
        rating: { gte: 4.0 }
      };

      if (cityId) {
        where.city_id = cityId;
      }

      const shops = await prisma.shop.findMany({
        where,
        take: parseInt(limit),
        orderBy: [
          { rating: 'desc' },
          { total_reviews: 'desc' }
        ],
        include: {
          owner: {
            select: { id: true, name: true, phone: true }
          },
          category: {
            select: { id: true, name: true }
          },
          city: {
            select: { id: true, name: true, state: true }
          }
        }
      });

      const formattedShops = shops.map(shop => ({
        id: shop.id,
        name: shop.name,
        photos: shop.photos.slice(0, 2), // First 2 photos
        rating: parseFloat(shop.rating),
        total_reviews: shop.total_reviews,
        price_range: shop.price_range,
        price_range_symbol: getPriceRangeSymbol(shop.price_range),
        address: shop.address,
        phone: shop.phone,
        owner: shop.owner,
        category: shop.category,
        city: shop.city,
        is_verified: shop.is_verified
      }));

      return {
        success: true,
        shops: formattedShops
      };

    } catch (error) {
      logger.error('Error getting featured shops:', error);
      throw error;
    }
  }

  /**
   * Get popular shops (most bookings)
   */
  async getPopularShops(cityId = null, limit = 8) {
    try {
      const where = {
        is_active: true
      };

      if (cityId) {
        where.city_id = cityId;
      }

      // Get shops with most bookings
      const shops = await prisma.shop.findMany({
        where,
        take: parseInt(limit),
        include: {
          _count: {
            select: {
              bookings: true
            }
          }
        },
          owner: {
            select: { id: true, name: true, phone: true }
          },
          category: {
            select: { id: true, name: true }
          },
          city: {
            select: { id: true, name: true, state: true }
          }
        },
        orderBy: {
          _count: {
            bookings: 'desc'
          }
        }
      });

      const formattedShops = shops.map(shop => ({
        id: shop.id,
        name: shop.name,
        photos: shop.photos.slice(0, 2),
        rating: parseFloat(shop.rating) || 0,
        total_reviews: shop.total_reviews,
        price_range: shop.price_range,
        price_range_symbol: getPriceRangeSymbol(shop.price_range),
        address: shop.address,
        phone: shop.phone,
        owner: shop.owner,
        category: shop.category,
        city: shop.city,
        is_verified: shop.is_verified,
        booking_count: shop._count.bookings
      }));

      return {
        success: true,
        shops: formattedShops
      };

    } catch (error) {
      logger.error('Error getting popular shops:', error):
      throw error;
    }
  }

  /**
   * Search shops by geolocation (lat/lng)
   */
  async searchShopsByLocation(lat, lng, radius = 10, limit = 20) {
    try {
      // Get all active shops
      const allShops = await prisma.shop.findMany({
        where: { is_active: true, is_verified: true },
        include: {
          owner: {
            select: { id: true, name: true, phone: true }
          },
          category: {
            select: { id: true, name: true }
          },
          city: {
            select: { id: true, name: true, state: true }
          }
        }
      });

      // Calculate distance and filter by radius
      const shopsWithinRadius = allShops
        .filter(shop => shop.latitude && shop.longitude)
        .map(shop => {
          const distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            parseFloat(shop.latitude),
            parseFloat(shop.longitude)
          );
          return { ...shop, distance };
        })
        .filter(shop => shop.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, parseInt(limit));

      const formattedShops = shopsWithinRadius.map(shop => ({
        id: shop.id,
        name: shop.name,
        photos: shop.photos.slice(0, 1),
        rating: parseFloat(shop.rating) || 0,
        total_reviews: shop.total_reviews,
        price_range: shop.price_range,
        price_range_symbol: getPriceRangeSymbol(shop.price_range),
        address: shop.address,
        phone: shop.phone,
        distance: parseFloat(shop.distance.toFixed(2)),
        owner: shop.owner,
        category: shop.category,
        city: shop.city,
        is_verified: shop.is_verified
      }));

      return {
        success: true,
        shops: formattedShops,
        search_center: { lat, lng, radius }
      };

    } catch (error) {
      logger.error('Error searching shops by location:', error);
      throw error;
    }
  }

  /**
   * Get nearby cities with shop counts
   */
  async getNearbyCities(lat = null, lng = null, limit = 10) {
    try {
      const cities = await prisma.city.findMany({
        where: { is_active: true },
        include: {
          _count: {
            select: {
              shops: true
            }
          }
        },
        orderBy: { name: 'asc' },
        take: parseInt(limit)
      });

      let formattedCities = cities;

      if (lat && lng) {
        // Get cities with coordinates and calculate distance
        formattedCities = cities.map(city => {
          let distance = null;
          // You would need to add lat/lng to cities table
          // For now, return all cities
          return {
            id: city.id,
            name: city.name,
            state: city.state,
            shops_count: city._count.shops
          };
        });
      }

      return {
        success: true,
        cities: formattedCities
      };

    } catch (error) {
      logger.error('Error getting nearby cities:', error);
      throw error;
    }
  }
}

module.exports = new ShopService();