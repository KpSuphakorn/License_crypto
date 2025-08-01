'use server'

export default async function getOtp(licenseNo: string, subjectKeyword: string = 'Your one-time security code') {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const numericNo = parseInt(licenseNo, 10);
  const licenseKey = `license${numericNo}`;
  
  const response = await fetch(`${API_BASE_URL}/otp/get?subject_keyword=${subjectKeyword}&license_id=${licenseKey}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OTP fetch error: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}