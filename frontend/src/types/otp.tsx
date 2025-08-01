export interface OtpData {
  message: any;
  otp: string;
  from: string;
  subject: string;
  date: string;
  license_id?: string;
}