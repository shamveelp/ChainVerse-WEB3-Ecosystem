import { injectable } from "inversify";
import nodemailer from "nodemailer";
import { IMailService } from "../core/interfaces/services/IMail.service";
import logger from "../utils/logger";

@injectable()
export class MailService implements IMailService {
  private _transporter: nodemailer.Transporter;

  constructor() {
    // Create a mock transporter for development/WebContainer environment
    if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
      // Create a test account using ethereal email for development
      this._transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });
    } else {
      // Production configuration
      this._transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendOtp(email: string, otp: string, type: 'verification' | 'forgotPassword'): Promise<void> {
    try {
      const subject = type === 'verification' ? 'Email Verification OTP' : 'Password Reset OTP';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; margin: 0;">ChainVerse</h1>
          </div>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: white; margin: 0 0 20px 0;">${subject}</h2>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #333; font-size: 16px; margin: 0 0 15px 0;">Your verification code is:</p>
              <div style="font-size: 32px; font-weight: bold; color: #3B82F6; letter-spacing: 5px; font-family: monospace;">${otp}</div>
            </div>
            <p style="color: white; margin: 20px 0 0 0; font-size: 14px;">This code will expire in 10 minutes.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
            <p>If you didn't request this verification, please ignore this email.</p>
            <p>© 2024 ChainVerse. All rights reserved.</p>
          </div>
        </div>
      `;

      // In development, just log the OTP instead of actually sending email
      if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
        logger.info(`=== DEVELOPMENT EMAIL ===`);
        logger.info(`To: ${email}`);
        logger.info(`Subject: ${subject}`);
        logger.info(`OTP: ${otp}`);
        logger.info(`=== END EMAIL ===`);
        
        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return;
      }

      await this._transporter.sendMail({
        from: process.env.FROM_EMAIL || '"ChainVerse" <noreply@chainverse.com>',
        to: email,
        subject,
        html,
      });

      logger.info(`Email sent successfully to: ${email}`);
    } catch (error) {
      logger.error("Error sending email:", error);
      // In development, don't throw error for email sending issues
      if (process.env.NODE_ENV !== 'development') {
        throw new Error("Failed to send verification email");
      }
    }
  }

  async sendCommunityApprovalEmail(email: string, communityName: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Community Request Approved! 🎉</h2>
        <p>Congratulations! Your community <strong>${communityName}</strong> has been approved.</p>
        <p>You can now log in to your community admin dashboard and start managing your community.</p>
        <p>Best regards,<br>ChainVerse Team</p>
      </div>
    `;

    if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
      logger.info(`=== COMMUNITY APPROVAL EMAIL ===`);
      logger.info(`To: ${email}`);
      logger.info(`Community: ${communityName}`);
      logger.info(`=== END EMAIL ===`);
      return;
    }

    await this._transporter.sendMail({
      from: process.env.FROM_EMAIL || '"ChainVerse" <noreply@chainverse.com>',
      to: email,
      subject: `${communityName} - Community Approved!`,
      html,
    });

    logger.info(`Community approval email sent to: ${email}`);
  }

  async sendCommunityRejectionEmail(email: string, communityName: string, reason: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Community Request Update</h2>
        <p>We regret to inform you that your community request for <strong>${communityName}</strong> has been declined.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>You may reapply after addressing the mentioned concerns.</p>
        <p>Best regards,<br>ChainVerse Team</p>
      </div>
    `;

    if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
      logger.info(`=== COMMUNITY REJECTION EMAIL ===`);
      logger.info(`To: ${email}`);
      logger.info(`Community: ${communityName}`);
      logger.info(`Reason: ${reason}`);
      logger.info(`=== END EMAIL ===`);
      return;
    }

    await this._transporter.sendMail({
      from: process.env.FROM_EMAIL || '"ChainVerse" <noreply@chainverse.com>',
      to: email,
      subject: `${communityName} - Application Update`,
      html,
    });

    logger.info(`Community rejection email sent to: ${email}`);
  }

  async sendPasswordResetConfirmation(email: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Password Reset Successful</h2>
        <p>Your password has been successfully reset.</p>
        <p>If you didn't perform this action, please contact support immediately.</p>
        <p>Best regards,<br>ChainVerse Team</p>
      </div>
    `;

    if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
      logger.info(`=== PASSWORD RESET CONFIRMATION ===`);
      logger.info(`To: ${email}`);
      logger.info(`=== END EMAIL ===`);
      return;
    }

    await this._transporter.sendMail({
      from: process.env.FROM_EMAIL || '"ChainVerse" <noreply@chainverse.com>',
      to: email,
      subject: 'Password Reset Successful',
      html,
    });

    logger.info(`Password reset confirmation sent to: ${email}`);
  }
}