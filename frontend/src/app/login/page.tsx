'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, password }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Login failed');
      }
      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      router.push('/licenses');
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
          {/* Use custom logo */}
          <img src="/CCIB.png" alt="Logo" className="mx-auto h-16 w-auto mb-4" /> 
          <h3 className="text-2xl font-bold text-center text-blue-900">เข้าสู่ระบบ</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mt-4">
            <div>
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
            <div className="mt-4">
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
            {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
            <div className="flex items-baseline justify-center mt-6">
              <button
                type="submit"
                className="w-full px-6 py-2 mt-4 text-white bg-blue-800 rounded-lg hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                disabled={loading}
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </div>
            <div className="flex items-baseline justify-center mt-4">
              <Link href="/register" passHref>
                <button type="button" className="w-full px-6 py-2 text-blue-800 border border-blue-800 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50">ลงทะเบียน</button>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 