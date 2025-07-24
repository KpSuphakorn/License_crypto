'use client';

import React, { useEffect, useState } from 'react';
import { User, LogOut, Search, Filter, Grid, List, RefreshCw, Eye, Lock, Users, Clock, CheckCircle, AlertCircle, Calendar, Timer, Bell, UserCheck, UserX, Activity, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface License {
  _id: string;
  No: string;
  username: string;
  password?: string;
  gmail: string;
  mail_password?: string;
  is_available?: boolean;
  current_user?: string;
  current_user_name?: string;
  assigned_at?: string;
  expires_at?: string;
  reserved_by?: string;
  reserved_by_name?: string;
  reserved_at?: string;
  queue_count?: number;
  last_activity?: string;
}

interface UserInfo {
  first_name: string;
  last_name: string;
  phone_number: string;
  role?: 'admin' | 'user';
  user_id?: string;
}

interface QueueItem {
  user_id: string;
  user_name: string;
  requested_at: string;
  priority: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LicenseManagementDashboard() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'in-use' | 'queued'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [requestingLicense, setRequestingLicense] = useState<string | null>(null);
  const [cancelingLicense, setCancelingLicense] = useState<string | null>(null);
  const [releasingLicense, setReleasingLicense] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('connected');
  const router = useRouter();

  // Fetch licenses function
  const fetchLicenses = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsAutoRefreshing(true);
        setConnectionStatus('checking');
      }
      
      // Only cleanup expired licenses on initial load, not during auto-refresh
      if (!isAutoRefresh) {
        try {
          await fetch(`${API_BASE_URL}/licenses/cleanup-expired`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        } catch (err) {
          console.warn('Failed to cleanup expired licenses:', err);
        }
      }
      
      const licensesRes = await fetch(`${API_BASE_URL}/licenses`);
      if (!licensesRes.ok) throw new Error('Failed to fetch licenses');
      const licensesData = await licensesRes.json();
      setLicenses(licensesData.licensess || []);
      setConnectionStatus('connected');
    } catch (err: any) {
      setError(err.message);
      setConnectionStatus('disconnected');
    } finally {
      if (isAutoRefresh) {
        setTimeout(() => setIsAutoRefreshing(false), 1000);
      }
    }
  };

  // Fetch user info and initial licenses
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user info
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        const userRes = await fetch(`${API_BASE_URL}/auth`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) throw new Error('Failed to fetch user info');
        const userData = await userRes.json();
        setUserInfo(userData);

        // Fetch licenses
        await fetchLicenses();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-refresh licenses every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPageVisible) {
        fetchLicenses(true);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [isPageVisible]);

  // Handle page visibility to pause auto-refresh when user switches tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
      // Refresh immediately when page becomes visible
      if (!document.hidden) {
        fetchLicenses(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLicenses();
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
    setIsRefreshing(false);
  };

  const handleRequestLicense = async (license: License) => {
    if (requestingLicense) return; // Prevent multiple requests
    
    setRequestingLicense(license._id);
    
    try {
      // First, refresh licenses to check current state
      await fetchLicenses();
      
      // Double-check if license is still available after refresh
      const currentLicenses = await fetch(`${API_BASE_URL}/licenses`).then(res => res.json());
      const currentLicense = currentLicenses.licensess?.find((l: License) => l._id === license._id);
      
      if (currentLicense && !currentLicense.is_available) {
        alert('This license is no longer available. It may have been taken by another user. Please select another one.');
        setLicenses(currentLicenses.licensess || []);
        return;
      }
      
      // Make the request to reserve/assign the license
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/licenses/${license._id}/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409) {
          alert('This license was just taken by another user. Please select another one.');
          await fetchLicenses(); // Refresh the list
          return;
        } else {
          throw new Error(errorData.detail || 'Failed to request license');
        }
      }
      
      const result = await response.json();
      
      // Refresh the licenses list to show the updated state
      await fetchLicenses();
      
      // Navigate to the license details page with a query parameter to indicate this is from a request
      router.push(`/licenses/${license._id}?fromRequest=true`);
      
    } catch (error: any) {
      console.error('Error requesting license:', error);
      alert(error.message || 'An error occurred while requesting the license. Please try again.');
    } finally {
      setRequestingLicense(null);
    }
  };

  const handleReleaseLicense = async (license: License) => {
    if (releasingLicense) return; // Prevent multiple actions
    
    setReleasingLicense(license._id);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/licenses/${license._id}/release`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to release license');
      }
      
      // Refresh the licenses list to show the updated state
      await fetchLicenses();
      
      alert('License released successfully!');
      
    } catch (error: any) {
      console.error('Error releasing license:', error);
      alert(error.message || 'An error occurred while releasing the license. Please try again.');
    } finally {
      setReleasingLicense(null);
    }
  };

  const handleCancelReservation = async (license: License) => {
    if (cancelingLicense) return; // Prevent multiple actions
    
    setCancelingLicense(license._id);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/licenses/${license._id}/cancel-reservation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to cancel reservation');
      }
      
      // Refresh the licenses list to show the updated state
      await fetchLicenses();
      
      alert('Reservation cancelled successfully!');
      
    } catch (error: any) {
      console.error('Error cancelling reservation:', error);
      alert(error.message || 'An error occurred while cancelling the reservation. Please try again.');
    } finally {
      setCancelingLicense(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleDownloadLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/usage-logs/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to download logs');
      }
      
      // Get the blob and create a download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error: any) {
      console.error('Error downloading logs:', error);
      alert(error.message || 'An error occurred while downloading logs. Please try again.');
    }
  };

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.No.includes(searchTerm) ||
                         (license.current_user && license.current_user.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (license.current_user_name && license.current_user_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'available' && license.is_available) ||
                         (filterStatus === 'in-use' && !license.is_available) ||
                         (filterStatus === 'queued' && (license.queue_count || 0) > 0);
    return matchesSearch && matchesFilter;
  });

  const availableCount = licenses.filter(l => l.is_available).length;
  const inUseCount = licenses.filter(l => !l.is_available).length;
  const totalQueueCount = licenses.reduce((sum, l) => sum + (l.queue_count || 0), 0);

  const formatTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return '';
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m remaining`;
    } else {
      return 'Expired';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded-full w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-full w-48 animate-pulse mx-auto"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading License Management System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar
        userInfo={userInfo}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onLogout={handleLogout}
        isAutoRefreshing={isAutoRefreshing}
      />
      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Stats Cards */}
        <div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
          {/* Connection status indicator */}
          <div className="fixed top-20 right-4 flex flex-col space-y-2 z-50">
            {connectionStatus === 'disconnected' && (
              <div className="bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Connection lost</span>
              </div>
            )}
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-sm w-full md:w-1/3 max-w-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Licenses</p>
                <p className="text-3xl font-bold text-gray-900">{licenses.length}</p>
                <p className="text-xs text-gray-500 mt-1">Enterprise Pool</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Grid className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-sm w-full md:w-1/3 max-w-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Available Now</p>
                <p className="text-3xl font-bold text-green-600">{availableCount}</p>
                <p className="text-xs text-gray-500 mt-1">Ready to assign</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-sm w-full md:w-1/3 max-w-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">In Use</p>
                <p className="text-3xl font-bold text-orange-600">{inUseCount}</p>
                <p className="text-xs text-gray-500 mt-1">Currently assigned</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by license number, username, or current user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/95 transition-all duration-200"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Admin Download Logs Button */}
            {userInfo?.role === 'admin' && (
              <button
                onClick={handleDownloadLogs}
                className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                <span>Download Logs</span>
              </button>
            )}
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
            >
              <option value="all">All Licenses</option>
              <option value="available">Available</option>
              <option value="in-use">In Use</option>
              {/* <option value="queued">Has Queue</option> */}
            </select>
            
            <div className="flex bg-white/80 backdrop-blur-sm rounded-xl border border-white/30 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Licenses Grid/List */}
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredLicenses.map((license, index) => (
            <div
              key={license._id}
              className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 transition-all duration-300 ${
                viewMode === 'list' ? 'flex items-center' : ''
              } ${!license.is_available ? 'opacity-60 pointer-events-none' : 'hover:bg-white/95 hover:scale-[1.02] hover:shadow-lg'}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                {/* License Header */}
                <div className={`flex items-center justify-between mb-4 ${viewMode === 'list' ? 'mb-0' : ''}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
                      license.is_available 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-orange-500 to-orange-600'
                    }`}>
                      {license.No}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{license.username}</h3>
                      <p className="text-sm text-gray-600">{license.gmail}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Show status based on license state */}
                    {license.is_available ? (
                      license.reserved_by ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          Reserved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Available
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                        In Use
                      </span>
                    )}
                  </div>
                </div>

                {/* License Details */}
                {viewMode === 'grid' && (
                  <div className="space-y-3">
                    {/* Show reservation info if license is reserved */}
                    {license.is_available && license.reserved_by && (
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-yellow-800">Reserved by</p>
                            <p className="text-yellow-700">{license.reserved_by_name || license.reserved_by}</p>
                          </div>
                          <UserCheck className="w-5 h-5 text-yellow-600" />
                        </div>
                        {license.reserved_at && (
                          <div className="mt-2 flex items-center space-x-2 text-xs text-yellow-600">
                            <Calendar className="w-3 h-3" />
                            <span>Reserved at: {new Date(license.reserved_at).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show current user info if license is in use */}
                    {!license.is_available && license.current_user && (
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-800">Current User</p>
                            <p className="text-orange-700">{license.current_user_name || license.current_user}</p>
                          </div>
                          <UserCheck className="w-5 h-5 text-orange-600" />
                        </div>
                        {license.expires_at && (
                          <div className="mt-2 flex items-center space-x-2 text-xs text-orange-600">
                            <Timer className="w-3 h-3" />
                            <span>{formatTimeRemaining(license.expires_at)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        Last activity: {new Date(license.last_activity || '').toLocaleTimeString()}
                      </div>
                      
                      <div className="flex space-x-2">
                        {/* Show Cancel Reservation button if user has reserved this license OR if admin */}
                        {license.is_available && license.reserved_by && (license.reserved_by === userInfo?.user_id || userInfo?.role === 'admin') && (
                          <button
                            onClick={() => handleCancelReservation(license)}
                            disabled={cancelingLicense === license._id}
                            className={`px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm flex items-center space-x-2 ${
                              cancelingLicense === license._id ? 'opacity-60 cursor-not-allowed' : ''
                            }`}
                          >
                            {cancelingLicense === license._id ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Cancelling...</span>
                              </>
                            ) : (
                              <span>Cancel</span>
                            )}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleRequestLicense(license)}
                          disabled={(!license.is_available || (!!license.reserved_by && license.reserved_by !== userInfo?.user_id)) || requestingLicense === license._id}
                          className={`px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg transition-all duration-200 shadow-sm hover:from-green-600 hover:to-green-700 hover:shadow-md flex items-center space-x-2 ${
                            (!license.is_available || (!!license.reserved_by && license.reserved_by !== userInfo?.user_id)) || requestingLicense === license._id ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
                          }`}
                        >
                          {requestingLicense === license._id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Requesting...</span>
                            </>
                          ) : (
                            <span>Request</span>
                          )}
                        </button>
                        {userInfo?.role === 'admin' && !license.is_available && (
                          <button
                            onClick={() => handleReleaseLicense(license)}
                            disabled={releasingLicense === license._id}
                            className={`px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm flex items-center space-x-2 ${
                              releasingLicense === license._id ? 'opacity-60 cursor-not-allowed' : ''
                            }`}
                          >
                            {releasingLicense === license._id ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Releasing...</span>
                              </>
                            ) : (
                              <span>Release</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* List View Details */}
                {viewMode === 'list' && (
                  <div className="ml-6 flex items-center justify-between flex-1">
                    <div className="flex items-center space-x-6">
                      {!license.is_available && license.current_user && (
                        <div className="text-sm">
                          <span className="text-gray-500">User: </span>
                          <span className="font-medium text-gray-900">{license.current_user_name || license.current_user}</span>
                        </div>
                      )}
                      {license.expires_at && (
                        <div className="text-sm text-orange-600">
                          {formatTimeRemaining(license.expires_at)}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Last activity: {new Date(license.last_activity || '').toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {/* Show Cancel Reservation button if user has reserved this license OR if admin */}
                      {license.is_available && license.reserved_by && (license.reserved_by === userInfo?.user_id || userInfo?.role === 'admin') && (
                        <button
                          onClick={() => handleCancelReservation(license)}
                          disabled={cancelingLicense === license._id}
                          className={`px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm flex items-center space-x-2 ${
                            cancelingLicense === license._id ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        >
                          {cancelingLicense === license._id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Cancelling...</span>
                            </>
                          ) : (
                            <span>Cancel</span>
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleRequestLicense(license)}
                        disabled={(!license.is_available || (!!license.reserved_by && license.reserved_by !== userInfo?.user_id)) || requestingLicense === license._id}
                        className={`px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg transition-all duration-200 shadow-sm hover:from-green-600 hover:to-green-700 hover:shadow-md flex items-center space-x-2 ${
                          (!license.is_available || (!!license.reserved_by && license.reserved_by !== userInfo?.user_id)) || requestingLicense === license._id ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
                        }`}
                      >
                        {requestingLicense === license._id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Requesting...</span>
                          </>
                        ) : (
                          <span>Request</span>
                        )}
                      </button>
                      {userInfo?.role === 'admin' && !license.is_available && (
                        <button
                          onClick={() => handleReleaseLicense(license)}
                          disabled={releasingLicense === license._id}
                          className={`px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm flex items-center space-x-2 ${
                            releasingLicense === license._id ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        >
                          {releasingLicense === license._id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Releasing...</span>
                            </>
                          ) : (
                            <span>Release</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Hover effect overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {filteredLicenses.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No licenses found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}