'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  Copy, 
  Check, 
  RefreshCw, 
  Shield, 
  ArrowLeft, 
  AlertCircle, 
  Timer,
  Mail,
  User,
  Zap
} from 'lucide-react';

interface OtpData {
  otp: string;
  from: string;
  subject: string;
  date: string;
  license_id?: string;
}

interface LicenseData {
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
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function OtpPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const licenseId = resolvedParams.id;
  const [otpData, setOtpData] = useState<OtpData | null>(null); 
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch current user info
        const userRes = await fetch(`${API_BASE_URL}/auth`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) throw new Error('Failed to fetch user info');
        const userData = await userRes.json();
        setCurrentUser(userData);

        // Activate the license
        try {
          const activateRes = await fetch(`${API_BASE_URL}/licenses/${licenseId}/activate`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!activateRes.ok) {
            const errorData = await activateRes.json().catch(() => ({}));
            if (activateRes.status !== 400 || !errorData.detail?.includes('already active')) {
              throw new Error(errorData.detail || 'Failed to activate license');
            }
          } else {
            const activateData = await activateRes.json();
            if (activateData.expires_at) {
              const expiresAt = new Date(activateData.expires_at);
              const now = new Date();
              const timeLeftSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
              setTimeLeft(timeLeftSeconds);
            }
          }
        } catch (activateError: any) {
          if (!activateError.message.includes('already active')) {
            throw new Error(`License activation failed: ${activateError.message}`);
          }
        }

        // Fetch License data
        const licenseRes = await fetch(`${API_BASE_URL}/licenses/${licenseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!licenseRes.ok) throw new Error(`License fetch error: ${licenseRes.status}`);
        const licenseJson: LicenseData = await licenseRes.json();
        setLicenseData(licenseJson);

        if (licenseJson.current_user !== userData.user_id) {
          throw new Error('You do not have permission to access this license');
        }

        // Fetch OTP using license_id and licenseData.gmail
        if (licenseJson.gmail) {
          const licenseKey = `license${parseInt(licenseJson.No, 10)}`; // เช่น "01" -> 1 -> "license1"
          const otpRes = await fetch(`${API_BASE_URL}/otp/get?subject_keyword=OTP&license_id=${licenseKey}`);
          if (!otpRes.ok) throw new Error(`OTP fetch error: ${otpRes.status}`);
          const otpJson: OtpData = await otpRes.json();
          setOtpData(otpJson);
        } else {
          throw new Error('License email not found');
        }

        // Calculate time left
        if (licenseJson.expires_at) {
          const expiresAt = new Date(licenseJson.expires_at);
          const now = new Date();
          if (isNaN(expiresAt.getTime()) || isNaN(now.getTime())) {
            console.error('Invalid date format:', { expires_at: licenseJson.expires_at });
            setTimeLeft(0);
          } else {
            const timeLeftSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
            setTimeLeft(timeLeftSeconds);
          }
        } else {
          const defaultTimeLeft = 120 * 60; // 2 hours
          setTimeLeft(defaultTimeLeft);
        }
        
      } catch (err: any) {
        setError(err.message);
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Countdown timer
    const intervalId = setInterval(() => {
      setTimeLeft(prev => (prev <= 0 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [licenseId]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const getTimeStatus = () => {
    if (timeLeft <= 0) return 'expired';
    if (timeLeft <= 900) return 'warning'; // 15 minutes
    if (timeLeft <= 1800) return 'caution'; // 30 minutes
    return 'normal';
  };

  const timeStatus = getTimeStatus();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleExtendTime = async () => {
    if (timeLeft <= 900) {
      setIsExtending(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/licenses/${licenseId}/extend`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to extend license');
        }
        
        const result = await response.json();
        setTimeLeft(120 * 60); // Reset to 2 hours
        alert('License extended successfully!');
        
      } catch (error: any) {
        console.error('Error extending license:', error);
        alert(error.message || 'Failed to extend license');
      } finally {
        setIsExtending(false);
      }
    }
  };

  const handleRefreshOtp = async () => {
    setRefreshing(true);
    try {
      if (!licenseData?.gmail) throw new Error('License email not found');
      const otpRes = await fetch(`${API_BASE_URL}/otp/get?subject_keyword=OTP&license_id=${licenseId}`);
      if (!otpRes.ok) throw new Error(`OTP refresh error: ${otpRes.status}`);
      const otpJson: OtpData = await otpRes.json();
      setOtpData(otpJson);
    } catch (err: any) {
      console.error('Failed to refresh OTP:', err);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFinish = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/licenses/${licenseId}/release`, {
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
      alert(error.message || 'Failed to release license');
      router.push('/licenses');
    }
  };

  const handleGoBack = () => {
    router.push(`/licenses/${licenseId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 text-lg">กำลังโหลด OTP...</p>
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
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleGoBack}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              กลับหน้าก่อนหน้า
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!otpData || !licenseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบข้อมูล</h3>
            <p className="text-gray-600 mb-6">ไม่พบข้อมูล OTP หรือ License</p>
            <button
              onClick={handleGoBack}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              กลับหน้าก่อนหน้า
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            กลับไปรายละเอียด License
          </button>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                    <Shield className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      รหัส OTP
                    </h1>
                    <p className="text-green-100 text-sm">License No. {licenseData.No}</p>
                  </div>
                </div>
                <button
                  onClick={handleRefreshOtp}
                  disabled={refreshing}
                  className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all disabled:opacity-50"
                  title="รีเฟรช OTP"
                >
                  <RefreshCw className={`w-5 h-5 text-black ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <label className="block text-gray-700 text-lg font-semibold mb-4">
                  รหัส OTP ของคุณ
                </label>
                <div className="relative group">
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl p-6 transition-all group-hover:border-blue-300">
                    <div className="text-4xl font-mono font-bold text-gray-900 tracking-wider">
                      {otpData.otp}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(otpData.otp)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    title="คัดลอกรหัส OTP"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-green-600 text-sm mt-2 animate-fade-in">
                    คัดลอกรหัส OTP แล้ว!
                  </p>
                )}
              </div>

              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <Timer className={`w-6 h-6 mr-2 ${
                    timeStatus === 'expired' ? 'text-red-500' :
                    timeStatus === 'warning' ? 'text-red-500' :
                    timeStatus === 'caution' ? 'text-yellow-500' :
                    'text-green-500'
                  }`} />
                  <span className="text-gray-700 text-lg font-medium">เวลาคงเหลือ</span>
                </div>
                
                <div className={`inline-block px-6 py-3 rounded-2xl font-mono text-3xl font-bold transition-all ${
                  timeStatus === 'expired' ? 'bg-red-100 text-red-700 border-2 border-red-200' :
                  timeStatus === 'warning' ? 'bg-red-50 text-red-600 border-2 border-red-200 animate-pulse' :
                  timeStatus === 'caution' ? 'bg-yellow-50 text-yellow-600 border-2 border-yellow-200' :
                  'bg-green-50 text-green-700 border-2 border-green-200'
                }`}>
                  {formattedTime}
                </div>

                {timeStatus === 'warning' && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center text-red-700">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">
                        เวลาใกล้หมดแล้ว! กรุณาต่อเวลาหรือใช้งานให้เสร็จ
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-8 pb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleExtendTime}
                  disabled={timeLeft > 900 || isExtending}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center ${
                    timeLeft > 900
                      ? 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                >
                  {isExtending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      กำลังต่อเวลา...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      ต่อเวลา
                    </>
                  )}
                </button>
                
                <button 
                  onClick={handleFinish}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                >
                  <User className="w-4 h-4 mr-2" />
                  เสร็จสิ้นการใช้งาน
                </button>
              </div>
              
              {timeLeft <= 900 && timeLeft > 0 && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  คุณสามารถต่อเวลาได้เมื่อเหลือเวลาน้อยกว่า 15 นาที
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">คำแนะนำการใช้งาน</p>
                <ul className="space-y-1">
                  <li>• คลิกที่รหัส OTP เพื่อคัดลอกไปใช้งาน</li>
                  <li>• ต่อเวลาได้เมื่อเหลือเวลาน้อยกว่า 15 นาที</li>
                  <li>• กรุณาใช้งานให้เสร็จก่อนหมดเวลา</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}