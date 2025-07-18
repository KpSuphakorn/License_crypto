'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Copy, Check, ArrowLeft, Mail, Key, Shield, User, RefreshCw } from 'lucide-react';

interface LicenseDetails {
  _id: string;
  No: string;
  username: string;
  password: string;
  gmail: string;
  mail_password: string;
  is_available?: boolean;
  current_user?: string;
  current_user_name?: string;
  assigned_at?: string;
  expires_at?: string;
  reserved_by?: string;
  reserved_by_name?: string;
  reserved_at?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LicenseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: licenseId } = React.use(params);
  const router = useRouter();

  const [licenseDetails, setLicenseDetails] = useState<LicenseDetails | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);

  useEffect(() => {
    const fetchLicenseDetails = async (retryCount = 0) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          return;
        }

        // First, get current user info
        const userRes = await fetch(`${API_BASE_URL}/auth`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log('Auth response status:', userRes.status);
        
        if (!userRes.ok) {
          console.error('Auth request failed:', {
            status: userRes.status,
            statusText: userRes.statusText
          });
          throw new Error('Failed to fetch user info');
        }
        
        const userData = await userRes.json();
        console.log('User data received:', userData);
        
        if (!userData || !userData.user_id) {
          console.error('Invalid user data received:', userData);
          throw new Error('Invalid user data received from server');
        }
        
        setCurrentUser(userData);

        // Then get license details
        const response = await fetch(`${API_BASE_URL}/licenses/${licenseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: LicenseDetails = await response.json();
        
        // Check if user has permission to access this license
        const isAdmin = userData.role === 'admin';
        const isCurrentUser = data.current_user === userData.user_id;
        const isReservedByUser = data.reserved_by === userData.user_id;
        const isAvailable = data.is_available;
        
        console.log('Permission check:', {
          isAdmin,
          isCurrentUser,
          isReservedByUser,
          isAvailable,
          userRole: userData.role,
          userId: userData.user_id,
          licenseCurrentUser: data.current_user,
          licenseReservedBy: data.reserved_by,
          licenseAvailable: data.is_available,
          userIdType: typeof userData.user_id,
          licenseCurrentUserType: typeof data.current_user,
          exactMatch: userData.user_id === data.current_user,
          strictMatch: userData.user_id === data.current_user && typeof userData.user_id === typeof data.current_user,
          retryCount
        });
        
        // Allow access if:
        // 1. User is admin
        // 2. User is the current user of this license (license is active)
        // 3. User has reserved this license (license is reserved but not active)
        // 4. License is available (anyone can view available licenses)
        if (!isAdmin && !isCurrentUser && !isReservedByUser && !isAvailable) {
          // If this is the first attempt and we came from a request, retry once after a short delay
          if (retryCount < 2 && window.location.search.includes('fromRequest=true')) {
            console.log('Retrying license fetch after delay...');
            setTimeout(() => fetchLicenseDetails(retryCount + 1), 1000);
            return;
          }
          
          console.error('Access denied. Permission check failed:', {
            isAdmin,
            isCurrentUser,
            isReservedByUser,
            isAvailable,
            condition1: !isAdmin,
            condition2: !isCurrentUser,
            condition3: !isReservedByUser,
            condition4: !isAvailable,
            finalResult: !isAdmin && !isCurrentUser && !isReservedByUser && !isAvailable
          });
          setError('You do not have permission to access this license. Please request it first.');
          return;
        }
        
        setLicenseDetails(data);
      } catch (err: any) {
        setError(err.message);
        console.error(`Failed to fetch license details for ID ${licenseId}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchLicenseDetails();
  }, [licenseId]);

  const handleGoBack = () => {
    router.push('/licenses');
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleReleaseLicense = async () => {
    if (!licenseDetails) return;
    
    setIsReleasing(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/licenses/${licenseDetails._id}/release`, {
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
      
      alert('License released successfully!');
      router.push('/licenses');
      
    } catch (error: any) {
      console.error('Error releasing license:', error);
      alert(error.message || 'An error occurred while releasing the license. Please try again.');
    } finally {
      setIsReleasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 text-lg">กำลังโหลดข้อมูล License...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleGoBack}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              กลับไปหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!licenseDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบข้อมูล</h3>
            <p className="text-gray-600 mb-6">ไม่พบรายละเอียด License ที่คุณต้องการ</p>
            <button
              onClick={handleGoBack}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              กลับไปหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            กลับไปหน้า License
          </button>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* License Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    License หมายเลข {licenseDetails.No || licenseDetails._id}
                  </h1>
                  <p className="text-blue-100 text-sm">รายละเอียดการเข้าถึง</p>
                </div>
              </div>
              {licenseDetails.is_available !== undefined && (
                <div className="mt-4 flex items-center space-x-3">
                  {/* Show status based on license state */}
                  {licenseDetails.is_available ? (
                    licenseDetails.reserved_by === currentUser?.user_id ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 bg-opacity-80">
                        Reserved by You
                      </span>
                    ) : licenseDetails.reserved_by ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 bg-opacity-80">
                        Reserved
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 bg-opacity-80">
                        Available
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 bg-opacity-80">
                      In Use
                    </span>
                  )}
                  
                  {/* Show reservation info if reserved but not active */}
                  {licenseDetails.is_available && licenseDetails.reserved_by_name && (
                    <span className="text-sm text-blue-100">
                      Reserved by: {licenseDetails.reserved_by_name}
                    </span>
                  )}
                  
                  {/* Show active user info if in use */}
                  {!licenseDetails.is_available && licenseDetails.current_user_name && (
                    <span className="text-sm text-blue-100">
                      Currently used by: {licenseDetails.current_user_name}
                    </span>
                  )}
                  
                  {/* Show expiration time only if license is actually in use */}
                  {!licenseDetails.is_available && licenseDetails.expires_at && (
                    <span className="text-sm text-blue-100">
                      Expires: {new Date(licenseDetails.expires_at).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-8 space-y-6">
              {/* Email Field */}
              <div className="group">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  ชื่อผู้ใช้ (อีเมล)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={licenseDetails.gmail}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={() => copyToClipboard(licenseDetails.gmail, 'email')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md hover:bg-gray-200 transition-colors"
                    title="คัดลอก"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <Key className="w-4 h-4 mr-2 text-gray-400" />
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={licenseDetails.mail_password}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-20"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 rounded-md hover:bg-gray-200 transition-colors"
                      title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(licenseDetails.mail_password, 'password')}
                      className="p-1 rounded-md hover:bg-gray-200 transition-colors"
                      title="คัดลอก"
                    >
                      {copiedField === 'password' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <User className="w-3 h-3 text-blue-600" />
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">คำแนะนำการใช้งาน</p>
                    <p>คุณสามารถคัดลอกข้อมูลการเข้าสู่ระบบได้โดยคลิกที่ไอคอนคัดลอก และสามารถรับ OTP เพื่อความปลอดภัยเพิ่มเติม</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-8 pb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGoBack}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                >
                  Back
                </button>
                
                {/* Show release button if user owns this license and it's active */}
                {!licenseDetails.is_available && licenseDetails.current_user === currentUser?.user_id && (
                  <button
                    onClick={handleReleaseLicense}
                    disabled={isReleasing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isReleasing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Releasing...</span>
                      </>
                    ) : (
                      <span>Release License</span>
                    )}
                  </button>
                )}
                
                {/* Show OTP button if user has reserved this license (starts the timer) */}
                {licenseDetails.is_available && licenseDetails.reserved_by === currentUser?.user_id && (
                  <Link href={`/licenses/${licenseId}/otp`} className="flex-1">
                    <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      Get OTP & Activate License
                    </button>
                  </Link>
                )}
                
                {/* Show OTP button if user owns active license */}
                {!licenseDetails.is_available && licenseDetails.current_user === currentUser?.user_id && (
                  <Link href={`/licenses/${licenseId}/otp`} className="flex-1">
                    <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      Get OTP
                    </button>
                  </Link>
                )}
                
                {/* If license is available and not reserved by user */}
                {licenseDetails.is_available && licenseDetails.reserved_by !== currentUser?.user_id && (
                  <div className="flex-1 px-6 py-3 bg-gray-100 text-gray-500 rounded-xl text-center font-medium">
                    {licenseDetails.reserved_by ? 'Reserved by another user' : 'License not reserved by you'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">ข้อควรระวัง</p>
                <p>กรุณาเก็บรักษาข้อมูลการเข้าสู่ระบบให้ปลอดภัย และไม่แบ่งปันกับผู้อื่น</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}