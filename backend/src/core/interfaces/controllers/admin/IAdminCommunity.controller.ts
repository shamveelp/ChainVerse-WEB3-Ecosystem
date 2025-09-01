import { Request, Response } from "express";

export interface IAdminCommunityController {
  getAllCommunityRequests(req: Request, res: Response): Promise<void>;
  getCommunityRequestById(req: Request, res: Response): Promise<void>;
  approveCommunityRequest(req: Request, res: Response): Promise<void>;
  rejectCommunityRequest(req: Request, res: Response): Promise<void>;
}