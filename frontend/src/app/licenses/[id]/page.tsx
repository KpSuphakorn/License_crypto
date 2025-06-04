import React from 'react';
import Link from 'next/link';

export default function LicenseDetailsPage({
  params,
}: { params: { id: string } }) {
  const licenseId = params.id;

  // Placeholder data - replace with actual data fetching based on licenseId
  const licenseDetails = {
    id: licenseId,
    username: 'uoinueoiwnfingaoirbnbg lkvvnio13ndf',
    password: '1234567890',
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-96">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-center text-blue-900">No. {licenseDetails.id}</h3>
        </div>
        <div className="mt-4">
          <div className="mb-4">
            <label className="block text-gray-700">ชื่อผู้ใช้</label>
            <p className="w-full px-4 py-2 mt-2 border rounded-md bg-gray-50 text-gray-900">
              {licenseDetails.username}
            </p>
          </div>
          <div>
            <label className="block text-gray-700">รหัสผ่าน</label>
            <p className="w-full px-4 py-2 mt-2 border rounded-md bg-gray-50 text-gray-900">
              {licenseDetails.password}
            </p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <button className="px-6 py-2 text-blue-800 border border-blue-800 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50">
              ยกเลิก
            </button>
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