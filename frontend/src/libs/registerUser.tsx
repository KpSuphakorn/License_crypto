'use server'

export default async function registerUser(userData: {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  password: string;
  rank: string;
  position: string;
  division: string;
  bureau: string;
  command: string;
}) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Registration failed');
  }

  return await response.json();
}