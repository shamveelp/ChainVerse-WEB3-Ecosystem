import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { StatusCode } from "../enums/statusCode.enum"
import { CustomError } from "../utils/CustomError" // Import CustomError

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET

interface AuthRequest extends Request {
  userId?: string
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken
  if (!token) {
    return res.status(StatusCode.UNAUTHORIZED).json({ error: "Not Authorized: No access token" })
  }
  try {
    if (!JWT_ACCESS_SECRET) {
      throw new CustomError("JWT_ACCESS_SECRET is not defined", StatusCode.INTERNAL_SERVER_ERROR)
    }
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as { id: string }
    req.userId = decoded.id
    next()
  } catch (error: any) {
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(StatusCode.UNAUTHORIZED).json({ error: "Access token expired" })
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(StatusCode.UNAUTHORIZED).json({ error: "Invalid access token" })
    }
    // Handle CustomError or other unexpected errors
    res.status(error.statusCode || StatusCode.UNAUTHORIZED).json({ error: error.message || "Authentication failed" })
  }
}
