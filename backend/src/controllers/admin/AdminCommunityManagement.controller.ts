import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { IAdminCommunityManagementController } from "../../core/interfaces/controllers/admin/IAdminCommunityManagement.controller";
import { IAdminCommunityManagementService } from "../../core/interfaces/services/admin/IAdminCommunityManagement.service";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";

@injectable()
export class AdminCommunityManagementController implements IAdminCommunityManagementController {
    constructor(
        @inject(TYPES.IAdminCommunityManagementService) private _service: IAdminCommunityManagementService
    ) { }

    async getAllCommunities(req: Request, res: Response): Promise<void> {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const search = req.query.search as string || '';
            const status = req.query.status as string;
            const isVerified = req.query.isVerified as string;

            const result = await this._service.getAllCommunities(page, limit, search, status, isVerified);

            res.status(StatusCode.OK).json({ success: true, ...result });
        } catch (error) {
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
        }
    }

    async getCommunityById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const community = await this._service.getCommunityById(id);
            if (!community) {
                res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Community not found" });
                return;
            }
            res.status(StatusCode.OK).json({ success: true, community });
        } catch (error) {
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
        }
    }

    async updateCommunityStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const community = await this._service.updateCommunityStatus(id, status);
            res.status(StatusCode.OK).json({ success: true, community });
        } catch (error) {
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
        }
    }

    async updateVerificationStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { isVerified } = req.body;
            const community = await this._service.updateVerificationStatus(id, isVerified);
            res.status(StatusCode.OK).json({ success: true, community });
        } catch (error) {
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
        }
    }

    async deleteCommunity(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const success = await this._service.deleteCommunity(id);
            res.status(StatusCode.OK).json({ success, message: success ? "Community deleted" : "Failed to delete" });
        } catch (error) {
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
        }
    }

    async getCommunityMembers(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const search = req.query.search as string || '';

            const result = await this._service.getCommunityMembers(id, page, limit, search);
            res.status(StatusCode.OK).json({ success: true, ...result });
        } catch (error) {
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
        }
    }

    async updateCommunitySettings(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { settings } = req.body;
            const community = await this._service.updateCommunitySettings(id, settings);
            res.status(StatusCode.OK).json({ success: true, community });
        } catch (error) {
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
        }
    }
}
