import { injectable, inject } from 'inversify';
import bcrypt from 'bcryptjs';
import { IAdminAuthService } from '../../core/interfaces/services/admin/IAdminAuthService';
import { IAdminRepository } from '../../core/interfaces/repositories/IAdminRepository';
import { IJwtService } from '../../core/interfaces/services/IJwtService';
import { IAdmin } from '../../models/admin.model';
import { TYPES } from '../../core/types/types';
import { CustomError } from '../../utils/CustomError';
import { StatusCode } from '../../enums/statusCode.enum';
import { ErrorMessages } from '../../enums/messages.enum';

@injectable()
export class AdminAuthService implements IAdminAuthService {
  constructor(
    @inject(TYPES.IAdminRepository) private _adminRepository: IAdminRepository,
    @inject(TYPES.IJwtService) private _jwtService: IJwtService
  ) {}

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

  async getAdminById(id: string): Promise<IAdmin | null> {
    return await this._adminRepository.findById(id);
  }

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

  async changePassword(adminId: string, currentPassword: string, newPassword: string): Promise<void> {
    const admin = await this._adminRepository.findById(adminId);
    if (!admin) {
      throw new CustomError(ErrorMessages.ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      throw new CustomError("Current password is incorrect", StatusCode.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this._adminRepository.updateById(adminId, {
      password: hashedPassword,
      tokenVersion: (admin.tokenVersion ?? 0) + 1, // Invalidate existing tokens
    });
  }
}