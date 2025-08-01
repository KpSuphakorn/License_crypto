'use server'

export default async function activateLicense(licenseId: string, token: string) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await fetch(`${API_BASE_URL}/licenses/${licenseId}/activate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status !== 400 || !errorData.detail?.includes('already active')) {
      throw new Error(errorData.detail || 'Failed to activate license');
    }
  }

  return await response.json();
}