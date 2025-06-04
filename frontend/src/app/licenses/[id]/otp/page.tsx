'use client';

import React, { useEffect, useState } from 'react';

export default function OtpPage({
  params,
}: { params: { id: string } }) {
  const licenseId = params.id;

  // Placeholder OTP data and countdown logic
  const [otp, setOtp] = useState('Replace with actual OTP fetching'); // Replace with actual OTP fetching
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 2 hours in seconds

  useEffect(() => {
    // Exit early when we reach 0
    if (!timeLeft) return;

    // Save intervalId to clear on unmount
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    // Clear interval on re-render or unmount
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;


  const handleExtendTime = () => {
    if (timeLeft <= 900){
        setTimeLeft(120 * 60);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-96">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-center text-blue-900">No. {licenseId}</h3>
        </div>
        <div className="mt-4 text-center">
          <label className="block text-gray-700 text-xl font-semibold mb-2">รับ OTP</label>
          <p className="w-full px-4 py-2 mt-2 border rounded-md bg-gray-50 text-gray-900 text-lg font-mono">
            {otp}
          </p>
          <div className="mt-4">
            <p className="text-gray-600">เวลาคงเหลือ:</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{formattedTime}</p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
          <button
            onClick={handleExtendTime}
            disabled={timeLeft > 900}
            className={`px-6 py-2 rounded-lg border focus:outline-none focus:ring-2 
                ${timeLeft > 900
                ? 'text-gray-400 border-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-blue-800 border-blue-800 hover:bg-blue-50 focus:ring-blue-600 focus:ring-opacity-50'}`}
                >
            ต่อเวลา
          </button>
            <button className="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50">
              เสร็จสิ้นการใช้งาน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 