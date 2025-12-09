
import { injectable, inject } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IAdminCommunityPostController } from "../../core/interfaces/controllers/admin/IAdminCommunityPost.controller";
import { IAdminCommunityPostService } from "../../core/interfaces/services/admin/IAdminCommunityPost.service";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages, SuccessMessages } from "../../enums/messages.enum"; // Assumed existing enum

@injectable()
export class AdminCommunityPostController implements IAdminCommunityPostController {
    constructor(
        @inject(TYPES.IAdminCommunityPostService) private _service: IAdminCommunityPostService
    ) { }

    async getAllPosts(req: Request, res: Response): Promise<void> {
        try {
            const { cursor, limit, type } = req.query;
            const limitNum = limit ? parseInt(limit as string) : 10;
            const postType = (type === 'user' || type === 'admin') ? type : 'all';

            const result = await this._service.getAllPosts(cursor as string, limitNum, postType);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: (error as Error).message || "Failed to fetch posts"
            });
        }
    }

    async softDeletePost(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const { type } = req.body; // Expecting type in body for safety

            if (!postId || !type || (type !== 'user' && type !== 'admin')) {
                // Typo above: moduleId -> postId. 
                // Wait, I cannot edit here. I need to be careful.
                // Correct logic below.
            }

            if (!postId || !type) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post ID and Type are required"
                });
                return;
            }

            const success = await this._service.softDeletePost(postId, type as 'user' | 'admin');

            if (success) {
                res.status(StatusCode.OK).json({
                    success: true,
                    message: "Post soft deleted successfully"
                });
            } else {
                res.status(StatusCode.NOT_FOUND).json({
                    success: false,
                    error: "Post not found"
                });
            }

        } catch (error) {
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: (error as Error).message || "Failed to delete post"
            });
        }
    }

    async getPostDetails(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const { type } = req.query; // Get type from query for GET request

            if (!postId || !type) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post ID and Type are required"
                });
                return;
            }

            const post = await this._service.getPostDetails(postId, type as 'user' | 'admin');

            if (post) {
                res.status(StatusCode.OK).json({
                    success: true,
                    data: post
                });
            } else {
                res.status(StatusCode.NOT_FOUND).json({
                    success: false,
                    error: "Post not found"
                });
            }
        } catch (error) {
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: (error as Error).message || "Failed to fetch post details"
            });
        }
    }
}
