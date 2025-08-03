import jwt from "jsonwebtoken"
import type { Response } from "express"
import { injectable } from "inversify"
import dotenv from "dotenv"
import { CustomError } from "../utils/CustomError"
import { StatusCode } from "../enums/statusCode.enum"

dotenv.config()

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET // Secret for both initial reset token and password reset token

@injectable()
export class JwtService {
  generateAccessToken(id: string): string {
    if (!JWT_ACCESS_SECRET) {
      throw new CustomError("JWT_ACCESS_SECRET is not defined", StatusCode.INTERNAL_SERVER_ERROR)
    }
    return jwt.sign({ id }, JWT_ACCESS_SECRET, { expiresIn: "15m" })
  }

  generateRefreshToken(id: string): string {
    if (!JWT_REFRESH_SECRET) {
      throw new CustomError("JWT_REFRESH_SECRET is not defined", StatusCode.INTERNAL_SERVER_ERROR)
    }
    return jwt.sign({ id }, JWT_REFRESH_SECRET, { expiresIn: "7d" })
  }

  // Generate a short-lived token for the initial forgot password request (contains email)
  generateResetToken(email: string): string {
    if (!JWT_RESET_SECRET) {
      throw new CustomError("JWT_RESET_SECRET is not defined", StatusCode.INTERNAL_SERVER_ERROR)
    }
    return jwt.sign({ email, type: "reset" }, JWT_RESET_SECRET, { expiresIn: "10m" }) // Valid for 10 minutes
  }

  // Generate a token after OTP verification for the actual password reset (contains email)
  generatePasswordResetToken(email: string): string {
    if (!JWT_RESET_SECRET) {
      throw new CustomError("JWT_RESET_SECRET is not defined", StatusCode.INTERNAL_SERVER_ERROR)
    }
    return jwt.sign({ email, type: "password_reset" }, JWT_RESET_SECRET, { expiresIn: "15m" }) // Valid for 15 minutes
  }

  verifyToken(token: string): any {
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

  // Verify the initial reset token
  verifyResetToken(token: string): { email: string; type: string } {
    if (!JWT_RESET_SECRET) {
      throw new CustomError("JWT_RESET_SECRET is not defined", StatusCode.INTERNAL_SERVER_ERROR)
    }
    try {
      const decoded = jwt.verify(token, JWT_RESET_SECRET) as { email: string; type: string }
      if (decoded.type !== "reset") {
        throw new CustomError("Invalid reset token type", StatusCode.UNAUTHORIZED)
      }
      return decoded
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new CustomError("Reset token expired", StatusCode.UNAUTHORIZED)
      }
      throw new CustomError("Invalid reset token", StatusCode.UNAUTHORIZED)
    }
  }

  // Verify the password reset token
  verifyPasswordResetToken(token: string): { email: string; type: string } {
    if (!JWT_RESET_SECRET) {
      throw new CustomError("JWT_RESET_SECRET is not defined", StatusCode.INTERNAL_SERVER_ERROR)
    }
    try {
      const decoded = jwt.verify(token, JWT_RESET_SECRET) as { email: string; type: string }
      if (decoded.type !== "password_reset") {
        throw new CustomError("Invalid password reset token type", StatusCode.UNAUTHORIZED)
      }
      return decoded
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new CustomError("Password reset token expired", StatusCode.UNAUTHORIZED)
      }
      throw new CustomError("Invalid password reset token", StatusCode.UNAUTHORIZED)
    }
  }

  setTokens(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = process.env.NODE_ENV === "production"
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction, // Set secure to true only in production
      sameSite: isProduction ? "strict" : "lax", // Use 'lax' for development, 'strict' for production
      maxAge: 15 * 60 * 1000, // 15 minutes
    })
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction, // Set secure to true only in production
      sameSite: isProduction ? "strict" : "lax", // Use 'lax' for development, 'strict' for production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
  }

  setAccessToken(res: Response, accessToken: string): void {
    const isProduction = process.env.NODE_ENV === "production"
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction, // Set secure to true only in production
      sameSite: isProduction ? "strict" : "lax", // Use 'lax' for development, 'strict' for production
      maxAge: 15 * 60 * 1000, // 15 minutes
    })
  }

  clearTokens(res: Response): void {
    const isProduction = process.env.NODE_ENV === "production"
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
    })
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
    })
  }
}
