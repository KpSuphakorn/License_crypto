import React from 'react';

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-96">
        <div className="text-center mb-6">
          {/* Replace with actual logo if available */}
          <img src="/logo.png" alt="Logo" className="mx-auto h-16 w-auto mb-4" /> 
          <h3 className="text-2xl font-bold text-center text-blue-900">ลงทะเบียนผู้ใช้งานใหม่</h3>
        </div>
        <form>
          <div className="mt-4">
            <div className="mb-4">
              <label className="block text-gray-700" htmlFor="phone">หมายเลขโทรศัพท์</label>
              <input type="text" placeholder="หมายเลขโทรศัพท์" className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-gray-400" id="phone" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700" htmlFor="password">รหัสผ่าน</label>
              <input type="password" placeholder="รหัสผ่าน" className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-gray-400" id="password" />
            </div>
            <div>
              <label className="block text-gray-700" htmlFor="confirm-password">ยืนยันรหัสผ่าน</label>
              <input type="password" placeholder="ยืนยันรหัสผ่าน" className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-gray-400" id="confirm-password" />
            </div>
            <div className="flex items-baseline justify-center mt-6">
              <button className="w-full px-6 py-2 mt-4 text-white bg-blue-800 rounded-lg hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50">ลงทะเบียน</button>
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