import { Request, Response } from "express";

export interface IUserQuestController {
  getAvailableQuests(req: Request, res: Response): Promise<void>;
  getQuest(req: Request, res: Response): Promise<void>;
  getMyQuests(req: Request, res: Response): Promise<void>;
  joinQuest(req: Request, res: Response): Promise<void>;
  submitTask(req: Request, res: Response): Promise<void>;
  getQuestTasks(req: Request, res: Response): Promise<void>;
  getMySubmissions(req: Request, res: Response): Promise<void>;
  uploadTaskMedia(req: Request, res: Response): Promise<void>;
  getQuestStats(req: Request, res: Response): Promise<void>;
  getTopQuests(req: Request, res: Response): Promise<void>;
  checkParticipationStatus(req: Request, res: Response): Promise<void>;
  getQuestLeaderboard(req: Request, res: Response): Promise<void>;
}