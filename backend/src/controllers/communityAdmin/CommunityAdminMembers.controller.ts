import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { ICommunityAdminMembersController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminMembers.controller";
import { ICommunityAdminMembersService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminMembersService";
import { CommunityAdminMembersMessages as Msg } from "../../enums/messages.enum";

@injectable()
export class CommunityAdminMembersController implements ICommunityAdminMembersController {
    constructor(
        @inject(TYPES.ICommunityAdminMembersService) private _membersService: ICommunityAdminMembersService
    ) {}

    async getCommunityMembers(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { cursor, limit = Msg.DEFAULT_LIMIT, search, role, status, sortBy = Msg.DEFAULT_SORT } = req.query;

            let validLimit = parseInt(Msg.DEFAULT_LIMIT, 10);
            if (limit && typeof limit === "string") {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) validLimit = Math.min(Math.max(parsedLimit, 1), 50);
            }

            const members = await this._membersService.getCommunityMembers(communityAdminId, {
                cursor: cursor as string,
                limit: validLimit,
                search: search as string,
                role: role as any,
                status: status as any,
                sortBy: sortBy as any
            });

            res.status(StatusCode.OK).json({ success: true, data: members });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || Msg.FAILED_FETCH_MEMBERS;
            logger.error(Msg.LOG_GET_MEMBERS, { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({ success: false, error: message });
        }
    }

    async getMemberDetails(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { memberId } = req.params;

            const member = await this._membersService.getMemberDetails(communityAdminId, memberId);
            res.status(StatusCode.OK).json({ success: true, data: member });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || Msg.FAILED_FETCH_MEMBER_DETAILS;
            logger.error(Msg.LOG_GET_MEMBER_DETAILS, { message, stack: err.stack, adminId: (req as any).user?.id, memberId: req.params.memberId });
            res.status(statusCode).json({ success: false, error: message });
        }
    }

    async updateMemberRole(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { memberId, role, reason } = req.body;

            if (!memberId || !role) {
                res.status(StatusCode.BAD_REQUEST).json({ success: false, error: Msg.MISSING_MEMBER_ID_ROLE });
                return;
            }

            const updatedMember = await this._membersService.updateMemberRole(communityAdminId, { memberId, role, reason });
            res.status(StatusCode.OK).json(updatedMember);
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || Msg.FAILED_UPDATE_ROLE;
            logger.error(Msg.LOG_UPDATE_ROLE, { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({ success: false, error: message });
        }
    }

    async banMember(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { memberId, reason, durationDays } = req.body;

            if (!memberId || !reason) {
                res.status(StatusCode.BAD_REQUEST).json({ success: false, error: Msg.MISSING_MEMBER_ID_REASON });
                return;
            }

            const bannedMember = await this._membersService.banMember(communityAdminId, { memberId, reason, durationDays });
            res.status(StatusCode.OK).json(bannedMember);
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || Msg.FAILED_BAN_MEMBER;
            logger.error(Msg.LOG_BAN_MEMBER, { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({ success: false, error: message });
        }
    }

    async unbanMember(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { memberId } = req.params;

            const unbannedMember = await this._membersService.unbanMember(communityAdminId, memberId);
            res.status(StatusCode.OK).json(unbannedMember);
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || Msg.FAILED_UNBAN_MEMBER;
            logger.error(Msg.LOG_UNBAN_MEMBER, { message, stack: err.stack, adminId: (req as any).user?.id, memberId: req.params.memberId });
            res.status(statusCode).json({ success: false, error: message });
        }
    }

    async removeMember(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { memberId } = req.params;
            const { reason } = req.body;

            const result = await this._membersService.removeMember(communityAdminId, memberId, reason);
            res.status(StatusCode.OK).json({ success: true, data: result, message: Msg.MEMBER_REMOVED_SUCCESS });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || Msg.FAILED_REMOVE_MEMBER;
            logger.error(Msg.LOG_REMOVE_MEMBER, { message, stack: err.stack, adminId: (req as any).user?.id, memberId: req.params.memberId });
            res.status(statusCode).json({ success: false, error: message });
        }
    }

    async getMemberActivity(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { memberId } = req.params;
            const { period = Msg.DEFAULT_PERIOD } = req.query;

            const activity = await this._membersService.getMemberActivity(communityAdminId, memberId, period as string);
            res.status(StatusCode.OK).json({ success: true, data: activity });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || Msg.FAILED_FETCH_ACTIVITY;
            logger.error(Msg.LOG_MEMBER_ACTIVITY, { message, stack: err.stack, adminId: (req as any).user?.id, memberId: req.params.memberId });
            res.status(statusCode).json({ success: false, error: message });
        }
    }

    async bulkUpdateMembers(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { memberIds, action, reason } = req.body;

            if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
                res.status(StatusCode.BAD_REQUEST).json({ success: false, error: Msg.MISSING_MEMBER_IDS });
                return;
            }

            if (!action) {
                res.status(StatusCode.BAD_REQUEST).json({ success: false, error: Msg.MISSING_ACTION });
                return;
            }

            const result = await this._membersService.bulkUpdateMembers(communityAdminId, { memberIds, action, reason });
            res.status(StatusCode.OK).json({ success: true, data: result, message: Msg.BULK_ACTION_SUCCESS });
        } catch (error) {
            const err = error as Error;
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || Msg.FAILED_BULK_UPDATE;
            logger.error(Msg.LOG_BULK_UPDATE, { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({ success: false, error: message });
        }
    }
}
