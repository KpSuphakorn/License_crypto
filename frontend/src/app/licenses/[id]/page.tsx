'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LicenseDetails {
  _id: string;
  No: string;
  username: string;
  password: string; // This is the API's 'password' field, not necessarily the one displayed
  gmail: string;
  mail_password: string;
  is_avaliable?: boolean;
}

export default function LicenseDetailsPage({
  params,
}: { params: { id: string } }) {
  const licenseId = params.id;

  const router = useRouter();

  const [licenseDetails, setLicenseDetails] = useState<LicenseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLicenseDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://127.0.0.1:5000/licenses/${licenseId}`, {
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
  }, [licenseId]); // Re-run effect if licenseId changes

  const handleGoBack = () => {
    router.push('/licenses'); // Navigate to the licenses page
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-700">Loading license details...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">Error loading license details: {error}</div>;
  }

  if (!licenseDetails) {
    return <div className="flex items-center justify-center min-h-screen text-gray-700">License details not found.</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-96">
        <div className="text-center mb-6">
          {/* Displaying 'No' field if available, otherwise just the ID */}
          <h3 className="text-2xl font-bold text-center text-blue-900">No. {licenseDetails.No || licenseDetails._id}</h3>
        </div>
        <div className="mt-4">
          <div className="mb-4">
            <label className="block text-gray-700">ชื่อผู้ใช้</label>
            {/* Displaying gmail as username */}
            <p className="w-full px-4 py-2 mt-2 border rounded-md bg-gray-50 text-gray-900">
              {licenseDetails.gmail}
            </p>
          </div>
          <div>
            <label className="block text-gray-700">รหัสผ่าน</label>
            {/* Displaying mail_password as password */}
            <p className="w-full px-4 py-2 mt-2 border rounded-md bg-gray-50 text-gray-900">
              {licenseDetails.mail_password}
            </p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <button
              className="px-6 py-2 text-blue-800 border border-blue-800 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
              onClick={handleGoBack}
            >
              ยกเลิก
            </button>
            {/* Link to the OTP page */}
            <Link href={`/licenses/${licenseId}/otp`} passHref>
              <button className="px-6 py-2 text-white bg-blue-800 rounded-lg hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50">
                รับ OTP
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 