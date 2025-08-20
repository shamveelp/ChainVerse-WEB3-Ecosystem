import type { Request, Response, NextFunction, RequestHandler } from "express"
import jwt from "jsonwebtoken"
import { StatusCode } from "../enums/statusCode.enum"
import { CustomError } from "../utils/CustomError" // Import CustomError
import { JwtService } from "../utils/jwt"
import logger from "../utils/logger"
import { IUserRepository } from "../core/interfaces/repositories/IUserRepository"
import { TYPES } from "../core/types/types"
import container from "../core/di/container"
import { IAdminRepository } from "../core/interfaces/repositories/IAdminRepository"


const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET

interface AuthRequest extends Request {
  userId?: string
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const roleMIddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as { id: string; role: string } | undefined;

      if (!user) {
        return res.status(StatusCode.UNAUTHORIZED).json({ error: "User not authenticated" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(StatusCode.FORBIDDEN).json({ error: "Access denied" });
      }

      next();
    } catch (error) {
      logger.error("Role middleware error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
    
  }
}

// Type guard to check if request is authenticated
export const isAuthenticatedRequest = (req: Request): req is AuthenticatedRequest => {
  return 'user' in req && req.user !== undefined;
};


export const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(StatusCode.UNAUTHORIZED).json({ message: "Access token is required" });
    }

    const decoded = JwtService.verifyToken(token) as {
      id: string;
      role: string;
      tokenVersion: number;
    }

    const userRepo = container.get<IUserRepository>(TYPES.IUserRepository);
    const adminRepo = container.get<IAdminRepository>(TYPES.IAdminRepository);

    let account: any;
    switch (decoded.role) {
      case 'user': account = await userRepo.findById(decoded.id); break;
      case 'admin': account = await adminRepo.findById(decoded.id); break;
    }

    if (!account || decoded.tokenVersion !== account.tokenVersion) {
      return res.status(StatusCode.UNAUTHORIZED).json({ message: "Invalid or expired token" });
    } 

    if(account.isBanned) {
      res.status(StatusCode.FORBIDDEN).json({ message: "Account is banned" });
      return;
    }

    req.user = {
      id: decoded.id,
      role: decoded.role
    }
    next();
  } catch (error) {
    logger.error("Authentication middleware error:", error);
    res.status(StatusCode.UNAUTHORIZED).json({ message: "Internal server error" });
  }
}



export const communityAdminAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'communityAdmin') {
      return res.status(StatusCode.FORBIDDEN).json({
        success: false,
        message: "Community admin access required"
      });
    }
    next();
  });
};