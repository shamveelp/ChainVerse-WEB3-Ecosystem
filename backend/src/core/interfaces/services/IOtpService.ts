export interface IOTPService {
  requestOtp(email: string): Promise<string>;
  requestForgotPasswordOtp(email:string):Promise<string>
  verifyOtp(email: string, otp: string): Promise<boolean>;
}