
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
            const { cursor, limit, type, search } = req.query;
            const limitNum = limit ? parseInt(limit as string) : 10;
            const postType = (type === 'user' || type === 'admin') ? type : 'all';
            const searchStr = search ? (search as string) : undefined;

            const result = await this._service.getAllPosts(cursor as string, limitNum, postType, searchStr);

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
            const { type } = req.body;

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

    async restorePost(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const { type } = req.body;

            if (!postId || !type) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post ID and Type are required"
                });
                return;
            }

            const success = await this._service.restorePost(postId, type as 'user' | 'admin');

            if (success) {
                res.status(StatusCode.OK).json({
                    success: true,
                    message: "Post restored successfully"
                });
            } else {
                res.status(StatusCode.NOT_FOUND).json({
                    success: false,
                    error: "Post not found or restoration failed"
                });
            }
        } catch (error) {
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: (error as Error).message || "Failed to restore post"
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

    async getPostComments(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const { type, cursor, limit } = req.query;

            if (!postId || !type) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post ID and Type are required"
                });
                return;
            }

            const limitNum = limit ? parseInt(limit as string) : 10;
            const result = await this._service.getPostComments(postId, type as 'user' | 'admin', cursor as string, limitNum);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: (error as Error).message || "Failed to fetch comments"
            });
        }
    }

    async getPostLikers(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const { type, cursor, limit } = req.query;

            if (!postId || !type) {
                res.status(StatusCode.BAD_REQUEST).json({
                    success: false,
                    error: "Post ID and Type are required"
                });
                return;
            }

            const limitNum = limit ? parseInt(limit as string) : 10;
            const result = await this._service.getPostLikers(postId, type as 'user' | 'admin', cursor as string, limitNum);

            res.status(StatusCode.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: (error as Error).message || "Failed to fetch likers"
            });
        }
    }
}
