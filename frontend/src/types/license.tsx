export interface License {
  _id: string;
  No: string;
  username: string;
  password?: string;
  gmail: string;
  mail_password?: string;
  is_available?: boolean;
  current_user?: string;
  current_user_name?: string;
  assigned_at?: string;
  expires_at?: string;
  reserved_by?: string;
  reserved_by_name?: string;
  reserved_at?: string;
  queue_count?: number;
  last_activity?: string;
}

export interface LicenseData {
  _id: string;
  No: string;
  username: string;
  password: string;
  gmail: string;
  mail_password: string;
  is_available?: boolean;
  current_user?: string;
  current_user_name?: string;
  assigned_at?: string;
  expires_at?: string;
}

export interface LicenseDetails {
  _id: string;
  No: string;
  username: string;
  password: string;
  gmail: string;
  mail_password: string;
  is_available?: boolean;
  current_user?: string;
  current_user_name?: string;
  assigned_at?: string;
  expires_at?: string;
  reserved_by?: string;
  reserved_by_name?: string;
  reserved_at?: string;
}