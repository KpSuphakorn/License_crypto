'use client';

import { useEffect, useState } from 'react';

interface OtpData {
  otp: string;
  from: string;
  subject: string;
  date: string;
}

interface LicenseData {
  _id: string;
  No: string;
  username: string;
  password: string;
  gmail: string;
  mail_password: string;
  is_avaliable?: boolean;
}

export default function OtpPage({ params }: { params: { id: string } }) {
  const [otpData, setOtpData] = useState<OtpData | null>(null);
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 2 hours in seconds

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch OTP data
        const otpRes = await fetch('http://127.0.0.1:5000/otp/get');
        if (!otpRes.ok) throw new Error(`OTP fetch error: ${otpRes.status}`);
        const otpJson: OtpData = await otpRes.json();
        setOtpData(otpJson);

        // Fetch License data using params.id
        const licenseRes = await fetch(`http://127.0.0.1:5000/licenses/${params.id}`);
        if (!licenseRes.ok) throw new Error(`License fetch error: ${licenseRes.status}`);
        const licenseJson: LicenseData = await licenseRes.json();
        setLicenseData(licenseJson);
      } catch (err: any) {
        setError(err.message);
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const intervalId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [params.id]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-700">กำลังโหลด OTP...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">เกิดข้อผิดพลาด: {error}</div>;
  }

  if (!otpData || !licenseData) {
    return <div className="flex items-center justify-center min-h-screen text-gray-700">ไม่พบข้อมูล OTP หรือ License</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-96">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-center text-blue-900">No. {licenseData.No}</h3>
        </div>
        <div className="mt-4 text-center">
          <label className="block text-gray-700 text-xl font-semibold mb-2">รับ OTP</label>
          <p className="w-full px-4 py-2 mt-2 border rounded-md bg-gray-50 text-gray-900 text-lg font-mono">
            {otpData.otp}
          </p>
          <div className="mt-4">
            <p className="text-gray-600">เวลาคงเหลือ:</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{formattedTime}</p>
          </div>
          <div className="flex items-baseline justify-between mt-6">
            <button className="px-6 py-2 text-blue-800 border border-blue-800 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50">
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
