import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { StatusCode } from "../enums/statusCode.enum";
import { CustomError } from "../utils/CustomError";
import { JwtService } from "../utils/jwt";
import logger from "../utils/logger";
import { IUserRepository } from "../core/interfaces/repositories/IUserRepository";
import { IAdminRepository } from "../core/interfaces/repositories/IAdminRepository";
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
    logger.info("Auth middleware: Starting authentication check");
    
    // Get token from cookies or Authorization header
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    logger.info("Auth middleware: Token present:", token ? "Yes" : "No");

    if (!token) {
      logger.info("Auth middleware: No token provided");
      return res.status(StatusCode.UNAUTHORIZED).json({ 
        success: false, 
        message: "Access token is required" 
      });
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = JwtService.verifyToken(token) as {
        id: string;
        role: string;
        tokenVersion: number;
      };
      logger.info("Auth middleware: Token decoded successfully for user:", decoded.id, "role:", decoded.role);
    } catch (tokenError) {
      logger.info("Auth middleware: Token verification failed:", tokenError);
      return res.status(StatusCode.UNAUTHORIZED).json({ 
        success: false, 
        message: "Invalid or expired token" 
      });
    }

    // Get repositories
    const userRepo = container.get<IUserRepository>(TYPES.IUserRepository);
    const adminRepo = container.get<IAdminRepository>(TYPES.IAdminRepository);
    const communityAdminRepo = container.get<ICommunityAdminRepository>(TYPES.ICommunityAdminRepository);

    // Find account based on role
    let account: any;
    try {
      switch (decoded.role) {
        case "user":
          logger.info("Auth middleware: Looking up user account");
          account = await userRepo.findById(decoded.id);
          break;
        case "admin":
          logger.info("Auth middleware: Looking up admin account");
          account = await adminRepo.findById(decoded.id);
          break;
        case "communityAdmin":
          logger.info("Auth middleware: Looking up community admin account");
          account = await communityAdminRepo.findById(decoded.id);
          break;
        default:
          logger.info("Auth middleware: Invalid role:", decoded.role);
          return res.status(StatusCode.UNAUTHORIZED).json({ 
            success: false, 
            message: "Invalid role" 
          });
      }
    } catch (dbError) {
      logger.error("Auth middleware: Database error:", dbError);
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: "Database error during authentication" 
      });
    }

    logger.info("Auth middleware: Account found:", account ? "Yes" : "No");

    if (!account) {
      logger.info("Auth middleware: Account not found for ID:", decoded.id);
      return res.status(StatusCode.UNAUTHORIZED).json({ 
        success: false, 
        message: "Account not found" 
      });
    }

    // Check token version
    if (decoded.tokenVersion !== account.tokenVersion) {
      logger.info("Auth middleware: Token version mismatch. Token:", decoded.tokenVersion, "DB:", account.tokenVersion);
      return res.status(StatusCode.UNAUTHORIZED).json({ 
        success: false, 
        message: "Invalid or expired token" 
      });
    }

    // Check if account is banned
    if (account.isBanned) {
      logger.info("Auth middleware: Account is banned");
      return res.status(StatusCode.FORBIDDEN).json({ 
        success: false, 
        message: "Account is banned" 
      });
    }

    // Check if admin is active
    if (decoded.role === 'admin' && !account.isActive) {
      logger.info("Auth middleware: Admin account is inactive");
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

    logger.info("Auth middleware: Authentication successful for user:", decoded.id);
    next();
  } catch (error) {
    logger.error("Auth middleware: Unexpected error:", error);
    res.status(StatusCode.UNAUTHORIZED).json({ 
      success: false, 
      message: "Authentication failed" 
    });
  }
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info("Role middleware: Checking roles:", allowedRoles);
      
      const user = (req as any).user as { id: string; role: string };
      if (!user) {
        logger.info("Role middleware: User not authenticated");
        res.status(StatusCode.UNAUTHORIZED).json({ 
          success: false, 
          message: "User not authenticated" 
        });
        return;
      }

      logger.info("Role middleware: User role:", user.role);
      
      if (!allowedRoles.includes(user.role)) {
        logger.info("Role middleware: Role not allowed");
        res.status(StatusCode.FORBIDDEN).json({ 
          success: false, 
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
        });
        return;
      }

      logger.info("Role middleware: Role check passed");
      next();
    } catch (error) {
      logger.error("Role middleware: Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  };
};