'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      const response = await fetch('http://127.0.0.1:5000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
          password,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Registration failed');
      }
      setSuccess('ลงทะเบียนสำเร็จ! กำลังนำไปสู่หน้าเข้าสู่ระบบ...');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-96">
        <div className="text-center mb-6">
          <img src="/CCIB.png" alt="Logo" className="mx-auto h-16 w-auto mb-4" />
          <h3 className="text-2xl font-bold text-center text-blue-900">ลงทะเบียนผู้ใช้งานใหม่</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mt-4">
            <div className="mb-4">
              <label className="block text-gray-700" htmlFor="first_name">ชื่อจริง</label>
              <input
                type="text"
                placeholder="ชื่อจริง"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-gray-400"
                id="first_name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700" htmlFor="last_name">นามสกุล</label>
              <input
                type="text"
                placeholder="นามสกุล"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-gray-400"
                id="last_name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700" htmlFor="phone">หมายเลขโทรศัพท์</label>
              <input
                type="text"
                placeholder="หมายเลขโทรศัพท์"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-gray-400"
                id="phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700" htmlFor="password">รหัสผ่าน</label>
              <input
                type="password"
                placeholder="รหัสผ่าน"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-gray-400"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700" htmlFor="confirm-password">ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                placeholder="ยืนยันรหัสผ่าน"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-gray-400"
                id="confirm-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
            {success && <div className="mt-4 text-green-600 text-center">{success}</div>}
            <div className="flex items-baseline justify-center mt-6">
              <button
                type="submit"
                className="w-full px-6 py-2 mt-4 text-white bg-blue-800 rounded-lg hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                disabled={loading}
              >
                {loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
              </button>
            </div>
            <div className="flex items-baseline justify-center mt-4">
              <a href="/login" className="w-full text-center px-6 py-2 text-blue-800 border border-blue-800 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50">กลับสู่หน้าเข้าสู่ระบบ</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 