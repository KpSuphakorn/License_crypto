'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Copy, Check, ArrowLeft, Mail, Key, Shield, User } from 'lucide-react';

interface LicenseDetails {
  _id: string;
  No: string;
  username: string;
  password: string;
  gmail: string;
  mail_password: string;
  is_avaliable?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LicenseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: licenseId } = React.use(params);
  const router = useRouter();

  const [licenseDetails, setLicenseDetails] = useState<LicenseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const fetchLicenseDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/licenses/${licenseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: LicenseDetails = await response.json();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 text-lg">กำลังโหลดข้อมูลใบอนุญาต...</p>
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
            <p className="text-gray-600 mb-6">ไม่พบรายละเอียดใบอนุญาตที่คุณต้องการ</p>
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
            กลับไปหน้าใบอนุญาต
          </button>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* License Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    ใบอนุญาตหมายเลข {licenseDetails.No || licenseDetails._id}
                  </h1>
                  <p className="text-blue-100 text-sm">รายละเอียดการเข้าถึง</p>
                </div>
              </div>
              {licenseDetails.is_avaliable !== undefined && (
                <div className="mt-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    licenseDetails.is_avaliable 
                      ? 'bg-green-100 text-green-800 bg-opacity-80' 
                      : 'bg-red-100 text-red-800 bg-opacity-80'
                  }`}>
                    {licenseDetails.is_avaliable ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน'}
                  </span>
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
                  ยกเลิก
                </button>
                <Link href={`/licenses/${licenseId}/otp`} className="flex-1">
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    รับ OTP
                  </button>
                </Link>
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