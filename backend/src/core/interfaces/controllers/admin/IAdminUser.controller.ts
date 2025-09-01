import { Request, Response } from "express";

export interface IAdminUserController {
  getAllUsers(req: Request, res: Response): Promise<void>;
  getUserById(req: Request, res: Response): Promise<void>;
  updateUserStatus(req: Request, res: Response): Promise<void>;
  updateUserBanStatus(req: Request, res: Response): Promise<void>;
  deleteUser(req: Request, res: Response): Promise<void>;
}