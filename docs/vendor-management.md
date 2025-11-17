# Vendor Management System - Admin Panel

## Overview

The LocalBookr admin panel provides comprehensive vendor (partner/shop) management capabilities. Admins can list, create, update, verify, and manage all vendors on the platform through a secure and intuitive interface.

## 🎯 Key Features

### **Vendor Listing & Filtering**
- 📋 Paginated vendor list with 20 vendors per page
- 🔍 Advanced filtering by status, city, category, and search terms
- 📊 Real-time statistics and performance metrics
- 🏆 Top-performing vendors leaderboard

### **Vendor Status Management**
- ✅ **Active**: Vendor is verified and accepting bookings
- ⏳ **Pending**: New vendor awaiting verification
- ❌ **Inactive**: Vendor deactivated (can't receive bookings)
- ⚠️ **Suspended**: Vendor suspended due to policy violations

### **Vendor Operations**
- ➕ Create new vendor accounts
- ✏️ Edit vendor information and settings
- 🔄 Update vendor status (activate/deactivate/verify)
- 📊 View detailed vendor analytics
- 🗑️ Delete vendors (soft delete by default)
- 📋 Bulk operations for multiple vendors
- 📤 Export vendor data (CSV format)

## 📡 API Endpoints

### **Get All Vendors**
```http
GET /api/v1/admin/vendors?page=1&limit=20&status=ACTIVE&city=mumbai&search=hair
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (ACTIVE, INACTIVE, PENDING, VERIFIED)
- `city` (optional): Filter by city ID
- `category` (optional): Filter by category ID
- `search` (optional): Search in name, owner, email, phone, address
- `sortBy` (optional): Sort field (default: 'created_at')
- `sortOrder` (optional): Sort order (asc, desc, default: 'desc')

**Response:**
```json
{
  "success": true,
  "vendors": [
    {
      "id": "uuid",
      "shop_name": "Glamour Studio",
      "owner_name": "Rajesh Sharma",
      "owner_email": "rajesh@example.com",
      "owner_phone": "+919876543211",
      "category": { "id": "uuid", "name": "Salon" },
      "city": { "id": "uuid", "name": "Mumbai", "state": "Maharashtra" },
      "address": "123 Linking Road, Bandra West",
      "phone": "+919876543213",
      "rating": 4.5,
      "total_reviews": 150,
      "is_verified": true,
      "is_active": true,
      "status": "ACTIVE",
      "registration_date": "01 Jan 2024",
      "statistics": {
        "total_bookings": 245,
        "total_services": 8,
        "total_reviews": 150
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **Create New Vendor**
```http
POST /api/v1/admin/vendors
```

**Request Body:**
```json
{
  "shop_name": "New Beauty Parlour",
  "owner_name": "Priya Patel",
  "owner_email": "priya@example.com",
  "owner_phone": "+919876543212",
  "category_id": "uuid",
  "city_id": "uuid",
  "address": "456 Hill Road, Bandra West",
  "phone": "+919876543214",
  "email": "contact@beauty.com",
  "website": "https://beautyparlour.com",
  "description": "Complete beauty solutions",
  "opening_time": "09:00",
  "closing_time": "19:00",
  "off_days": ["monday", "tuesday"],
  "price_range": "MEDIUM"
}
```

### **Get Vendor Details**
```http
GET /api/v1/admin/vendors/{vendorId}
```

**Response includes:**
- Complete vendor profile
- Owner information
- Services offered
- Recent bookings
- Customer reviews
- Detailed analytics
- Performance metrics

### **Update Vendor Status**
```http
PUT /api/v1/admin/vendors/{vendorId}/status
```

**Request Body:**
```json
{
  "status": "VERIFIED",
  "reason": "Verification completed successfully",
  "notes": "All documents verified"
}
```

**Status Options:**
- `ACTIVE`: Activate vendor
- `INACTIVE`: Deactivate vendor
- `VERIFIED`: Mark as verified
- `UNVERIFIED`: Remove verification
- `SUSPENDED`: Suspend vendor

### **Delete Vendor**
```http
DELETE /api/v1/admin/vendors/{vendorId}?permanent=false
```

- `permanent=false` (default): Soft delete (deactivates)
- `permanent=true`: Hard delete (removes completely)

### **Get Vendor Analytics**
```http
GET /api/v1/admin/vendors/{vendorId}/analytics
```

**Response includes:**
- Booking statistics (this month vs last month)
- Revenue data
- Customer analytics
- Service performance
- Growth metrics

### **Bulk Operations**
```http
POST /api/v1/admin/vendors/bulk-operation
```

**Request Body:**
```json
{
  "operation": "VERIFY",
  "vendor_ids": ["uuid1", "uuid2", "uuid3"],
  "reason": "Bulk verification after review",
  "notes": "All vendors have completed verification"
}
```

**Operations:**
- `ACTIVATE`: Activate multiple vendors
- `DEACTIVATE`: Deactivate multiple vendors
- `VERIFY`: Verify multiple vendors
- `UNVERIFY`: Remove verification
- `SUSPEND`: Suspend multiple vendors

### **Export Vendor Data**
```http
GET /api/v1/admin/vendors/export?format=csv&status=ACTIVE&city=mumbai
```

**Query Parameters:**
- `format`: Export format (json, csv)
- All same filters as GET /vendors
- `limit` automatically set to 10000 for exports

## 🎨 Frontend Components

### **VendorList Component**
Location: `/admin-dashboard/src/components/vendors/VendorList.jsx`

**Features:**
- Interactive vendor listing with search and filters
- Real-time status updates
- Inline actions (view, edit, activate, deactivate, delete)
- Pagination controls
- Responsive design

**Usage:**
```jsx
import VendorList from '@/components/vendors/VendorList';

function VendorsPage() {
  return <VendorList />;
}
```

### **VendorStats Component**
Location: `/admin-dashboard/src/components/vendors/VendorStats.jsx`

**Features:**
- Overview statistics cards
- Top performers leaderboard
- Quick action buttons
- Real-time data updates

**Usage:**
```jsx
import VendorStats from '@/components/vendors/VendorStats';

function DashboardPage() {
  return <VendorStats />;
}
```

## 🔐 Authentication & Authorization

All vendor management endpoints require:
- **Authentication**: Valid JWT token
- **Authorization**: Admin role (`ADMIN`)

**Headers:**
```http
Authorization: Bearer {jwt_token}
```

## 📊 Vendor Status Flow

```
New Vendor Registration
        ↓
   PENDING (New)
        ↓
   VERIFICATION PROCESS
        ↓
   VERIFIED + ACTIVE
        ↓
   [Business Operations]
        ↓
   [Admin Actions]
    ↙        ↓        ↘
INACTIVE  SUSPENDED  DELETED
```

## 🎛️ Admin Actions & Permissions

| Action | Description | Required Role |
|--------|-------------|---------------|
| View Vendors | List all vendors with filters | ADMIN |
| Create Vendor | Add new vendor to platform | ADMIN |
| Edit Vendor | Update vendor information | ADMIN |
| Verify Vendor | Mark vendor as verified | ADMIN |
| Activate/Deactivate | Change vendor active status | ADMIN |
| Suspend Vendor | Suspend vendor for violations | ADMIN |
| Delete Vendor | Remove vendor (soft delete) | ADMIN |
| View Analytics | Access vendor performance data | ADMIN |
| Bulk Operations | Perform actions on multiple vendors | ADMIN |
| Export Data | Download vendor lists | ADMIN |

## 📝 Best Practices

### **For Admins:**
1. **Verification Process**: Always verify vendor documents before activation
2. **Regular Reviews**: Monitor vendor performance and customer feedback
3. **Status Management**: Use appropriate status changes based on vendor behavior
4. **Data Export**: Regular backups of vendor data for reporting
5. **Bulk Actions**: Use bulk operations for efficiency with multiple vendors

### **For Developers:**
1. **Error Handling**: Always handle API errors gracefully
2. **Loading States**: Show loading indicators during data fetching
3. **Confirmation Dialogs**: Confirm destructive actions (delete, suspend)
4. **Pagination**: Implement pagination for large vendor lists
5. **Caching**: Cache vendor data to improve performance

## 🔍 Search & Filtering Tips

### **Effective Search:**
- Search works across: shop name, owner name, email, phone, address
- Use partial matches for flexible searching
- Combine search with status/city filters for better results

### **Filter Combinations:**
```javascript
// Active vendors in Mumbai
filters = { status: 'ACTIVE', city: 'mumbai' }

// Pending verification in all cities
filters = { status: 'PENDING' }

// Search for "salon" in Bangalore
filters = { search: 'salon', city: 'bangalore' }
```

## 📱 Mobile Responsiveness

All vendor management interfaces are:
- ✅ Mobile-optimized (320px+)
- ✅ Touch-friendly buttons (44px minimum)
- ✅ Responsive tables with horizontal scroll
- ✅ Adaptive layout for different screen sizes
- ✅ Accessible form controls

## 🚀 Integration Examples

### **React Component Example:**
```jsx
import { useState, useEffect } from 'react';

function VendorManagement() {
  const [vendors, setVendors] = useState([]);

  const fetchVendors = async () => {
    const response = await fetch('/api/v1/admin/vendors', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    setVendors(data.vendors);
  };

  const updateStatus = async (vendorId, status) => {
    await fetch(`/api/v1/admin/vendors/${vendorId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });
    fetchVendors(); // Refresh list
  };

  return (
    <div>
      {/* Vendor list with actions */}
      {vendors.map(vendor => (
        <div key={vendor.id}>
          <h3>{vendor.shop_name}</h3>
          <button onClick={() => updateStatus(vendor.id, 'ACTIVE')}>
            Activate
          </button>
        </div>
      ))}
    </div>
  );
}
```

### **JavaScript/Node.js Example:**
```javascript
// Fetch vendors with filters
const getVendors = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`/api/v1/admin/vendors?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`
    }
  });
  return await response.json();
};

// Create new vendor
const createVendor = async (vendorData) => {
  const response = await fetch('/api/v1/admin/vendors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`
    },
    body: JSON.stringify(vendorData)
  });
  return await response.json();
};
```

---

**🎉 Conclusion:** The vendor management system provides everything needed to effectively manage all vendors on the LocalBookr platform, from onboarding and verification to performance monitoring and bulk operations.