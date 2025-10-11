export interface IMailService {
  /**
   * Send a general email with subject and HTML content.
   * @param to - Recipient email address
   * @param subject - Email subject line
   * @param html - HTML email body
   */
  sendMail(to: string, subject: string, html: string): Promise<void>;

  /**
   * Send an OTP email for registration or password reset.
   * @param email - Recipient email
   * @param otp - One-time password
   * @param type - Purpose of OTP ('registration' | 'forgotPassword')
   */
  sendOTP(
    email: string,
    otp: string,
    type?: "registration" | "forgotPassword"
  ): Promise<void>;

  /**
   * Send a welcome email to a newly approved community admin.
   * @param email - Recipient email
   * @param name - Recipient name
   */
  sendWelcomeEmail(email: string, name: string): Promise<void>;
}
