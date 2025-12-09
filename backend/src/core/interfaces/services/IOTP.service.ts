export interface IOTPService {
  requestOtp(email: string, role: 'user' | 'admin' | 'communityAdmin'): Promise<string>;
  requestForgotPasswordOtp(email:string, role: 'user' | 'admin' | 'communityAdmin'):Promise<string>
  verifyOtp(email: string, otp: string): Promise<boolean>;
  clearOtp(email: string): Promise<void>;
}