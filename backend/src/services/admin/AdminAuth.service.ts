import { injectable, inject } from 'inversify';
import bcrypt from 'bcryptjs';
import { IAdminAuthService } from '../../core/interfaces/services/admin/IAdminAuth.service';
import { IAdminRepository } from '../../core/interfaces/repositories/IAdmin.repository';
import { IJwtService } from '../../core/interfaces/services/IJwtService';
import { IAdmin } from '../../models/admin.model';
import { TYPES } from '../../core/types/types';
import { CustomError } from '../../utils/customError';
import { StatusCode } from '../../enums/statusCode.enum';
import { ErrorMessages } from '../../enums/messages.enum';

@injectable()
export class AdminAuthService implements IAdminAuthService {
  constructor(
    @inject(TYPES.IAdminRepository) private _adminRepository: IAdminRepository,
    @inject(TYPES.IJwtService) private _jwtService: IJwtService
  ) { }

  /**
   * 
   * @param email 
   * @param password 
   * @returns 
   */
  async login(email: string, password: string) {
    const admin = await this._adminRepository.findByEmail(email);
    if (!admin) {
      throw new CustomError(ErrorMessages.INVALID_CREDENTIALS, StatusCode.UNAUTHORIZED);
    }

    if (!admin.isActive) {
      throw new CustomError(ErrorMessages.ADMIN_INACTIVE, StatusCode.FORBIDDEN);
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw new CustomError(ErrorMessages.INVALID_CREDENTIALS, StatusCode.UNAUTHORIZED);
    }

    // Update last login
    await this._adminRepository.updateById(admin._id.toString(), {
      lastLogin: new Date()
    });

    const adminId = admin._id.toString();
    const accessToken = this._jwtService.generateAccessToken(adminId, admin.role, admin.tokenVersion ?? 0);
    const refreshToken = this._jwtService.generateRefreshToken(adminId, admin.role, admin.tokenVersion ?? 0);

    return {
      admin: {
        _id: adminId,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Retrieves an admin by ID.
   * @param {string} id - Admin ID.
   * @returns {Promise<IAdmin | null>} The admin object or null.
   */
  async getAdminById(id: string): Promise<IAdmin | null> {
    return await this._adminRepository.findById(id);
  }

  /**
   * Resets an admin's password (forgot password flow).
   * @param {string} email - Admin email.
   * @param {string} password - New password.
   * @returns {Promise<void>}
   * @throws {CustomError} If admin is not found.
   */
  async resetPassword(email: string, password: string): Promise<void> {
    const admin = await this._adminRepository.findByEmail(email);
    if (!admin) {
      throw new CustomError(ErrorMessages.ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await this._adminRepository.updateById(admin._id.toString(), {
      password: hashedPassword,
      tokenVersion: (admin.tokenVersion ?? 0) + 1, // Invalidate existing tokens
    });
  }

  /**
   * Changes an admin's password (authenticated flow).
   * @param {string} adminId - Admin ID.
   * @param {string} currentPassword - Current password.
   * @param {string} newPassword - New password.
   * @returns {Promise<void>}
   * @throws {CustomError} If admin not found or current password incorrect.
   */
  async changePassword(adminId: string, currentPassword: string, newPassword: string): Promise<void> {
    const admin = await this._adminRepository.findById(adminId);
    if (!admin) {
      throw new CustomError(ErrorMessages.ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      throw new CustomError(ErrorMessages.INVALID_CURRENT_PASSWORD, StatusCode.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this._adminRepository.updateById(adminId, {
      password: hashedPassword,
      tokenVersion: (admin.tokenVersion ?? 0) + 1, // Invalidate existing tokens
    });
  }

  /**
   * Increments the token version for an admin (invalidating tokens).
   * @param {string} adminId - Admin ID.
   * @returns {Promise<void>}
   */
  async incrementTokenVersion(adminId: string): Promise<void> {
    await this._adminRepository.incrementTokenVersion(adminId);
  }
}