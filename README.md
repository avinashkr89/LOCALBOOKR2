# LocalBookr - Complete Local Service Booking Platform

<div align="center">

![LocalBookr Logo](https://via.placeholder.com/200x80/f37620/ffffff?text=LocalBookr)

**Full-stack platform for local service bookings with WhatsApp reminders and CRM**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)

</div>

## 📖 About LocalBookr

LocalBookr is a comprehensive local service booking platform designed specifically for salons, beauty parlors, and wellness centers. It provides three main interfaces:

- **Customer App**: Book services online with WhatsApp confirmations and reminders
- **Partner Dashboard**: Manage shop profile, bookings, customers, and analytics
- **Admin Panel**: Oversee the entire platform, manage partners, and track growth

### 🌟 Key Features

#### For Customers
- 🏪 Browse shops by city and category
- 📅 Real-time availability and booking
- 💬 WhatsApp confirmations and reminders
- ⭐ Reviews and ratings
- 📱 Mobile-first responsive design

#### For Shop Owners
- 📊 Complete booking management
- 👥 Customer database and CRM
- 📈 Analytics and insights
- 💰 Revenue tracking
- 🕐 Flexible scheduling

#### For Administrators
- 🎛️ Complete platform control
- 🏙️ City and category management
- 📈 Growth analytics
- 💳 Commission tracking
- 🔧 System configuration

## 🏗️ Architecture

### Technology Stack

**Backend**
- Node.js + Express.js
- PostgreSQL with Prisma ORM
- JWT Authentication with Phone OTP
- Redis for caching and queues
- WhatsApp API integration (Twilio)

**Frontend**
- Next.js 14 with React 18
- Tailwind CSS for styling
- TypeScript for type safety
- React Hook Form for forms

**Infrastructure**
- Docker containerization
- Railway/Render for backend
- Vercel for frontend
- Supabase for database

### Project Structure

```
LOCALBOOKR2/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, validation, etc.
│   │   ├── routes/           # API routes
│   │   └── utils/            # Helper functions
│   ├── prisma/              # Database schema and migrations
│   └── tests/               # Test suites
├── frontend/                 # Customer Next.js app
├── partner-dashboard/        # Partner Next.js app
├── admin-dashboard/          # Admin Next.js app
├── shared/                  # Shared types and utilities
├── docs/                    # Documentation
└── scripts/                 # Utility scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- PostgreSQL 14+ or Docker
- Redis 6+ (optional, for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LOCALBOOKR2
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env

   # Frontend
   cp frontend/.env.example frontend/.env.local

   # Edit these files with your configuration
   ```

4. **Set up database**
   ```bash
   # Using Docker (recommended for development)
   docker-compose up -d postgres redis

   # Or use your own PostgreSQL instance
   # Update DATABASE_URL in backend/.env
   ```

5. **Run database migrations**
   ```bash
   npm run migrate
   ```

6. **Seed database with sample data**
   ```bash
   npm run seed
   ```

### Development

1. **Start all services**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API: http://localhost:3001
   - Customer App: http://localhost:3000
   - Partner Dashboard: http://localhost:3002
   - Admin Dashboard: http://localhost:3003

2. **Start individual services**
   ```bash
   npm run dev:backend    # Backend only
   npm run dev:frontend   # Customer app only
   npm run dev:partner    # Partner dashboard only
   npm run dev:admin      # Admin dashboard only
   ```

### Docker Development

1. **Start with Docker Compose**
   ```bash
   docker-compose up
   ```

2. **Run database operations**
   ```bash
   docker-compose exec backend npm run migrate
   docker-compose exec backend npm run seed
   ```

## 📚 API Documentation

### Authentication Endpoints

```bash
# Send OTP
POST /api/v1/auth/send-otp
{
  "phone": "+919876543210"
}

# Verify OTP
POST /api/v1/auth/verify-otp
{
  "phone": "+919876543210",
  "otp": "123456"
}

# Get Profile
GET /api/v1/auth/profile
Headers: Authorization: Bearer <token>
```

### Shop Endpoints

```bash
# Get Shops
GET /api/v1/shops?city={cityId}&category={categoryId}

# Get Shop Details
GET /api/v1/shops/{shopId}

# Get Shop Services
GET /api/v1/shops/{shopId}/services
```

### Booking Endpoints

```bash
# Create Booking
POST /api/v1/bookings
{
  "shop_id": "uuid",
  "service_id": "uuid",
  "date": "2024-12-25",
  "start_time": "14:00",
  "customer_name": "John Doe",
  "customer_phone": "+919876543210"
}

# Get My Bookings
GET /api/v1/my-bookings
Headers: Authorization: Bearer <token>
```

For complete API documentation, visit: `/api/v1/docs` (when running)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Run tests with coverage
npm run test:coverage
```

## 📦 Deployment

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="your-token"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
REDIS_URL="redis://localhost:6379"
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL="https://your-api.com/api/v1"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-key"
```

### Production Deployment

1. **Backend (Railway/Render)**
   ```bash
   cd backend
   npm run build
   npm run migrate:prod
   ```

2. **Frontend (Vercel)**
   ```bash
   cd frontend
   npm run build
   ```

3. **Environment Setup**
   - Configure all environment variables
   - Set up PostgreSQL database
   - Configure Redis cache
   - Set up WhatsApp API (Twilio)
   - Configure Cloudinary for file uploads

## 🔧 Configuration

### Database Schema

The platform uses the following main entities:

- **Users**: Customers, Partners, and Admins
- **Shops**: Service providers with details and settings
- **Services**: Individual services offered by shops
- **Bookings**: Appointments with time slots and status
- **Reviews**: Customer feedback and ratings
- **Notifications**: WhatsApp/SMS logging

### WhatsApp Integration

1. **Set up Twilio Account**
   - Create WhatsApp Business Profile
   - Get approved message templates
   - Configure webhook URLs

2. **Template Examples**
   - Booking Confirmations
   - Appointment Reminders
   - Status Updates
   - Daily Summaries

### File Upload

Uses Cloudinary for storing:
- Shop photos
- Profile pictures
- Service images
- Documents

## 📈 Analytics & Monitoring

### Key Metrics Tracked

- Booking volume and trends
- Customer acquisition and retention
- Revenue analytics
- Partner performance
- Notification delivery rates

### Monitoring Setup

- **Error Tracking**: Sentry
- **Performance**: Custom health endpoints
- **Logging**: Winston with file rotation
- **Database**: Prisma query logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- 📧 Email: support@localbookr.com
- 💬 WhatsApp: +91 98765 43210
- 📖 Documentation: [docs.localbookr.com](https://docs.localbookr.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/localbookr/issues)

## 🎯 Roadmap

### Phase 1: Core Booking System ✅
- [x] User authentication with phone OTP
- [x] Shop and service management
- [x] Booking system with time slots
- [x] Basic WhatsApp notifications

### Phase 2: Enhanced Features 🚧
- [ ] Advanced analytics dashboard
- [ ] Customer loyalty program
- [ ] Multi-payment gateway integration
- [ ] Advanced notification templates

### Phase 3: Scale & Expansion 📋
- [ ] Mobile apps (React Native)
- [ ] Multi-city expansion
- [ ] API for third-party integrations
- [ ] AI-powered recommendations

---

<div align="center">
  <p>Made with ❤️ by the LocalBookr Team</p>
  <p>Empowering local businesses with technology</p>
</div>