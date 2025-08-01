'use server'

export default async function refreshOtp(licenseNo: string) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const licenseKey = `license${parseInt(licenseNo, 10)}`;
  
  const response = await fetch(`${API_BASE_URL}/otp/get?subject_keyword=OTP&license_id=${licenseKey}`);
  
  if (!response.ok) {
    throw new Error(`OTP refresh error: ${response.status}`);
  }
  
  return await response.json();
}