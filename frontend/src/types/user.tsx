export interface User {
  id: string;
  username: string;
  email?: string;
  role?: string;
}

export interface UserInfo {
  first_name: string;
  last_name: string;
  phone_number: string;
  role?: 'admin' | 'user';
  user_id?: string;
}

export type TimeStatus = 'normal' | 'caution' | 'warning' | 'expired';