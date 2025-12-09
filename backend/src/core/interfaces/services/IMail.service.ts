export interface IMailService {
  sendOtp(email: string, otp: string, type: 'verification' | 'forgotPassword'): Promise<void>;
//   sendMail(to: string, subject: string, html: string): Promise<void>;
  sendCommunityApprovalEmail(email: string, communityName: string): Promise<void>;
  sendCommunityRejectionEmail(email: string, communityName: string, reason: string): Promise<void>;
  sendPasswordResetConfirmation(email: string): Promise<void>;
}