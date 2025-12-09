import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { StatusCode } from "../enums/statusCode.enum";
import { CustomError } from "../utils/customError";
import { JwtService } from "../utils/jwt";
import logger from "../utils/logger";
import { IUserRepository } from "../core/interfaces/repositories/IUser.repository";
import { IAdminRepository } from "../core/interfaces/repositories/IAdmin.repository";
import { ICommunityAdminRepository } from "../core/interfaces/repositories/ICommunityAdminRepository";
import { TYPES } from "../core/types/types";
import container from "../core/di/container";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    tokenVersion?: number;
  };
}

export const isAuthenticatedRequest = (req: Request): req is AuthenticatedRequest => {
  return 'user' in req && req.user !== undefined;
};

export const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];


    if (!token) {
      return res.status(StatusCode.UNAUTHORIZED).json({ 
        success: false, 
        message: "Access token is required" 
      });
    }

    let decoded;
    try {
      decoded = JwtService.verifyToken(token) as {
        id: string;
        role: string;
        tokenVersion: number;
      };
    } catch (tokenError) {
      return res.status(StatusCode.UNAUTHORIZED).json({ 
        success: false, 
        message: "Invalid or expired token" 
      });
    }

    const userRepo = container.get<IUserRepository>(TYPES.IUserRepository);
    const adminRepo = container.get<IAdminRepository>(TYPES.IAdminRepository);
    const communityAdminRepo = container.get<ICommunityAdminRepository>(TYPES.ICommunityAdminRepository);

    let account: any;
    try {
      switch (decoded.role) {
        case "user":
          account = await userRepo.findById(decoded.id);
          break;
        case "admin":
          account = await adminRepo.findById(decoded.id);
          break;
        case "communityAdmin":
          account = await communityAdminRepo.findById(decoded.id);
          break;
        default:
          return res.status(StatusCode.UNAUTHORIZED).json({ 
            success: false, 
            message: "Invalid role" 
          });
      }
    } catch (dbError) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: "Database error during authentication" 
      });
    }

    if (!account) {
      return res.status(StatusCode.UNAUTHORIZED).json({ 
        success: false, 
        message: "Account not found" 
      });
    }

    // Check token version
    if (decoded.tokenVersion !== account.tokenVersion) {
      return res.status(StatusCode.UNAUTHORIZED).json({ 
        success: false, 
        message: "Invalid or expired token" 
      });
    }

    // Check if account is banned
    if (account.isBanned) {
      return res.status(StatusCode.FORBIDDEN).json({ 
        success: false, 
        message: "Account is banned" 
      });
    }

    // Check if admin is active
    if (decoded.role === 'admin' && !account.isActive) {
      return res.status(StatusCode.FORBIDDEN).json({ 
        success: false, 
        message: "Admin account is inactive" 
      });
    }

    // Set user in request
    (req as any).user = {
      id: decoded.id,
      role: decoded.role,
      tokenVersion: decoded.tokenVersion,
    };
    next();
  } catch (error) {
    res.status(StatusCode.UNAUTHORIZED).json({ 
      success: false, 
      message: "Authentication failed" 
    });
  }
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      
      const user = (req as any).user as { id: string; role: string };
      if (!user) {
        res.status(StatusCode.UNAUTHORIZED).json({ 
          success: false, 
          message: "User not authenticated" 
        });
        return;
      }
      
      if (!allowedRoles.includes(user.role)) {
        res.status(StatusCode.FORBIDDEN).json({ 
          success: false, 
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
        });
        return;
      }
      next();
    } catch (error) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  };
};