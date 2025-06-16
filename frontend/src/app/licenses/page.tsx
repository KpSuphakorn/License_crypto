'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface License {
  _id: string;
  No: string;
  username: string;
  password?: string; // Password might not be needed on this list page
  gmail: string;
  mail_password?: string;
  is_avaliable?: boolean; // Assuming this field exists
}

interface UserInfo {
  first_name: string;
  last_name: string;
  phone_number: string;
}

// Placeholder data for licenses
// const licenses = Array.from({ length: 12 }, (_, i) => ({
//   id: i + 1,
//   user: 'uoinueoiwnfingaoirbnbg lkvvnio13ndf',
//   status: 'พร้อมใช้งาน', // Assuming 'Ready to use' status
// }));

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        const response = await fetch('http://127.0.0.1:5000/auth', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch user info');
        const data = await response.json();
        setUserInfo(data);
      } catch (err: any) {
        setUserInfo(null);
      }
    };
    fetchUserInfo();
  }, []);

  // Fetch licenses
  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/licenses');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setLicenses(data.licensess);
      } catch (err: any) {
        setError(err.message);
        console.error("Failed to fetch licenses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLicenses();
  }, []);

  // Logout handler
  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetch('http://127.0.0.1:5000/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      localStorage.removeItem('token');
    }
    router.push('/login');
  };

  if (loading) {
    return <div className="text-center text-gray-700">Loading licenses...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Error loading licenses: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white-900">HOME</h1>
        <div className="flex items-center space-x-4">
          <span className="text-white-700">
            {userInfo ? `${userInfo.first_name} - ${userInfo.last_name}` : '(ไม่พบข้อมูลผู้ใช้)'}
          </span>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            onClick={handleLogout}
          >
            ออกจากระบบ
          </button>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(licenses) && licenses.map((license) =>
          license.is_avaliable ? (
            <Link key={license._id} href={`/licenses/${license._id}`} passHref>
              <div className="bg-white shadow-sm rounded-lg p-4 flex items-center justify-between cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                <div>
                  <p className="text-sm text-gray-600">No. {license.No}</p>
                  <p className="text-lg font-semibold text-gray-900">User</p>
                  <p className="text-gray-700">{license.username}</p>
                </div>
                <span className="px-3 py-1 text-sm font-semibold rounded-full text-green-800 bg-green-200">
                  พร้อมใช้งาน
                </span>
              </div>
            </Link>
          ) : (
            <div
              key={license._id}
              className="bg-white shadow-sm rounded-lg p-4 flex items-center justify-between opacity-60 cursor-not-allowed"
              title="ไม่สามารถใช้งานได้ในขณะนี้"
            >
              <div>
                <p className="text-sm text-gray-600">No. {license.No}</p>
                <p className="text-lg font-semibold text-gray-900">User</p>
                <p className="text-gray-700">{license.username}</p>
              </div>
              <span className="px-3 py-1 text-sm font-semibold rounded-full text-red-800 bg-red-200">
                ไม่พร้อมใช้งาน
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
} 