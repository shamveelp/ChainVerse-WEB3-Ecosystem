import jwt from "jsonwebtoken"
import type { Response } from "express"
import { injectable } from "inversify"
import { CustomError } from "./customError"
import { StatusCode } from "../enums/statusCode.enum"
import { IJwtService } from "../core/interfaces/services/IJwtService"



const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET // Secret for both initial reset token and password reset token

@injectable()
export class JwtService implements IJwtService {

  generateAccessToken(id: string, role: string, tokenVersion: number): string {
    if (!JWT_ACCESS_SECRET) {
      throw new CustomError("JWT_ACCESS_SECRET is not defined", StatusCode.INTERNAL_SERVER_ERROR)
    }


    return jwt.sign({ id, role, tokenVersion }, JWT_ACCESS_SECRET, { expiresIn: "15m" })
  }

  generateRefreshToken(id: string, role: string, tokenVersion: number): string {
    if (!JWT_REFRESH_SECRET) {
      throw new CustomError("JWT_REFRESH_SECRET is not defined", StatusCode.INTERNAL_SERVER_ERROR)
    }
    return jwt.sign({ id, role, tokenVersion }, JWT_REFRESH_SECRET, { expiresIn: "7d" })
  }

  static verifyToken(token: string): any {
    if (!JWT_ACCESS_SECRET) {
      throw new CustomError("JWT_ACCESS_SECRET is not defined", StatusCode.INTERNAL_SERVER_ERROR)
    }
    try {
      return jwt.verify(token, JWT_ACCESS_SECRET)
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new CustomError("Access token expired", StatusCode.UNAUTHORIZED)
      }
      throw new CustomError("Invalid access token", StatusCode.UNAUTHORIZED)
    }
  }

  verifyRefreshToken(token: string): any {
    if (!JWT_REFRESH_SECRET) {
      throw new CustomError("JWT_REFRESH_SECRET is not defined", StatusCode.INTERNAL_SERVER_ERROR)
    }
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET)
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new CustomError("Refresh token expired", StatusCode.UNAUTHORIZED)
      }
      throw new CustomError("Invalid refresh token", StatusCode.UNAUTHORIZED)
    }
  }

  setTokens(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = process.env.NODE_ENV === "production"
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    })
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    })
  }

  setAccessToken(res: Response, accessToken: string): void {
    const isProduction = process.env.NODE_ENV === "production"
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    })
  }

  clearTokens(res: Response): void {
    const isProduction = process.env.NODE_ENV === "production"
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    })
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    })
  }

  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const expiration = this.getTokenExpiration(token);
      if (!expiration) return true;

      return expiration.getTime() <= Date.now();
    } catch (error) {
      return true;
    }
  }

  // Helper method for socket authentication
  static verifySocketToken(token: string): any {
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;

      return this.verifyToken(cleanToken);
    } catch (error) {
      console.error("Socket token verification failed:", error);
      throw error;
    }
  }

}
