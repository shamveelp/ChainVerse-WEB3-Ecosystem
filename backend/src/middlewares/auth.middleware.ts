import type { Request, Response, NextFunction, RequestHandler } from "express"
import jwt from "jsonwebtoken"
import { StatusCode } from "../enums/statusCode.enum"
import { CustomError } from "../utils/CustomError" // Import CustomError
import { JwtService } from "../utils/jwt"


const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET

interface AuthRequest extends Request {
  userId?: string
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as {id: string; role: string};
      if(!user) {
        res.status(StatusCode.UNAUTHORIZED).json({error:"Not Authenticated"})
        return
      }
      if(!allowedRoles.includes(user.role)) {
        res.status(StatusCode.FORBIDDEN).json({error: `You've already logged in as ${user.role}`});
        return
      }
      next()
    } catch (error) {
      
    }
  }
}

export const authMiddleware:RequestHandler = (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
       res.status(StatusCode.UNAUTHORIZED).json({ error: "No token provided" });
       return
    }

    const decoded = JwtService.verifyToken(token) as {
      id: string;
      role: string;
    };

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
     res.status(StatusCode.UNAUTHORIZED).json({ error: "Invalid token" });
     return
  }
};


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