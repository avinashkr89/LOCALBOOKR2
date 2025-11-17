const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create Cities
    console.log('📍 Creating cities...');
    const cities = await prisma.city.createMany({
      data: [
        { name: 'Mumbai', state: 'Maharashtra' },
        { name: 'Delhi', state: 'Delhi' },
        { name: 'Bangalore', state: 'Karnataka' },
        { name: 'Hyderabad', state: 'Telangana' },
        { name: 'Chennai', state: 'Tamil Nadu' },
        { name: 'Kolkata', state: 'West Bengal' },
        { name: 'Pune', state: 'Maharashtra' },
        { name: 'Ahmedabad', state: 'Gujarat' },
        { name: 'Jaipur', state: 'Rajasthan' },
        { name: 'Surat', state: 'Gujarat' }
      ],
      skipDuplicates: true
    });
    console.log(`✅ Created ${cities.count} cities`);

    // 2. Create Categories
    console.log('🎯 Creating categories...');
    const categories = await prisma.category.createMany({
      data: [
        {
          name: 'Salon',
          description: 'Hair cutting, styling, and beauty treatments',
          icon_url: '/icons/salon.svg'
        },
        {
          name: 'Beauty Parlour',
          description: 'Facials, makeup, and skincare treatments',
          icon_url: '/icons/beauty.svg'
        },
        {
          name: 'Spa',
          description: 'Massage therapy and wellness treatments',
          icon_url: '/icons/spa.svg'
        },
        {
          name: 'Nail Salon',
          description: 'Manicure, pedicure, and nail art',
          icon_url: '/icons/nails.svg'
        },
        {
          name: 'Wellness Center',
          description: 'Yoga, meditation, and holistic health',
          icon_url: '/icons/wellness.svg'
        }
      ],
      skipDuplicates: true
    });
    console.log(`✅ Created ${categories.count} categories`);

    // 3. Create Admin User
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@localbookr.com' },
      update: {},
      create: {
        name: 'LocalBookr Admin',
        email: 'admin@localbookr.com',
        password: hashedPassword,
        role: 'ADMIN',
        is_verified: true,
        is_active: true,
        phone: '+919876543210'
      }
    });
    console.log(`✅ Created admin user: ${adminUser.email}`);

    // 4. Get created cities and categories for reference
    const mumbaiCity = await prisma.city.findUnique({ where: { name: 'Mumbai' } });
    const delhiCity = await prisma.city.findUnique({ where: { name: 'Delhi' } });
    const salonCategory = await prisma.category.findUnique({ where: { name: 'Salon' } });
    const beautyCategory = await prisma.category.findUnique({ where: { name: 'Beauty Parlour' } });

    if (mumbaiCity && salonCategory) {
      // 5. Create Sample Partner Users
      console.log('👷 Creating sample partners...');

      const partner1 = await prisma.user.upsert({
        where: { email: 'partner1@localbookr.com' },
        update: {},
        create: {
          name: 'Rajesh Sharma',
          email: 'partner1@localbookr.com',
          password: await bcrypt.hash('partner123', 12),
          role: 'PARTNER',
          is_verified: true,
          is_active: true,
          phone: '+919876543211'
        }
      });

      const partner2 = await prisma.user.upsert({
        where: { email: 'partner2@localbookr.com' },
        update: {},
        create: {
          name: 'Priya Patel',
          email: 'partner2@localbookr.com',
          password: await bcrypt.hash('partner123', 12),
          role: 'PARTNER',
          is_verified: true,
          is_active: true,
          phone: '+919876543212'
        }
      });

      // 6. Create Sample Shops
      console.log('🏪 Creating sample shops...');

      const shop1 = await prisma.shop.create({
        data: {
          owner_id: partner1.id,
          name: ' Glamour Studio',
          description: 'Premium unisex salon with expert stylists and modern equipment',
          category_id: salonCategory.id,
          city_id: mumbaiCity.id,
          address: '123 Linking Road, Bandra West, Mumbai - 400050',
          phone: '+919876543213',
          email: 'glamour@example.com',
          opening_time: new Date('2024-01-01T09:00:00Z'),
          closing_time: new Date('2024-01-01T20:00:00Z'),
          off_days: ['monday'],
          price_range: 'HIGH',
          photos: [
            'https://res.cloudinary.com/demo/image/upload/v1234567/salon1.jpg',
            'https://res.cloudinary.com/demo/image/upload/v1234567/salon2.jpg'
          ],
          rating: 4.5,
          total_reviews: 150,
          is_verified: true,
          is_active: true
        }
      });

      const shop2 = await prisma.shop.create({
        data: {
          owner_id: partner2.id,
          name: 'Beauty Bliss',
          description: 'Complete beauty solutions for women with organic products',
          category_id: beautyCategory.id,
          city_id: mumbaiCity.id,
          address: '456 Hill Road, Bandra West, Mumbai - 400050',
          phone: '+919876543214',
          email: 'beautybliss@example.com',
          opening_time: new Date('2024-01-01T10:00:00Z'),
          closing_time: new Date('2024-01-01T19:00:00Z'),
          off_days: ['tuesday'],
          price_range: 'MEDIUM',
          photos: [
            'https://res.cloudinary.com/demo/image/upload/v1234567/beauty1.jpg'
          ],
          rating: 4.2,
          total_reviews: 89,
          is_verified: true,
          is_active: true
        }
      });

      console.log(`✅ Created ${2} sample shops`);

      // 7. Create Sample Services for each shop
      console.log('💅 Creating sample services...');

      const services1 = await prisma.service.createMany({
        data: [
          {
            shop_id: shop1.id,
            name: 'Haircut (Men)',
            description: 'Professional haircut with wash and styling',
            duration_minutes: 30,
            price: 299.00,
            is_active: true
          },
          {
            shop_id: shop1.id,
            name: 'Hair Coloring',
            description: 'Complete hair coloring with premium products',
            duration_minutes: 90,
            price: 1200.00,
            is_active: true
          },
          {
            shop_id: shop1.id,
            name: 'Hair Spa',
            description: 'Deep conditioning hair spa treatment',
            duration_minutes: 60,
            price: 599.00,
            is_active: true
          },
          {
            shop_id: shop1.id,
            name: 'Beard Grooming',
            description: 'Professional beard styling and grooming',
            duration_minutes: 20,
            price: 199.00,
            is_active: true
          }
        ],
        skipDuplicates: true
      });

      const services2 = await prisma.service.createMany({
        data: [
          {
            shop_id: shop2.id,
            name: 'Facial (Basic)',
            description: 'Basic cleansing and moisturizing facial',
            duration_minutes: 45,
            price: 499.00,
            is_active: true
          },
          {
            shop_id: shop2.id,
            name: 'Bleach & Facial',
            description: 'Face bleach with customizing facial',
            duration_minutes: 75,
            price: 899.00,
            is_active: true
          },
          {
            shop_id: shop2.id,
            name: 'Waxing (Full Arms)',
            description: 'Full arms waxing with soothing gel',
            duration_minutes: 30,
            price: 399.00,
            is_active: true
          },
          {
            shop_id: shop2.id,
            name: 'Manicure',
            description: 'Classic manicure with nail polish',
            duration_minutes: 40,
            price: 299.00,
            is_active: true
          }
        ],
        skipDuplicates: true
      });

      console.log(`✅ Created ${services1.count + services2.count} sample services`);
    }

    // 8. Create Sample Customer Users
    console.log('👥 Creating sample customers...');

    const customers = await prisma.user.createMany({
      data: [
        {
          name: 'Anita Kumar',
          phone: '+919876543215',
          role: 'CUSTOMER',
          is_verified: true,
          is_active: true
        },
        {
          name: 'Vikram Singh',
          phone: '+919876543216',
          role: 'CUSTOMER',
          is_verified: true,
          is_active: true
        },
        {
          name: 'Neha Gupta',
          phone: '+919876543217',
          email: 'neha@example.com',
          role: 'CUSTOMER',
          is_verified: true,
          is_active: true
        }
      ],
      skipDuplicates: true
    });
    console.log(`✅ Created ${customers.count} sample customers`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin@localbookr.com / admin123');
    console.log('Partner 1: partner1@localbookr.com / partner123');
    console.log('Partner 2: partner2@localbookr.com / partner123');
    console.log('\n🔗 API: http://localhost:3001/api/v1/health');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });