// backend/src/middlewares/auth.middleware.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { StatusCode } from "../enums/statusCode.enum";
import { CustomError } from "../utils/CustomError";
import { JwtService } from "../utils/jwt";
import logger from "../utils/logger";
import { IUserRepository } from "../core/interfaces/repositories/IUserRepository";
import { IAdminRepository } from "../core/interfaces/repositories/IAdminRepository";
import { TYPES } from "../core/types/types";
import container from "../core/di/container";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

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
    console.log("Auth middleware: Starting authentication check");
    
    // Get token from cookies or Authorization header
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    console.log("Auth middleware: Token present:", token ? "Yes" : "No");

    if (!token) {
      console.log("Auth middleware: No token provided");
      return res.status(StatusCode.UNAUTHORIZED).json({ 
        success: false, 
        error: "Access token is required" 
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
      console.log("Auth middleware: Token decoded successfully for user:", decoded.id, "role:", decoded.role);
    } catch (tokenError) {
      console.log("Auth middleware: Token verification failed:", tokenError);
      return res.status(StatusCode.UNAUTHORIZED).json({ 
        success: false, 
        error: "Invalid or expired token" 
      });
    }

    // Get repositories
    const userRepo = container.get<IUserRepository>(TYPES.IUserRepository);
    const adminRepo = container.get<IAdminRepository>(TYPES.IAdminRepository);

    // Find account based on role
    let account: any;
    try {
      switch (decoded.role) {
        case "user":
          console.log("Auth middleware: Looking up user account");
          account = await userRepo.findById(decoded.id);
          break;
        case "admin":
          console.log("Auth middleware: Looking up admin account");
          account = await adminRepo.findById(decoded.id);
          break;
        default:
          console.log("Auth middleware: Invalid role:", decoded.role);
          return res.status(StatusCode.UNAUTHORIZED).json({ 
            success: false, 
            error: "Invalid role" 
          });
      }
    } catch (dbError) {
      console.error("Auth middleware: Database error:", dbError);
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        error: "Database error during authentication" 
      });
    }

    console.log("Auth middleware: Account found:", account ? "Yes" : "No");

    if (!account) {
      console.log("Auth middleware: Account not found for ID:", decoded.id);
      return res.status(StatusCode.UNAUTHORIZED).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    // Check token version
    if (decoded.tokenVersion !== account.tokenVersion) {
      console.log("Auth middleware: Token version mismatch. Token:", decoded.tokenVersion, "DB:", account.tokenVersion);
      return res.status(StatusCode.UNAUTHORIZED).json({ 
        success: false, 
        error: "Invalid or expired token" 
      });
    }

    // Check if account is banned
    if (account.isBanned) {
      console.log("Auth middleware: Account is banned");
      return res.status(StatusCode.FORBIDDEN).json({ 
        success: false, 
        error: "Account is banned" 
      });
    }

    // Set user in request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      tokenVersion: decoded.tokenVersion,
    };

    console.log("Auth middleware: Authentication successful for user:", decoded.id);
    next();
  } catch (error) {
    console.error("Auth middleware: Unexpected error:", error);
    logger.error("Authentication middleware error:", error);
    res.status(StatusCode.UNAUTHORIZED).json({ 
      success: false, 
      error: "Authentication failed" 
    });
  }
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Role middleware: Checking roles:", allowedRoles);
      
      const user = req.user as { id: string; role: string };
      if (!user) {
        console.log("Role middleware: User not authenticated");
        res.status(StatusCode.UNAUTHORIZED).json({ 
          success: false, 
          error: "User not authenticated" 
        });
        return;
      }

      console.log("Role middleware: User role:", user.role);
      
      if (!allowedRoles.includes(user.role)) {
        console.log("Role middleware: Role not allowed");
        res.status(StatusCode.FORBIDDEN).json({ 
          success: false, 
          error: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
        });
        return;
      }

      console.log("Role middleware: Role check passed");
      next();
    } catch (error) {
      console.error("Role middleware: Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  };
};

export const communityAdminAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  authMiddleware(req, res, () => {
    if (!isAuthenticatedRequest(req) || req.user?.role !== 'communityAdmin') {
      return res.status(StatusCode.FORBIDDEN).json({
        success: false,
        message: "Community admin access required",
      });
    }
    next();
  });
};