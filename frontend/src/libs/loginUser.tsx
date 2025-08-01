'use server'

export default async function loginUser(phone_number: string, password: string) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number, password }),
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Login failed');
  }
  
  return await response.json();
}