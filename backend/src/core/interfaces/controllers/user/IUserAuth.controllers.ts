import type { Request, Response } from "express"

export interface IUserAuthController {
  requestOtp(req: Request, res: Response): Promise<void>
  verifyOtp(req: Request, res: Response): Promise<void>
  login(req: Request, res: Response): Promise<void>
  forgotPassword(req: Request, res: Response): Promise<void>
  verifyForgotPasswordOtp(req: Request, res: Response): Promise<void>
  resetPassword(req: Request, res: Response): Promise<void>
  refreshAccessToken(req: Request, res: Response): Promise<Response | void>
  logout(req: Request, res: Response): Promise<void>
  googleAuth(req: Request, res: Response): Promise<void> // Added googleAuth
  getCurrentUser(req: Request, res: Response): Promise<void>
}




