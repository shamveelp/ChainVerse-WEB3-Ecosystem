import { injectable } from "inversify";
import nodemailer from "nodemailer";
import { IMailService } from "../core/interfaces/services/IMail.service";
import logger from "../utils/logger";
import { ErrorMessages, LoggerMessages } from "../enums/messages.enum";

@injectable()
export class MailService implements IMailService {
  private _transporter: nodemailer.Transporter;
  private _isConfigured: boolean = false;

  constructor() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      // Production or Development with real credentials
      this._transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        secure: parseInt(smtpPort || '587') === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this._isConfigured = true;
    } else {
      // Fallback/Mock for development verification without credentials
      this._transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });
      this._isConfigured = false;
      if (process.env.NODE_ENV !== 'production') {
        logger.info("MailService: SMTP credentials not found. Using mock transporter (logs only).");
      }
    }
  }

  /**
   * Sends an OTP email for verification or password reset.
   * @param {string} email - The recipient's email address.
   * @param {string} otp - The One-Time Password to send.
   * @param {'verification' | 'forgotPassword'} type - The type of OTP (verification or password reset).
   * @returns {Promise<void>}
   * @throws {Error} If sending the email fails (except in development mode).
   */
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

      // If not configured with real credentials in dev, just log
      if (!this._isConfigured && process.env.NODE_ENV === 'development') {
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
      logger.error(LoggerMessages.SEND_EMAIL_ERROR, error);
      // In development, don't throw error for email sending issues if we were trying to send real email
      if (process.env.NODE_ENV === 'development') {
        // Maybe user has wrong credentials?
        logger.warn("Failed to send email in development. Please check your SMTP credentials.");
      } else {
        throw new Error(ErrorMessages.FAILED_SEND_EMAIL);
      }
    }
  }

  /**
   * Sends a community approval email to the user.
   * @param {string} email - The recipient's email address.
   * @param {string} communityName - The name of the approved community.
   * @returns {Promise<void>}
   */
  async sendCommunityApprovalEmail(email: string, communityName: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Community Request Approved! 🎉</h2>
        <p>Congratulations! Your community <strong>${communityName}</strong> has been approved.</p>
        <p>You can now log in to your community admin dashboard and start managing your community.</p>
        <p>Best regards,<br>ChainVerse Team</p>
      </div>
    `;

    if (!this._isConfigured && process.env.NODE_ENV === 'development') {
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

  /**
   * Sends a community rejection email to the user.
   * @param {string} email - The recipient's email address.
   * @param {string} communityName - The name of the rejected community.
   * @param {string} reason - The reason for rejection.
   * @returns {Promise<void>}
   */
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

    if (!this._isConfigured && process.env.NODE_ENV === 'development') {
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

  /**
   * Sends a password reset confirmation email.
   * @param {string} email - The recipient's email address.
   * @returns {Promise<void>}
   */
  async sendPasswordResetConfirmation(email: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Password Reset Successful</h2>
        <p>Your password has been successfully reset.</p>
        <p>If you didn't perform this action, please contact support immediately.</p>
        <p>Best regards,<br>ChainVerse Team</p>
      </div>
    `;

    if (!this._isConfigured && process.env.NODE_ENV === 'development') {
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
