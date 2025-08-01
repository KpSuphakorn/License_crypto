'use server'

export default async function getLicenses() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await fetch(`${API_BASE_URL}/licenses`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch licenses: ${response.status}`);
  }
  
  const data = await response.json();
  return data.licensess || [];
}