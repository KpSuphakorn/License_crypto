'use client';

import React, { useEffect, useState } from 'react';
import { User, LogOut, Search, Filter, Grid, List, RefreshCw, Eye, Lock, Users, Clock, CheckCircle, AlertCircle, Calendar, Timer, Bell, UserCheck, UserX, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface License {
  _id: string;
  No: string;
  username: string;
  password?: string;
  gmail: string;
  mail_password?: string;
  is_avaliable?: boolean;
  current_user?: string;
  assigned_at?: string;
  expires_at?: string;
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
  const router = useRouter();

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
        const licensesRes = await fetch(`${API_BASE_URL}/licenses`);
        if (!licensesRes.ok) throw new Error('Failed to fetch licenses');
        const licensesData = await licensesRes.json();
        setLicenses(licensesData.licensess || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleRequestLicense = (license: License) => {
    router.push(`/licenses/${license._id}`);
  };

  const handleReleaseLicense = (license: License) => {
    console.log(`Releasing license ${license.No}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.No.includes(searchTerm) ||
                         (license.current_user && license.current_user.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'available' && license.is_avaliable) ||
                         (filterStatus === 'in-use' && !license.is_avaliable) ||
                         (filterStatus === 'queued' && (license.queue_count || 0) > 0);
    return matchesSearch && matchesFilter;
  });

  const availableCount = licenses.filter(l => l.is_avaliable).length;
  const inUseCount = licenses.filter(l => !l.is_avaliable).length;
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
      />
      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Stats Cards */}
        <div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-sm w-full md:w-1/3 max-w-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Licenses</p>
                <p className="text-3xl font-bold text-gray-900">12</p>
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
              } ${!license.is_avaliable ? 'opacity-60 pointer-events-none' : 'hover:bg-white/95 hover:scale-[1.02] hover:shadow-lg'}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                {/* License Header */}
                <div className={`flex items-center justify-between mb-4 ${viewMode === 'list' ? 'mb-0' : ''}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
                      license.is_avaliable 
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
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      license.is_avaliable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {license.is_avaliable ? 'Available' : 'In Use'}
                    </span>
                  </div>
                </div>

                {/* License Details */}
                {viewMode === 'grid' && (
                  <div className="space-y-3">
                    {!license.is_avaliable && license.current_user && (
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-800">Current User</p>
                            <p className="text-orange-700">{license.current_user}</p>
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
                        <button
                          onClick={() => handleRequestLicense(license)}
                          className={`px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg transition-all duration-200 shadow-sm hover:from-green-600 hover:to-green-700 hover:shadow-md ${!license.is_avaliable ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
                          disabled={!license.is_avaliable}
                        >
                          Request
                        </button>
                        {userInfo?.role === 'admin' && !license.is_avaliable && (
                          <button
                            onClick={() => handleReleaseLicense(license)}
                            className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm"
                          >
                            Release
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
                      {!license.is_avaliable && license.current_user && (
                        <div className="text-sm">
                          <span className="text-gray-500">User: </span>
                          <span className="font-medium text-gray-900">{license.current_user}</span>
                        </div>
                      )}
                      
                      {license.expires_at && (
                        <div className="text-sm text-orange-600">
                          {formatTimeRemaining(license.expires_at)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRequestLicense(license)}
                        className={`px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg transition-all duration-200 shadow-sm hover:from-green-600 hover:to-green-700 hover:shadow-md ${!license.is_avaliable ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
                        disabled={!license.is_avaliable}
                      >
                        Request
                      </button>
                      {userInfo?.role === 'admin' && !license.is_avaliable && (
                        <button
                          onClick={() => handleReleaseLicense(license)}
                          className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm"
                        >
                          Release
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