'use server'

export default async function getLicense(licenseId: string, token: string) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await fetch(`${API_BASE_URL}/licenses/${licenseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`License fetch error: ${response.status}`);
  }

  return await response.json();
}