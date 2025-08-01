'use server'

export default async function downloadLogs(filters: {
  start_date: string;
  end_date: string;
  user_id: string;
  license_id: string;
  action: string;
}, token: string) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const queryParams = new URLSearchParams();
  if (filters.start_date) queryParams.append('start_date', filters.start_date);
  if (filters.end_date) queryParams.append('end_date', filters.end_date);
  if (filters.user_id) queryParams.append('user_id', filters.user_id);
  if (filters.license_id) queryParams.append('license_id', filters.license_id);
  if (filters.action) queryParams.append('action', filters.action);
  
  const response = await fetch(`${API_BASE_URL}/usage-logs/download?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to download logs');
  }
  
  return await response.blob();
}