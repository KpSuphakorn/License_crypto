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
  User,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';

interface OtpData {
  otp: string;
  from: string;
  subject: string;
  date: string;
}

interface LicenseData {
  _id: string;
  No: string;
  username: string;
  password: string;
  gmail: string;
  mail_password: string;
  is_avaliable?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function OtpPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const licenseId = resolvedParams.id;
  const [otpData, setOtpData] = useState<OtpData | null>(null); 
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 2 hours in seconds
  const [copied, setCopied] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullOtp, setShowFullOtp] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch OTP data
        const otpRes = await fetch(`${API_BASE_URL}/otp/get?subject_keyword=OTP&from_email=suphakorn850@gmail.com`);
        if (!otpRes.ok) throw new Error(`OTP fetch error: ${otpRes.status}`);
        const otpJson: OtpData = await otpRes.json();
        setOtpData(otpJson);

        // Fetch License data using licenseId
        const token = localStorage.getItem('token');
        const licenseRes = await fetch(`${API_BASE_URL}/licenses/${licenseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!licenseRes.ok) throw new Error(`License fetch error: ${licenseRes.status}`);
        const licenseJson: LicenseData = await licenseRes.json();
        setLicenseData(licenseJson);
      } catch (err: any) {
        setError(err.message);
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const intervalId = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [licenseId]);

  // Add notification effect for time warnings
  useEffect(() => {
    if (timeLeft === 900) { // 15 minutes
      showNotification('⚠️ เหลือเวลา 15 นาที กรุณาเตรียมต่อเวลา!');
      playNotificationSound();
    } else if (timeLeft === 300) { // 5 minutes
      showNotification('🚨 เหลือเวลา 5 นาที เท่านั้น!');
      playNotificationSound();
    } else if (timeLeft === 60) { // 1 minute
      showNotification('⏰ เหลือเวลาอีก 1 นาที!');
      playNotificationSound();
    } else if (timeLeft === 0) {
      showNotification('⏱️ หมดเวลาแล้ว กรุณาต่อเวลาใหม่');
      playNotificationSound();
    }
  }, [timeLeft]);

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

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  const playNotificationSound = () => {
    if (typeof window !== 'undefined') {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAfBzhK3Om95Bf');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors if audio fails
      } catch (e) {
        // Ignore audio errors
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showNotification('✅ คัดลอกรหัส OTP เรียบร้อยแล้ว!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showNotification('❌ ไม่สามารถคัดลอกได้ กรุณาลองใหม่');
    }
  };

  const handleExtendTime = async () => {
    if (timeLeft <= 900) {
      setIsExtending(true);
      showNotification('🔄 กำลังต่อเวลา...');
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTimeLeft(120 * 60); // Reset to 2 hours
      setIsExtending(false);
      showNotification('✅ ต่อเวลาเรียบร้อยแล้ว! เพิ่มเวลา 2 ชั่วโมง');
      playNotificationSound();
    }
  };

  const handleRefreshOtp = async () => {
    setRefreshing(true);
    showNotification('🔄 กำลังรีเฟรช OTP...');
    try {
      const otpRes = await fetch(`${API_BASE_URL}/otp/get?subject_keyword=OTP&from_email=suphakorn850@gmail.com`);
      if (!otpRes.ok) throw new Error(`OTP refresh error: ${otpRes.status}`);
      const otpJson: OtpData = await otpRes.json();
      setOtpData(otpJson);
      showNotification('✅ รีเฟรช OTP เรียบร้อยแล้ว!');
    } catch (err: any) {
      console.error('Failed to refresh OTP:', err);
      showNotification('❌ ไม่สามารถรีเฟรช OTP ได้');
    } finally {
      setRefreshing(false);
    }
  };

  const handleFinish = () => {
    router.push('/licenses');
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
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border-l-4 border-blue-500 p-4 max-w-sm animate-slide-in">
          <div className="flex items-center">
            <div className="text-sm text-gray-700">{notification}</div>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            กลับไปหน้ารายละเอียด License
          </button>
        </div>

        <div className="max-w-lg mx-auto">
          {/* Main OTP Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 px-8 py-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    รหัส OTP
                  </h1>
                  <p className="text-green-100 text-sm">License No. {licenseData.No}</p>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8">
              {/* OTP Display */}
              <div className="text-center mb-8">
                <label className="block text-gray-700 text-lg font-semibold mb-4">
                  รหัส OTP ของคุณ
                </label>
                <div className="relative group">
                  <div 
                    className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl p-6 transition-all group-hover:border-blue-300 cursor-pointer hover:shadow-lg"
                    onClick={() => copyToClipboard(otpData.otp)}
                  >
                    <div className="text-4xl font-mono font-bold text-gray-900 tracking-wider select-all">
                      {showFullOtp ? otpData.otp : otpData.otp.replace(/./g, '●')}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFullOtp(!showFullOtp);
                      }}
                      className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all opacity-0 group-hover:opacity-100"
                      title={showFullOtp ? 'ซ่อนรหัส OTP' : 'แสดงรหัส OTP'}
                    >
                      {showFullOtp ? (
                        <EyeOff className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(otpData.otp)}
                      className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all opacity-0 group-hover:opacity-100"
                      title="คัดลอกรหัส OTP"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                {copied && (
                  <p className="text-green-600 text-sm mt-2 animate-fade-in">
                    คัดลอกรหัส OTP แล้ว!
                  </p>
                )}
              </div>

              {/* Timer Section */}
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

                {/* Progress Bar */}
                <div className="mt-4 w-full max-w-md mx-auto">
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        timeStatus === 'expired' ? 'bg-red-500' :
                        timeStatus === 'warning' ? 'bg-red-500' :
                        timeStatus === 'caution' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${(timeLeft / (120 * 60)) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0 นาที</span>
                    <span>120 นาที</span>
                  </div>
                </div>

                {timeStatus === 'warning' && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 animate-pulse">
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

            {/* Action Buttons */}
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

          {/* Usage Tips */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">คำแนะนำการใช้งาน</p>
                <ul className="space-y-1">
                  <li>• คลิกที่รหัส OTP เพื่อคัดลอกไปใช้งาน</li>
                  <li>• ใช้ปุ่มแสดง/ซ่อนเพื่อความปลอดภัย</li>
                  <li>• ต่อเวลาได้เมื่อเหลือเวลาน้อยกว่า 15 นาที</li>
                  <li>• ระบบจะแจ้งเตือนเมื่อเวลาใกล้หมด</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => copyToClipboard(otpData.otp)}
              className="flex items-center justify-center p-3 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <Copy className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-600 font-medium">คัดลอก OTP</span>
            </button>
            <button
              onClick={handleRefreshOtp}
              disabled={refreshing}
              className="flex items-center justify-center p-3 bg-white border-2 border-green-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-green-600 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm text-green-600 font-medium">รีเฟรช</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}