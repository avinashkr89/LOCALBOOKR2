import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const VendorStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendorStats();
  }, []);

  const fetchVendorStats = async () => {
    try {
      const response = await fetch('/api/v1/admin/vendors/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error(data.error?.message || 'Failed to fetch vendor statistics');
      }
    } catch (error) {
      toast.error('Error fetching vendor statistics');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-soft animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-soft">
        <p className="text-gray-500">Unable to load vendor statistics</p>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, color, icon }) => (
    <div className={`${color} rounded-lg shadow-soft p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white opacity-90">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-white opacity-75 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="text-white opacity-50">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            {icon}
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Vendors"
          value={stats.overview.total}
          subtitle={`${stats.overview.verified} verified`}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          icon={
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          }
        />

        <StatCard
          title="Active Vendors"
          value={stats.overview.active}
          subtitle={`${stats.percentages.active_rate}% activation rate`}
          color="bg-gradient-to-r from-green-500 to-green-600"
          icon={
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          }
        />

        <StatCard
          title="Pending Verification"
          value={stats.overview.pending}
          subtitle={`${stats.percentages.pending_rate}% need review`}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
          icon={
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          }
        />

        <StatCard
          title="New This Month"
          value={stats.overview.new_this_month}
          subtitle="Recently joined"
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          icon={
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          }
        />
      </div>

      {/* Top Performers */}
      <div className="bg-white shadow-soft border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top Performing Vendors</h3>
          <p className="text-sm text-gray-500">Vendors with the most bookings this month</p>
        </div>
        <div className="p-6">
          {stats.top_performers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No vendors available</p>
          ) : (
            <div className="space-y-4">
              {stats.top_performers.map((vendor, index) => (
                <div key={vendor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{vendor.name}</p>
                      <p className="text-sm text-gray-500">{vendor.owner_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{vendor.bookings_count} bookings</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        ⭐ {vendor.rating || '0.0'}
                      </span>
                      <StatusBadge status={vendor.is_active ? (vendor.is_verified ? 'ACTIVE' : 'PENDING') : 'INACTIVE'} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => window.location.href = '/admin/vendors/new'}
          className="bg-white p-6 rounded-lg shadow-soft border border-gray-200 hover:border-primary-300 transition-colors text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Add New Vendor</h4>
              <p className="text-sm text-gray-500 mt-1">Onboard a new service provider</p>
            </div>
            <div className="text-primary-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
        </button>

        <button
          onClick={() => window.location.href = '/admin/vendors?status=PENDING'}
          className="bg-white p-6 rounded-lg shadow-soft border border-gray-200 hover:border-yellow-300 transition-colors text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Review Pending</h4>
              <p className="text-sm text-gray-500 mt-1">Approve pending vendor applications</p>
            </div>
            <div className="text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </button>

        <button
          onClick={() => window.location.href = '/admin/vendors/export'}
          className="bg-white p-6 rounded-lg shadow-soft border border-gray-200 hover:border-green-300 transition-colors text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Export Data</h4>
              <p className="text-sm text-gray-500 mt-1">Download vendor list as CSV</p>
            </div>
            <div className="text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

// Status Badge Component (reused from VendorList)
const StatusBadge = ({ status }) => {
  const statusConfig = {
    ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active' },
    INACTIVE: { color: 'bg-red-100 text-red-800', label: 'Inactive' },
    PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    SUSPENDED: { color: 'bg-gray-100 text-gray-800', label: 'Suspended' }
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

export default VendorStats;