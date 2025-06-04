import React from 'react';
import Link from 'next/link'; // Import Link

// Placeholder data for licenses
const licenses = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  user: 'uoinueoiwnfingaoirbnbg lkvvnio13ndf',
  status: 'พร้อมใช้งาน', // Assuming 'Ready to use' status
}));

export default function LicensesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white-900">HOME</h1> {/* Based on the design */}
        {/* Placeholder for user info and logout - will implement later */}
        <div className="flex items-center space-x-4">
          <span className="text-white-700">สมชาย เรื่องแสง</span>
          <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">ออกจากระบบ</button> {/* Assuming this is logout */}
        </div>
      </header>

      <div className="flex flex-col gap-4 max-w-6xl mx-auto">
        {licenses.map((license) => (
          <Link key={license.id} href={`/licenses/${license.id}`} passHref> {/* Wrap card in Link */}
            <div className="bg-white shadow-sm rounded-lg p-4 flex items-center justify-between cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
              <div>
                <p className="text-sm text-gray-600">No. {license.id}</p>
                <p className="text-lg font-semibold text-gray-900">User</p>
                <p className="text-gray-700">{license.user}</p>
              </div>
              <span className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-200 rounded-full">
                {license.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 