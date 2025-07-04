'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Phone, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Remove formatting from phone number before sending to backend
      const cleanPhoneNumber = phone.replace(/\D/g, '');
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: cleanPhoneNumber, password }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Login failed');
      }
      
      const data = await response.json();
      // Note: In production, use secure storage instead of localStorage
      localStorage.setItem('token', data.access_token);
      setIsSuccess(true);
      
      // Add a small delay to show success state
      setTimeout(() => {
        router.push('/licenses');
      }, 1000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as Thai phone number (XXX-XXX-XXXX)
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-white/20">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl mx-auto flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                <img src="/CCIB.png" alt="Logo" className="w-12 h-12 object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent mb-2">
              เข้าสู่ระบบ
            </h1>
            <p className="text-gray-600 text-sm">ยินดีต้อนรับกลับมา</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone size={16} className="text-blue-600" />
                หมายเลขโทรศัพท์
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="0XXXXXXXXX"
                  className={`w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-200 focus:outline-none placeholder:text-gray-400 ${
                    focusedField === 'phone' 
                      ? 'border-blue-500 bg-blue-50/50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  value={phone}
                  onChange={handlePhoneChange}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  maxLength={12}
                  required
                />
                <Phone 
                  size={20} 
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                    focusedField === 'phone' ? 'text-blue-500' : 'text-gray-400'
                  }`} 
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock size={16} className="text-blue-600" />
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pl-12 pr-12 rounded-xl border-2 transition-all duration-200 focus:outline-none placeholder:text-gray-400 ${
                    focusedField === 'password' 
                      ? 'border-blue-500 bg-blue-50/50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <Lock 
                  size={20} 
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                    focusedField === 'password' ? 'text-blue-500' : 'text-gray-400'
                  }`} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-in slide-in-from-top-2 duration-300">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Success Message */}
            {isSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm animate-in slide-in-from-top-2 duration-300">
                <CheckCircle size={16} />
                เข้าสู่ระบบสำเร็จ กำลังเปลี่ยนหน้า...
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || isSuccess}
              className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 transform focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${
                loading || isSuccess
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]'
              } text-white shadow-lg`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  กำลังเข้าสู่ระบบ...
                </div>
              ) : isSuccess ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  เข้าสู่ระบบสำเร็จ
                </div>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>

            {/* Register Link */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">หรือ</span>
              </div>
            </div>

            <Link href="/register" passHref>
              <button 
                type="button" 
                className="w-full py-3 px-6 border-2 border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <User size={20} />
                สร้างบัญชีใหม่
              </button>
            </Link>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              การเข้าสู่ระบบแสดงว่าคุณยอมรับ{' '}
              <a href="#" className="text-blue-600 hover:underline">ข้อกำหนดการใช้งาน</a>
              {' '}และ{' '}
              <a href="#" className="text-blue-600 hover:underline">นโยบายความเป็นส่วนตัว</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}