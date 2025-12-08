import { Request, Response } from "express";

export interface ICommunityAdminQuestController {
  createQuest(req: Request, res: Response): Promise<void>;
  getQuest(req: Request, res: Response): Promise<void>;
  getQuests(req: Request, res: Response): Promise<void>;
  updateQuest(req: Request, res: Response): Promise<void>;
  deleteQuest(req: Request, res: Response): Promise<void>;
  generateQuestWithAI(req: Request, res: Response): Promise<void>;
  chatWithAI(req: Request, res: Response): Promise<void>;
  getQuestParticipants(req: Request, res: Response): Promise<void>;
  getParticipantDetails(req: Request, res: Response): Promise<void>;
  selectWinners(req: Request, res: Response): Promise<void>;
  selectReplacementWinners(req: Request, res: Response): Promise<void>;
  disqualifyParticipant(req: Request, res: Response): Promise<void>;
  distributeRewards(req: Request, res: Response): Promise<void>;
  getQuestStats(req: Request, res: Response): Promise<void>;
  getCommunityQuestStats(req: Request, res: Response): Promise<void>;
  getQuestLeaderboard(req: Request, res: Response): Promise<void>;
  startQuest(req: Request, res: Response): Promise<void>;
  endQuest(req: Request, res: Response): Promise<void>;
  uploadQuestBanner(req: Request, res: Response): Promise<void>;
}