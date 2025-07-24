'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Phone, Lock, User, AlertCircle, CheckCircle, UserPlus, Mail } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [rank, setRank] = useState('');
  const [position, setPosition] = useState('');
  const [division, setDivision] = useState('');
  const [bureau, setBureau] = useState('');
  const [command, setCommand] = useState('');
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    try {
      // Remove formatting from phone number before sending to backend
      const cleanPhoneNumber = phone.replace(/\D/g, '');
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone_number: cleanPhoneNumber,
          email,
          password,
          rank,
          position,
          division,
          bureau,
          command,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Registration failed');
      }
      setIsSuccess(true);
      setSuccess('ลงทะเบียนสำเร็จ! กำลังนำไปสู่หน้าเข้าสู่ระบบ...');
      
      // Add a small delay to show success state
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
              ลงทะเบียน
            </h1>
            <p className="text-gray-600 text-sm">สร้างบัญชีใหม่</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* กลุ่ม 2 คอลัมน์: ชื่อจริง - นามสกุล */}
            <div className="grid grid-cols-2 gap-4">
              {/* First Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  ชื่อจริง
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ชื่อจริง"
                    className={`w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-200 focus:outline-none placeholder:text-gray-400 ${
                      focusedField === 'firstName'
                        ? 'border-blue-500 bg-blue-50/50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                  <User
                    size={20}
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                      focusedField === 'firstName' ? 'text-blue-500' : 'text-gray-400'
                    }`}
                  />
                </div>
              </div>
              {/* Last Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 ">
                  <User size={16} className="text-blue-600" />
                  นามสกุล
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="นามสกุล"
                    className={`w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-200 focus:outline-none placeholder:text-gray-400 ${
                      focusedField === 'lastName'
                        ? 'border-blue-500 bg-blue-50/50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                  <User
                    size={20}
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                      focusedField === 'firstName' ? 'text-blue-500' : 'text-gray-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* กลุ่ม 2 คอลัมน์: ยศ - ตำแหน่ง */}
            <div className="grid grid-cols-2 gap-4">
              {/* Rank Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  ยศ
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ยศ"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none placeholder:text-gray-400 ${
                      focusedField === 'rank'
                        ? 'border-blue-500 bg-blue-50/50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    value={rank}
                    onChange={e => setRank(e.target.value)}
                    onFocus={() => setFocusedField('rank')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>
              </div>
              {/* Position Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  ตำแหน่ง
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ตำแหน่ง"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none placeholder:text-gray-400 ${
                      focusedField === 'position'
                        ? 'border-blue-500 bg-blue-50/50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                    onFocus={() => setFocusedField('position')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* กลุ่ม 2 คอลัมน์: กองกำกับการ - กองบังคับการ */}
            <div className="grid grid-cols-2 gap-4">
              {/* Division Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  กองกำกับการ
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="กองกำกับการ"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none placeholder:text-gray-400 ${
                      focusedField === 'division'
                        ? 'border-blue-500 bg-blue-50/50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    value={division}
                    onChange={e => setDivision(e.target.value)}
                    onFocus={() => setFocusedField('division')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>
              </div>
              {/* Bureau Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  กองบังคับการ
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="กองบังคับการ"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none placeholder:text-gray-400 ${
                      focusedField === 'bureau'
                        ? 'border-blue-500 bg-blue-50/50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    value={bureau}
                    onChange={e => setBureau(e.target.value)}
                    onFocus={() => setFocusedField('bureau')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* กองบัญชาการ (เดี่ยว) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                กองบัญชาการ
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="กองบัญชาการ"
                  className={`w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-200 focus:outline-none placeholder:text-gray-400 ${
                    focusedField === 'command'
                      ? 'border-blue-500 bg-blue-50/50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                  onFocus={() => setFocusedField('command')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <User
                  size={20}
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                    focusedField === 'command' ? 'text-blue-500' : 'text-gray-400'
                  }`}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail size={16} className="text-blue-600" />
                อีเมล
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="อีเมล"
                  className={`w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-200 focus:outline-none placeholder:text-gray-400 ${
                    focusedField === 'email' 
                      ? 'border-blue-500 bg-blue-50/50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <Mail 
                  size={20} 
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                    focusedField === 'email' ? 'text-blue-500' : 'text-gray-400'
                  }`} 
                />
              </div>
            </div>

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
                  onChange={e => setPassword(e.target.value)}
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

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock size={16} className="text-blue-600" />
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pl-12 pr-12 rounded-xl border-2 transition-all duration-200 focus:outline-none placeholder:text-gray-400 ${
                    focusedField === 'confirmPassword' 
                      ? 'border-blue-500 bg-blue-50/50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <Lock 
                  size={20} 
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                    focusedField === 'confirmPassword' ? 'text-blue-500' : 'text-gray-400'
                  }`} 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm animate-in slide-in-from-top-2 duration-300">
                <CheckCircle size={16} />
                {success}
              </div>
            )}

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading || isSuccess}
              className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 transform focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${
                loading || isSuccess
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]'
              } text-white shadow-lg mt-6`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  กำลังลงทะเบียน...
                </div>
              ) : isSuccess ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  ลงทะเบียนสำเร็จ
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <UserPlus size={20} />
                  ลงทะเบียน
                </div>
              )}
            </button>

            {/* Login Link */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">หรือ</span>
              </div>
            </div>

            <Link href="/login" passHref>
              <button 
                type="button" 
                className="w-full py-3 px-6 border-2 border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <User size={20} />
                กลับสู่หน้าเข้าสู่ระบบ
              </button>
            </Link>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              การลงทะเบียนแสดงว่าคุณยอมรับ{' '}
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