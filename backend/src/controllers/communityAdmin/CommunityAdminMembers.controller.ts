import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { ICommunityAdminMembersController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminMembers.controller";
import { ICommunityAdminMembersService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminMembersService";

@injectable()
export class CommunityAdminMembersController implements ICommunityAdminMembersController {
    constructor(
        @inject(TYPES.ICommunityAdminMembersService) private _membersService: ICommunityAdminMembersService
    ) {}

    async getCommunityMembers(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { cursor, limit = '20', search, role, status, sortBy = 'recent' } = req.query;

            console.log("Getting community members for admin:", communityAdminId);

            let validLimit = 20;
            if (limit && typeof limit === 'string') {
                const parsedLimit = parseInt(limit, 10);
                if (!isNaN(parsedLimit)) {
                    validLimit = Math.min(Math.max(parsedLimit, 1), 50);
                }
            }

            const members = await this._membersService.getCommunityMembers(communityAdminId, {
                cursor: cursor as string,
                limit: validLimit,
                search: search as string,
                role: role as any,
                status: status as any,
                sortBy: sortBy as any
            });

            res.status(StatusCode.OK).json({
                success: true,
                data: members
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get community members error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch community members";
            logger.error("Get community members error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getMemberDetails(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { memberId } = req.params;

            console.log("Getting member details for admin:", communityAdminId, "member:", memberId);

            const member = await this._membersService.getMemberDetails(communityAdminId, memberId);

            res.status(StatusCode.OK).json({
                success: true,
                data: member
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get member details error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch member details";
            logger.error("Get member details error:", { message, stack: err.stack, adminId: (req as any).user?.id, memberId: req.params.memberId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async updateMemberRole(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { memberId, role, reason } = req.body;

            console.log("Updating member role for admin:", communityAdminId, "member:", memberId, "role:", role);

            if (!memberId || !role) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Member ID and role are required"
                });
                return;
            }

            const updatedMember = await this._membersService.updateMemberRole(communityAdminId, {
                memberId,
                role,
                reason
            });

            res.status(StatusCode.OK).json(updatedMember);
        } catch (error) {
            const err = error as Error;
            console.error("Update member role error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to update member role";
            logger.error("Update member role error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async banMember(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { memberId, reason, durationDays } = req.body;

            console.log("Banning member for admin:", communityAdminId, "member:", memberId, "reason:", reason);

            if (!memberId || !reason) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Member ID and reason are required"
                });
                return;
            }

            const bannedMember = await this._membersService.banMember(communityAdminId, {
                memberId,
                reason,
                durationDays
            });

            res.status(StatusCode.OK).json(bannedMember);
        } catch (error) {
            const err = error as Error;
            console.error("Ban member error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to ban member";
            logger.error("Ban member error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async unbanMember(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { memberId } = req.params;

            console.log("Unbanning member for admin:", communityAdminId, "member:", memberId);

            const unbannedMember = await this._membersService.unbanMember(communityAdminId, memberId);

            res.status(StatusCode.OK).json(unbannedMember);
        } catch (error) {
            const err = error as Error;
            console.error("Unban member error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to unban member";
            logger.error("Unban member error:", { message, stack: err.stack, adminId: (req as any).user?.id, memberId: req.params.memberId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async removeMember(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { memberId } = req.params;
            const { reason } = req.body;

            console.log("Removing member for admin:", communityAdminId, "member:", memberId);

            const result = await this._membersService.removeMember(communityAdminId, memberId, reason);

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: "Member removed successfully"
            });
        } catch (error) {
            const err = error as Error;
            console.error("Remove member error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to remove member";
            logger.error("Remove member error:", { message, stack: err.stack, adminId: (req as any).user?.id, memberId: req.params.memberId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async getMemberActivity(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { memberId } = req.params;
            const { period = 'week' } = req.query;

            console.log("Getting member activity for admin:", communityAdminId, "member:", memberId, "period:", period);

            const activity = await this._membersService.getMemberActivity(communityAdminId, memberId, period as string);

            res.status(StatusCode.OK).json({
                success: true,
                data: activity
            });
        } catch (error) {
            const err = error as Error;
            console.error("Get member activity error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to fetch member activity";
            logger.error("Get member activity error:", { message, stack: err.stack, adminId: (req as any).user?.id, memberId: req.params.memberId });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }

    async bulkUpdateMembers(req: Request, res: Response): Promise<void> {
        try {
            const communityAdminId = (req as any).user.id;
            const { memberIds, action, reason } = req.body;

            console.log("Bulk updating members for admin:", communityAdminId, "action:", action, "members:", memberIds?.length);

            if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Member IDs array is required"
                });
                return;
            }

            if (!action) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Action is required"
                });
                return;
            }

            const result = await this._membersService.bulkUpdateMembers(communityAdminId, {
                memberIds,
                action,
                reason
            });

            res.status(StatusCode.OK).json({
                success: true,
                data: result,
                message: "Bulk action completed successfully"
            });
        } catch (error) {
            const err = error as Error;
            console.error("Bulk update members error:", error);
            const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
            const message = err.message || "Failed to perform bulk action";
            logger.error("Bulk update members error:", { message, stack: err.stack, adminId: (req as any).user?.id });
            res.status(statusCode).json({
                success: false,
                error: message
            });
        }
    }
}
