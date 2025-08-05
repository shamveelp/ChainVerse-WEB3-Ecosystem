import type { Request, Response } from "express"

export interface IUserAuthController {
  requestOtp(req: Request, res: Response): Promise<void>
  verifyOtp(req: Request, res: Response): Promise<void>
  login(req: Request, res: Response): Promise<void>
  forgotPassword(req: Request, res: Response): Promise<void>
  resetPassword(req: Request, res: Response): Promise<void>
  resendOtp(req: Request, res: Response): Promise<void>
  googleLogin(req: Request, res: Response): Promise<void>
  refreshAccessToken(req: Request, res: Response): Promise<Response | void>
  // logout(req: Request, res: Response): Promise<void>
  // verifyForgotPasswordOtp(req: Request, res: Response): Promise<void>
  // getCurrentUser(req: Request, res: Response): Promise<void>
}




