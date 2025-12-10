import { injectable } from "inversify";
import { IMailService } from "./ITempMail";
import { MailUtil } from "../utils/mail.util";
import logger from "../utils/logger";
import { ErrorMessages, LoggerMessages, SuccessMessages } from "../enums/messages.enum";

@injectable()
export class MailService implements IMailService {
  private mailUtil: MailUtil;

  constructor() {
    this.mailUtil = new MailUtil();
  }

  /**
   * Sends a general email.
   * @param {string} to - The recipient's email address.
   * @param {string} subject - The subject of the email.
   * @param {string} html - The HTML content of the email.
   * @returns {Promise<void>}
   * @throws {Error} If sending the email fails.
   */
  async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.mailUtil.send(to, subject, html);
      logger.info(`${SuccessMessages.MESSAGE_SENT} to: ${to}`);
    } catch (error) {
      logger.error(LoggerMessages.SEND_EMAIL_ERROR, error);
      throw new Error(`${ErrorMessages.FAILED_SEND_EMAIL}: ${error}`);
    }
  }

  /**
   * Sends an OTP email.
   * @param {string} email - The recipient's email address.
   * @param {string} otp - The One-Time Password.
   * @param {'registration' | 'forgotPassword'} type - The type of OTP.
   * @returns {Promise<void>}
   * @throws {Error} If sending the OTP email fails.
   */
  async sendOTP(email: string, otp: string, type: 'registration' | 'forgotPassword' = 'registration'): Promise<void> {
    try {
      const subject = type === 'registration'
        ? 'ChainVerse - Email Verification'
        : 'ChainVerse - Password Reset';

      const html = this.getOTPEmailTemplate(otp, type);

      await this.sendMail(email, subject, html);
    } catch (error) {
      logger.error(LoggerMessages.SEND_EMAIL_ERROR, error);
      throw new Error(ErrorMessages.FAILED_SEND_EMAIL);
    }
  }

  /**
   * Sends a welcome email to a new user.
   * @param {string} email - The recipient's email address.
   * @param {string} name - The name of the user.
   * @returns {Promise<void>}
   * @throws {Error} If sending the welcome email fails.
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const subject = 'Welcome to ChainVerse!';
      const html = this.getWelcomeEmailTemplate(name);

      await this.sendMail(email, subject, html);
    } catch (error) {
      logger.error(LoggerMessages.SEND_EMAIL_ERROR, error);
      throw new Error(ErrorMessages.FAILED_SEND_EMAIL);
    }
  }

  private getOTPEmailTemplate(otp: string, type: 'registration' | 'forgotPassword'): string {
    const title = type === 'registration' ? 'Email Verification' : 'Password Reset';
    const message = type === 'registration'
      ? 'Please verify your email address with the OTP below:'
      : 'Use the OTP below to reset your password:';

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">${title}</h1>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 15px; margin-top: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <h2 style="color: #1a202c; margin-bottom: 20px; font-size: 24px;">Hi there!</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">${message}</p>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
            <div style="background: white; display: inline-block; padding: 15px 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${otp}</span>
            </div>
          </div>
          
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
            <p style="color: #2d3748; margin: 0; font-size: 14px;">
              <strong>Important:</strong> This OTP will expire in 10 minutes for security purposes.
              If you didn't request this, please ignore this email.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #a0aec0; font-size: 12px;">
          <p>© 2024 ChainVerse. All rights reserved.</p>
          <p>Building the future of Web3 communities</p>
        </div>
      </div>
    `;
  }

  private getWelcomeEmailTemplate(name: string): string {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Welcome to ChainVerse!</h1>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 15px; margin-top: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <h2 style="color: #1a202c; margin-bottom: 20px; font-size: 24px;">Hi ${name}!</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Congratulations! Your community application has been approved and you're now part of the ChainVerse ecosystem.
          </p>
          
          <div style="background: #f0fff4; border: 2px solid #68d391; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3 style="color: #2f855a; margin-top: 0;">What's Next?</h3>
            <ul style="color: #2d3748; line-height: 1.8;">
              <li>Access your community admin dashboard</li>
              <li>Customize your community settings</li>
              <li>Start inviting members</li>
              <li>Create engaging content and quests</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/comms-admin/login" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      text-decoration: none; 
                      padding: 15px 30px; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              Access Dashboard
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #a0aec0; font-size: 12px;">
          <p>© 2024 ChainVerse. All rights reserved.</p>
          <p>Building the future of Web3 communities</p>
        </div>
      </div>
    `;
  }
}