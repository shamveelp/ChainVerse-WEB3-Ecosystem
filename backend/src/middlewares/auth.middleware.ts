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
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    console.log("Auth middleware - Token:", token ? "Token present" : "No token provided");

    if (!token) {
      return res.status(StatusCode.UNAUTHORIZED).json({ success: false, error: "Access token is required" });
    }

    const decoded = JwtService.verifyToken(token) as {
      id: string;
      role: string;
      tokenVersion: number;
    };
    console.log("Auth middleware - Decoded token:", { id: decoded.id, role: decoded.role, tokenVersion: decoded.tokenVersion });

    const userRepo = container.get<IUserRepository>(TYPES.IUserRepository);
    const adminRepo = container.get<IAdminRepository>(TYPES.IAdminRepository);

    let account: any;
    switch (decoded.role) {
      case "user":
        account = await userRepo.findById(decoded.id);
        break;
      case "admin":
        account = await adminRepo.findById(decoded.id);
        break;
      default:
        throw new CustomError("Invalid role", StatusCode.UNAUTHORIZED);
    }

    console.log("Auth middleware - Account:", account ? { id: account._id, tokenVersion: account.tokenVersion, isBanned: account.isBanned } : "No account found");

    if (!account) {
      return res.status(StatusCode.UNAUTHORIZED).json({ success: false, error: "User not found" });
    }

    if (decoded.tokenVersion !== account.tokenVersion) {
      console.log("Auth middleware - Token version mismatch:", {
        tokenVersion: decoded.tokenVersion,
        dbTokenVersion: account.tokenVersion,
      });
      return res.status(StatusCode.UNAUTHORIZED).json({ success: false, error: "Invalid or expired token" });
    }

    if (account.isBanned) {
      return res.status(StatusCode.FORBIDDEN).json({ success: false, error: "Account is banned" });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      tokenVersion: decoded.tokenVersion,
    };
    next();
  } catch (error) {
    logger.error("Authentication middleware error:", error);
    res.status(StatusCode.UNAUTHORIZED).json({ success: false, error: "Invalid token" });
  }
};
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isAuthenticatedRequest(req) || !req.user) {
        return res.status(StatusCode.UNAUTHORIZED).json({ error: "User not authenticated" });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(StatusCode.FORBIDDEN).json({ error: "Access denied" });
      }

      next();
    } catch (error) {
      logger.error("Role middleware error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
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