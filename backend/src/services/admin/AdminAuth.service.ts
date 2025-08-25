import { injectable, inject } from 'inversify';
import bcrypt from 'bcryptjs';
import { Response } from 'express';
import { IAdminAuthService } from '../../core/interfaces/services/admin/IAdminAuthService';
import { IAdminRepository } from '../../core/interfaces/repositories/IAdminRepository';
import { IUserRepository } from '../../core/interfaces/repositories/IUserRepository';
import { JwtService } from '../../utils/jwt';
import { IAdmin } from '../../models/admin.model';
import { IUser } from '../../models/user.models';
import { TYPES } from '../../core/types/types';
import { IJwtService } from '../../core/interfaces/services/IJwtService';

@injectable()
export class AdminAuthService implements IAdminAuthService {
  constructor(
    @inject(TYPES.IAdminRepository) private adminRepository: IAdminRepository,
    @inject(TYPES.IJwtService) private jwtService: IJwtService
  ) { }

  async login(email: string, password: string) {
      const admin = await this.adminRepository.findByEmail(email);
      if(!admin) throw new Error("Invalid credentials");

      const isMatch = await bcrypt.compare(password, admin.password);
      if(!isMatch) throw new Error("Invalid Credentials");

      const adminId = (admin._id)

      const accessToken = this.jwtService.generateAccessToken(adminId, admin.role, admin.tokenVersion ?? 0);
      const refreshToken = this.jwtService.generateRefreshToken(adminId, admin.role, admin.tokenVersion ?? 0);

      return {
        admin: {
          _id: adminId,
          name: admin.name,
          email: admin.email,
          role: admin.role
        },
        accessToken,
        refreshToken
      }
  }

  
}