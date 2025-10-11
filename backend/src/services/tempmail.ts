import { injectable } from "inversify";
import { IMailService } from "./ITempMail";
import { MailUtil } from "../utils/mail.util";
import logger from "../utils/logger";

@injectable()
export class MailService implements IMailService {
  private mailUtil: MailUtil;

  constructor() {
    this.mailUtil = new MailUtil();
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.mailUtil.send(to, subject, html);
      logger.info(`Email sent successfully to: ${to}`);
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  async sendOTP(email: string, otp: string, type: 'registration' | 'forgotPassword' = 'registration'): Promise<void> {
    try {
      const subject = type === 'registration' 
        ? 'ChainVerse - Email Verification' 
        : 'ChainVerse - Password Reset';
      
      const html = this.getOTPEmailTemplate(otp, type);
      
      await this.sendMail(email, subject, html);
    } catch (error) {
      logger.error(`Failed to send OTP email:`, error);
      throw new Error(`Failed to send OTP email`);
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const subject = 'Welcome to ChainVerse!';
      const html = this.getWelcomeEmailTemplate(name);
      
      await this.sendMail(email, subject, html);
    } catch (error) {
      logger.error(`Failed to send welcome email:`, error);
      throw new Error(`Failed to send welcome email`);
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