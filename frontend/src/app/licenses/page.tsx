'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface License {
  _id: string;
  No: string;
  username: string;
  password?: string; // Password might not be needed on this list page
  gmail: string;
  mail_password?: string;
  is_avaliable?: boolean; // Assuming this field exists
}

// Placeholder data for licenses
// const licenses = Array.from({ length: 12 }, (_, i) => ({
//   id: i + 1,
//   user: 'uoinueoiwnfingaoirbnbg lkvvnio13ndf',
//   status: 'พร้อมใช้งาน', // Assuming 'Ready to use' status
// }));

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/licenses'); // Fetch from your backend
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setLicenses(data.users); // Assuming the list is in the 'users' key
      } catch (err: any) {
        setError(err.message);
        console.error("Failed to fetch licenses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLicenses();
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return <div className="text-center text-gray-700">Loading licenses...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Error loading licenses: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">HOME (login)</h1> {/* Based on the design */}
        {/* Placeholder for user info and logout - will implement later */}
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">สมชาย</span> {/* Replace with actual user info */}
          <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">เรื่องแสง</button> {/* Assuming this is logout */}
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">ออกอากาศระบบ</button> {/* Assuming this is another action */}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {licenses.map((license) => (
          // Use license._id for the link since it's unique
          <Link key={license._id} href={`/licenses/${license._id}`} passHref>
            <div className="bg-white shadow-sm rounded-lg p-4 flex items-center justify-between cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
              <div>
                {/* Displaying 'No' and 'username' as per your design */}
                <p className="text-sm text-gray-600">No. {license.No}</p>
                <p className="text-lg font-semibold text-gray-900">User</p>
                <p className="text-gray-700">{license.username}</p>
              </div>
              {/* Displaying availability status */}
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                license.is_avaliable === true
                  ? 'text-green-800 bg-green-200'
                  : 'text-red-800 bg-red-200' // Assuming not available is represented differently
              }`}>
                {license.is_avaliable === true ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 