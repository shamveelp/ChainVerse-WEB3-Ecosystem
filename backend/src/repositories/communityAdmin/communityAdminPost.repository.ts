import { injectable } from "inversify";
import { Types } from "mongoose";
import { ICommunityAdminPostRepository } from "../../core/interfaces/repositories/communityAdmin/ICommunityAdminPost.repository";
import CommunityAdminPostModel, { ICommunityAdminPost } from "../../models/communityAdminPost.model";
import CommunityAdminPostLikeModel from "../../models/communityAdminPostLike.model";
import CommunityAdminCommentModel, { ICommunityAdminComment } from "../../models/communityAdminComment.model";
import CommunityAdminCommentLikeModel from "../../models/communityAdminCommentLike.model";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";

@injectable()
export class CommunityAdminPostRepository implements ICommunityAdminPostRepository {
    
    // Post CRUD operations
    async createPost(adminId: string, content: string, mediaUrls: string[] = [], mediaType: 'none' | 'image' | 'video' = 'none'): Promise<ICommunityAdminPost> {
        try {
            if (!Types.ObjectId.isValid(adminId)) {
                throw new CustomError("Invalid admin ID", StatusCode.BAD_REQUEST);
            }

            // Extract hashtags and mentions
            const hashtags = this.extractHashtags(content);
            const mentions = this.extractMentions(content);

            const post = new CommunityAdminPostModel({
                author: new Types.ObjectId(adminId),
                content: content.trim(),
                mediaUrls: mediaUrls.filter(url => url && url.trim()),
                mediaType,
                hashtags,
                mentions
            });

            const savedPost = await post.save();
            return await this.findPostById(savedPost._id.toString()) as ICommunityAdminPost;
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("Database error while creating post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async findPostById(postId: string): Promise<ICommunityAdminPost | null> {
        try {
            if (!Types.ObjectId.isValid(postId)) {
                return null;
            }

            return await CommunityAdminPostModel.findOne({
                _id: new Types.ObjectId(postId),
                isDeleted: false
            })
                .populate({
                    path: 'author',
                    select: '_id name email profilePic communityId',
                    populate: {
                        path: 'communityId',
                        select: 'communityName logo isVerified'
                    }
                })
                .lean()
                .exec();
        } catch (error) {
            throw new CustomError("Database error while fetching post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async updatePost(postId: string, adminId: string, updateData: Partial<ICommunityAdminPost>): Promise<ICommunityAdminPost | null> {
        try {
            if (!Types.ObjectId.isValid(postId) || !Types.ObjectId.isValid(adminId)) {
                throw new CustomError("Invalid post or admin ID", StatusCode.BAD_REQUEST);
            }

            // Re-extract hashtags and mentions if content is updated
            if (updateData.content) {
                updateData.hashtags = this.extractHashtags(updateData.content);
                updateData.mentions = this.extractMentions(updateData.content);
                updateData.editedAt = new Date();
            }

            const updatedPost = await CommunityAdminPostModel.findOneAndUpdate(
                { 
                    _id: new Types.ObjectId(postId), 
                    author: new Types.ObjectId(adminId),
                    isDeleted: false 
                },
                { $set: updateData },
                { new: true, runValidators: true }
            )
                .populate({
                    path: 'author',
                    select: '_id name email profilePic communityId',
                    populate: {
                        path: 'communityId',
                        select: 'communityName logo isVerified'
                    }
                })
                .exec();

            return updatedPost;
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("Database error while updating post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async deletePost(postId: string, adminId: string): Promise<boolean> {
        try {
            if (!Types.ObjectId.isValid(postId) || !Types.ObjectId.isValid(adminId)) {
                throw new CustomError("Invalid post or admin ID", StatusCode.BAD_REQUEST);
            }

            const result = await CommunityAdminPostModel.findOneAndUpdate(
                {
                    _id: new Types.ObjectId(postId),
                    author: new Types.ObjectId(adminId),
                    isDeleted: false
                },
                {
                    $set: {
                        isDeleted: true,
                        deletedAt: new Date()
                    }
                },
                { new: true }
            ).exec();

            return !!result;
        } catch (error) {
            throw new CustomError("Database error while deleting post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getAdminPosts(adminId: string, cursor?: string, limit: number = 10, type: string = 'all'): Promise<{
        posts: ICommunityAdminPost[];
        hasMore: boolean;
        nextCursor?: string;
    }> {
        try {
            if (!Types.ObjectId.isValid(adminId)) {
                throw new CustomError("Invalid admin ID", StatusCode.BAD_REQUEST);
            }

            const validLimit = Math.min(Math.max(limit, 1), 20);
            const query: any = {
                author: new Types.ObjectId(adminId),
                isDeleted: false
            };

            if (cursor && Types.ObjectId.isValid(cursor)) {
                query._id = { $lt: new Types.ObjectId(cursor) };
            }

            // Apply type filter
            if (type === 'media') {
                query.mediaType = { $in: ['image', 'video'] };
            }

            const posts = await CommunityAdminPostModel.find(query)
                .populate({
                    path: 'author',
                    select: '_id name email profilePic communityId',
                    populate: {
                        path: 'communityId',
                        select: 'communityName logo isVerified'
                    }
                })
                .sort({ createdAt: -1 })
                .limit(validLimit + 1)
                .lean()
                .exec();

            const hasMore = posts.length > validLimit;
            const finalPosts = posts.slice(0, validLimit);
            const nextCursor = hasMore && finalPosts.length > 0
                ? finalPosts[finalPosts.length - 1]._id.toString()
                : undefined;

            return {
                posts: finalPosts,
                hasMore,
                nextCursor
            };
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("Database error while fetching admin posts", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Like operations
    async likePost(adminId: string, postId: string): Promise<void> {
        try {
            if (!Types.ObjectId.isValid(adminId) || !Types.ObjectId.isValid(postId)) {
                throw new CustomError("Invalid admin or post ID", StatusCode.BAD_REQUEST);
            }

            const like = new CommunityAdminPostLikeModel({
                admin: new Types.ObjectId(adminId),
                post: new Types.ObjectId(postId)
            });

            await like.save();
            await this.updatePostCounts(postId, 'likesCount', 1);
        } catch (error: any) {
            if (error.code === 11000) {
                throw new CustomError("Post already liked", StatusCode.BAD_REQUEST);
            }
            throw new CustomError("Database error while liking post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async unlikePost(adminId: string, postId: string): Promise<boolean> {
        try {
            if (!Types.ObjectId.isValid(adminId) || !Types.ObjectId.isValid(postId)) {
                throw new CustomError("Invalid admin or post ID", StatusCode.BAD_REQUEST);
            }

            const result = await CommunityAdminPostLikeModel.findOneAndDelete({
                admin: new Types.ObjectId(adminId),
                post: new Types.ObjectId(postId)
            }).exec();

            if (result) {
                await this.updatePostCounts(postId, 'likesCount', -1);
                return true;
            }
            return false;
        } catch (error) {
            throw new CustomError("Database error while unliking post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async checkIfLiked(adminId: string, postId: string): Promise<boolean> {
        try {
            if (!Types.ObjectId.isValid(adminId) || !Types.ObjectId.isValid(postId)) {
                return false;
            }

            const like = await CommunityAdminPostLikeModel.findOne({
                admin: new Types.ObjectId(adminId),
                post: new Types.ObjectId(postId)
            }).select('_id').lean().exec();

            return !!like;
        } catch (error) {
            return false;
        }
    }

    // Comment operations
    async createComment(adminId: string, postId: string, content: string, parentCommentId?: string): Promise<ICommunityAdminComment> {
        try {
            if (!Types.ObjectId.isValid(adminId) || !Types.ObjectId.isValid(postId)) {
                throw new CustomError("Invalid admin or post ID", StatusCode.BAD_REQUEST);
            }

            if (parentCommentId && !Types.ObjectId.isValid(parentCommentId)) {
                throw new CustomError("Invalid parent comment ID", StatusCode.BAD_REQUEST);
            }

            const comment = new CommunityAdminCommentModel({
                post: new Types.ObjectId(postId),
                author: new Types.ObjectId(adminId),
                content: content.trim(),
                parentComment: parentCommentId ? new Types.ObjectId(parentCommentId) : null
            });

            const savedComment = await comment.save();

            // Update counts
            await this.updatePostCounts(postId, 'commentsCount', 1);
            if (parentCommentId) {
                await this.updateCommentCounts(parentCommentId, 'repliesCount', 1);
            }

            return await this.findCommentById(savedComment._id.toString()) as ICommunityAdminComment;
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("Database error while creating comment", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async findCommentById(commentId: string): Promise<ICommunityAdminComment | null> {
        try {
            if (!Types.ObjectId.isValid(commentId)) {
                return null;
            }

            return await CommunityAdminCommentModel.findOne({
                _id: new Types.ObjectId(commentId),
                isDeleted: false
            })
                .populate({
                    path: 'author',
                    select: '_id name email profilePic communityId',
                    populate: {
                        path: 'communityId',
                        select: 'communityName logo isVerified'
                    }
                })
                .lean()
                .exec();
        } catch (error) {
            throw new CustomError("Database error while fetching comment", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getPostComments(postId: string, cursor?: string, limit: number = 10): Promise<{
        comments: ICommunityAdminComment[];
        hasMore: boolean;
        nextCursor?: string;
    }> {
        try {
            if (!Types.ObjectId.isValid(postId)) {
                throw new CustomError("Invalid post ID", StatusCode.BAD_REQUEST);
            }

            const validLimit = Math.min(Math.max(limit, 1), 50);
            const query: any = {
                post: new Types.ObjectId(postId),
                isDeleted: false,
                parentComment: null // Only top-level comments
            };

            if (cursor && Types.ObjectId.isValid(cursor)) {
                query._id = { $lt: new Types.ObjectId(cursor) };
            }

            const comments = await CommunityAdminCommentModel.find(query)
                .populate({
                    path: 'author',
                    select: '_id name email profilePic communityId',
                    populate: {
                        path: 'communityId',
                        select: 'communityName logo isVerified'
                    }
                })
                .sort({ createdAt: -1 })
                .limit(validLimit + 1)
                .lean()
                .exec();

            const hasMore = comments.length > validLimit;
            const finalComments = comments.slice(0, validLimit);
            const nextCursor = hasMore && finalComments.length > 0
                ? finalComments[finalComments.length - 1]._id.toString()
                : undefined;

            return {
                comments: finalComments,
                hasMore,
                nextCursor
            };
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("Database error while fetching comments", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async likeComment(adminId: string, commentId: string): Promise<void> {
        try {
            if (!Types.ObjectId.isValid(adminId) || !Types.ObjectId.isValid(commentId)) {
                throw new CustomError("Invalid admin or comment ID", StatusCode.BAD_REQUEST);
            }

            const like = new CommunityAdminCommentLikeModel({
                admin: new Types.ObjectId(adminId),
                comment: new Types.ObjectId(commentId)
            });

            await like.save();
            await this.updateCommentCounts(commentId, 'likesCount', 1);
        } catch (error: any) {
            if (error.code === 11000) {
                throw new CustomError("Comment already liked", StatusCode.BAD_REQUEST);
            }
            throw new CustomError("Database error while liking comment", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async unlikeComment(adminId: string, commentId: string): Promise<boolean> {
        try {
            if (!Types.ObjectId.isValid(adminId) || !Types.ObjectId.isValid(commentId)) {
                throw new CustomError("Invalid admin or comment ID", StatusCode.BAD_REQUEST);
            }

            const result = await CommunityAdminCommentLikeModel.findOneAndDelete({
                admin: new Types.ObjectId(adminId),
                comment: new Types.ObjectId(commentId)
            }).exec();

            if (result) {
                await this.updateCommentCounts(commentId, 'likesCount', -1);
                return true;
            }
            return false;
        } catch (error) {
            throw new CustomError("Database error while unliking comment", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async checkIfCommentLiked(adminId: string, commentId: string): Promise<boolean> {
        try {
            if (!Types.ObjectId.isValid(adminId) || !Types.ObjectId.isValid(commentId)) {
                return false;
            }

            const like = await CommunityAdminCommentLikeModel.findOne({
                admin: new Types.ObjectId(adminId),
                comment: new Types.ObjectId(commentId)
            }).select('_id').lean().exec();

            return !!like;
        } catch (error) {
            return false;
        }
    }

    // Helper methods
    private async updatePostCounts(postId: string, field: 'likesCount' | 'commentsCount' | 'sharesCount', increment: number): Promise<void> {
        try {
            if (!Types.ObjectId.isValid(postId)) {
                throw new CustomError("Invalid post ID", StatusCode.BAD_REQUEST);
            }

            await CommunityAdminPostModel.findByIdAndUpdate(
                postId,
                { $inc: { [field]: increment } },
                { new: true }
            ).exec();
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("Database error while updating post counts", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    private async updateCommentCounts(commentId: string, field: 'likesCount' | 'repliesCount', increment: number): Promise<void> {
        try {
            if (!Types.ObjectId.isValid(commentId)) {
                throw new CustomError("Invalid comment ID", StatusCode.BAD_REQUEST);
            }

            await CommunityAdminCommentModel.findByIdAndUpdate(
                commentId,
                { $inc: { [field]: increment } },
                { new: true }
            ).exec();
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            throw new CustomError("Database error while updating comment counts", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    private extractHashtags(content: string): string[] {
        const hashtagRegex = /#[a-zA-Z0-9_]+/g;
        const hashtags = content.match(hashtagRegex);
        return hashtags ? hashtags.map(tag => tag.slice(1).toLowerCase()) : [];
    }

    private extractMentions(content: string): string[] {
        const mentionRegex = /@[a-zA-Z0-9_]+/g;
        const mentions = content.match(mentionRegex);
        return mentions ? mentions.map(mention => mention.slice(1).toLowerCase()) : [];
    }
}