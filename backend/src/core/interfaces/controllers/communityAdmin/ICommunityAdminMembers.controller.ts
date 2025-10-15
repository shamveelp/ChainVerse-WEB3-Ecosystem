import { Request, Response } from "express";

export interface ICommunityAdminMembersController {
    getCommunityMembers(req: Request, res: Response): Promise<void>;
    getMemberDetails(req: Request, res: Response): Promise<void>;
    updateMemberRole(req: Request, res: Response): Promise<void>;
    banMember(req: Request, res: Response): Promise<void>;
    unbanMember(req: Request, res: Response): Promise<void>;
    removeMember(req: Request, res: Response): Promise<void>;
    getMemberActivity(req: Request, res: Response): Promise<void>;
    bulkUpdateMembers(req: Request, res: Response): Promise<void>;
}