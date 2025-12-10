import { injectable, inject } from "inversify";
import { IPostService } from "../../core/interfaces/services/posts/IPost.service";
import { IPostRepository } from "../../core/interfaces/repositories/IPost.repository";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunity.repository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages, SuccessMessages, LoggerMessages, ValidationMessages } from "../../enums/messages.enum";
import logger from "../../utils/logger";
import cloudinary from "../../config/cloudinary";
import { UploadApiResponse } from "cloudinary";
import {
    CreatePostDto,
    UpdatePostDto,
    CreateCommentDto,
    PostResponseDto,
    PostsListResponseDto,
    CommentResponseDto,
    CommentsListResponseDto,
    LikeResponseDto,
    PostDetailResponseDto,
    ShareResponseDto,
    PostStatsDto,
    MediaUploadResponseDto,
    PostAuthorDto,
    SharePostDto
} from "../../dtos/posts/Post.dto";

@injectable()
export class PostService implements IPostService {
    constructor(
        @inject(TYPES.IPostRepository) private _postRepository: IPostRepository,
        @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository
    ) { }

    // Post operations
    /**
     * Creates a new post.
     * @param {string} userId - User ID.
     * @param {CreatePostDto} data - Post data.
     * @returns {Promise<PostResponseDto>} Created post.
     */
    async createPost(userId: string, data: CreatePostDto): Promise<PostResponseDto> {
        try {
            if (!userId) {
                throw new CustomError(ErrorMessages.USER_ID_REQUIRED, StatusCode.BAD_REQUEST);
            }

            if (!data.content || data.content.trim().length === 0) {
                throw new CustomError(ErrorMessages.POST_CONTENT_REQUIRED, StatusCode.BAD_REQUEST);
            }

            if (data.content.length > 2000) {
                throw new CustomError(ErrorMessages.POST_CONTENT_TOO_LONG, StatusCode.BAD_REQUEST);
            }

            // Verify user exists
            const user = await this._communityRepository.findUserById(userId);
            if (!user) {
                throw new CustomError(ErrorMessages.USER_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Create post
            const post = await this._postRepository.createPost(
                userId,
                data.content,
                data.mediaUrls || [],
                data.mediaType || 'none'
            );

            // Update user's posts count
            await this._communityRepository.incrementPostsCount(userId);

            // Transform to response DTO
            return this.transformToPostResponse(post, userId);
        } catch (error) {
            logger.error(LoggerMessages.CREATE_POST_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_CREATE_POST, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves a post by its ID.
     * @param {string} postId - Post ID.
     * @param {string} [viewerUserId] - Viewer User ID for like status.
     * @returns {Promise<PostDetailResponseDto>} Post details.
     */
    async getPostById(postId: string, viewerUserId?: string): Promise<PostDetailResponseDto> {
        try {
            if (!postId) {
                throw new CustomError(ErrorMessages.POST_ID_REQUIRED, StatusCode.BAD_REQUEST);
            }

            const post = await this._postRepository.findPostById(postId);
            if (!post) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Get post comments (first page)
            const commentsResult = await this._postRepository.getPostComments(postId, undefined, 10);

            // Transform comments with like status
            const transformedComments = await Promise.all(
                commentsResult.comments.map(comment => this.transformToCommentResponse(comment, viewerUserId))
            );

            // Transform post with like status
            const transformedPost = await this.transformToPostResponseWithLikeStatus(post, viewerUserId);

            return {
                post: transformedPost,
                comments: transformedComments,
                hasMoreComments: commentsResult.hasMore,
                nextCommentsCursor: commentsResult.nextCursor,
                totalCommentsCount: post.commentsCount
            };
        } catch (error) {
            logger.error(LoggerMessages.GET_POST_BY_ID_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_FETCH_FEED, StatusCode.INTERNAL_SERVER_ERROR); // Using closest available or need to add FAILED_FETCH_POST
        }
    }

    /**
     * Updates an existing post.
     * @param {string} postId - Post ID.
     * @param {string} userId - User ID.
     * @param {UpdatePostDto} data - Update data.
     * @returns {Promise<PostResponseDto>} Updated post.
     */
    async updatePost(postId: string, userId: string, data: UpdatePostDto): Promise<PostResponseDto> {
        try {
            if (!postId || !userId) {
                throw new CustomError(ErrorMessages.POST_USER_ID_REQUIRED, StatusCode.BAD_REQUEST);
            }

            if (!data.content || data.content.trim().length === 0) {
                throw new CustomError(ErrorMessages.POST_CONTENT_REQUIRED, StatusCode.BAD_REQUEST);
            }

            if (data.content.length > 2000) {
                throw new CustomError(ErrorMessages.POST_CONTENT_TOO_LONG, StatusCode.BAD_REQUEST);
            }

            // Verify post exists and user owns it
            const existingPost = await this._postRepository.findPostById(postId);
            if (!existingPost) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            if (existingPost.author._id.toString() !== userId) {
                throw new CustomError(ErrorMessages.UPDATE_OTHERS_POST_ERROR, StatusCode.FORBIDDEN);
            }

            // Update post
            const updatedPost = await this._postRepository.updatePost(postId, data);
            if (!updatedPost) {
                throw new CustomError(ErrorMessages.FAILED_UPDATE_POST, StatusCode.INTERNAL_SERVER_ERROR);
            }

            return this.transformToPostResponse(updatedPost, userId);
        } catch (error) {
            logger.error(LoggerMessages.UPDATE_POST_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_UPDATE_POST, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes a post.
     * @param {string} postId - Post ID.
     * @param {string} userId - User ID.
     * @returns {Promise<{ success: boolean; message: string }>} Result.
     */
    async deletePost(postId: string, userId: string): Promise<{ success: boolean; message: string }> {
        try {
            if (!postId || !userId) {
                throw new CustomError(ErrorMessages.POST_USER_ID_REQUIRED, StatusCode.BAD_REQUEST);
            }

            const success = await this._postRepository.deletePost(postId, userId);
            if (!success) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND_OR_UNAUTHORIZED, StatusCode.NOT_FOUND);
            }

            return {
                success: true,
                message: SuccessMessages.POST_DELETED_SUCCESS
            };
        } catch (error) {
            logger.error(LoggerMessages.DELETE_POST_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_DELETE_POST, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Post queries
    /**
     * Retrieves feed posts for a user.
     * @param {string} userId - User ID.
     * @param {string} [cursor] - Cursor.
     * @param {number} [limit=10] - Limit.
     * @returns {Promise<PostsListResponseDto>} List of posts.
     */
    async getFeedPosts(userId: string, cursor?: string, limit: number = 10): Promise<PostsListResponseDto> {
        try {
            if (!userId) {
                throw new CustomError(ErrorMessages.USER_ID_REQUIRED, StatusCode.BAD_REQUEST);
            }

            const result = await this._postRepository.getFeedPosts(userId, cursor, limit);

            // Transform posts with like status
            const transformedPosts = await Promise.all(
                result.posts.map(post => this.transformToPostResponseWithLikeStatus(post, userId))
            );

            return {
                posts: transformedPosts,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalCount: transformedPosts.length
            };
        } catch (error) {
            logger.error(LoggerMessages.GET_FEED_POSTS_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_FETCH_FEED, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves posts of a specific user.
     * @param {string} targetUserId - Target User ID.
     * @param {string} [viewerUserId] - Viewer User ID.
     * @param {string} [cursor] - Cursor.
     * @param {number} [limit=10] - Limit.
     * @returns {Promise<PostsListResponseDto>} List of posts.
     */
    async getUserPosts(targetUserId: string, viewerUserId?: string, cursor?: string, limit: number = 10): Promise<PostsListResponseDto> {
        try {
            if (!targetUserId) {
                throw new CustomError(ErrorMessages.USER_ID_REQUIRED, StatusCode.BAD_REQUEST);
            }

            const result = await this._postRepository.getUserPosts(targetUserId, viewerUserId, cursor, limit);

            // Transform posts with like status
            const transformedPosts = await Promise.all(
                result.posts.map(post => this.transformToPostResponseWithLikeStatus(post, viewerUserId))
            );

            return {
                posts: transformedPosts,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalCount: transformedPosts.length
            };
        } catch (error) {
            logger.error(LoggerMessages.GET_USER_POSTS_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_FETCH_USER_POSTS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves posts liked by a user.
     * @param {string} targetUserId - Target User ID.
     * @param {string} [viewerUserId] - Viewer User ID.
     * @param {string} [cursor] - Cursor.
     * @param {number} [limit=10] - Limit.
     * @returns {Promise<PostsListResponseDto>} List of posts.
     */
    async getLikedPosts(targetUserId: string, viewerUserId?: string, cursor?: string, limit: number = 10): Promise<PostsListResponseDto> {
        try {
            if (!targetUserId) {
                throw new CustomError(ErrorMessages.USER_ID_REQUIRED, StatusCode.BAD_REQUEST);
            }

            const result = await this._postRepository.getLikedPosts(targetUserId, viewerUserId, cursor, limit);

            // Transform posts with like status
            const transformedPosts = await Promise.all(
                result.posts.map(post => this.transformToPostResponseWithLikeStatus(post, viewerUserId))
            );

            return {
                posts: transformedPosts,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalCount: transformedPosts.length
            };
        } catch (error) {
            logger.error(LoggerMessages.GET_LIKED_POSTS_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_FETCH_LIKED_POSTS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves trending posts.
     * @param {string} [cursor] - Cursor.
     * @param {number} [limit=10] - Limit.
     * @returns {Promise<PostsListResponseDto>} List of posts.
     */
    async getTrendingPosts(cursor?: string, limit: number = 10): Promise<PostsListResponseDto> {
        try {
            const result = await this._postRepository.getTrendingPosts(cursor, limit);

            // Transform posts (no like status since no specific viewer)
            const transformedPosts = result.posts.map(post => this.transformToPostResponse(post));

            return {
                posts: transformedPosts,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalCount: transformedPosts.length
            };
        } catch (error) {
            logger.error(LoggerMessages.GET_TRENDING_POSTS_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_FETCH_TRENDING_POSTS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves posts by hashtag.
     * @param {string} hashtag - Hashtag.
     * @param {string} [cursor] - Cursor.
     * @param {number} [limit=10] - Limit.
     * @returns {Promise<PostsListResponseDto>} List of posts.
     */
    async getPostsByHashtag(hashtag: string, cursor?: string, limit: number = 10): Promise<PostsListResponseDto> {
        try {
            if (!hashtag || hashtag.trim().length === 0) {
                throw new CustomError(ErrorMessages.HASHTAG_REQUIRED, StatusCode.BAD_REQUEST);
            }

            const result = await this._postRepository.getPostsByHashtag(hashtag, cursor, limit);

            // Transform posts (no like status since no specific viewer)
            const transformedPosts = result.posts.map(post => this.transformToPostResponse(post));

            return {
                posts: transformedPosts,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalCount: transformedPosts.length
            };
        } catch (error) {
            logger.error(LoggerMessages.GET_POSTS_HASHTAG_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_FETCH_HASHTAG_POSTS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Searches for posts.
     * @param {string} query - Search query.
     * @param {string} [cursor] - Cursor.
     * @param {number} [limit=10] - Limit.
     * @returns {Promise<PostsListResponseDto>} List of posts.
     */
    async searchPosts(query: string, cursor?: string, limit: number = 10): Promise<PostsListResponseDto> {
        try {
            if (!query || query.trim().length === 0) {
                throw new CustomError(ErrorMessages.SEARCH_QUERY_REQUIRED, StatusCode.BAD_REQUEST);
            }

            const result = await this._postRepository.searchPosts(query, cursor, limit);

            // Transform posts (no like status since no specific viewer)
            const transformedPosts = result.posts.map(post => this.transformToPostResponse(post));

            return {
                posts: transformedPosts,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalCount: transformedPosts.length
            };
        } catch (error) {
            logger.error(LoggerMessages.SEARCH_POSTS_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_SEARCH_POSTS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Like operations
    // Like operations
    /**
     * Toggles like on a post.
     * @param {string} userId - User ID.
     * @param {string} postId - Post ID.
     * @returns {Promise<LikeResponseDto>} Like response.
     */
    async togglePostLike(userId: string, postId: string): Promise<LikeResponseDto> {
        try {
            if (!userId || !postId) {
                throw new CustomError(ErrorMessages.POST_USER_ID_REQUIRED, StatusCode.BAD_REQUEST);
            }

            // Check if post exists
            const post = await this._postRepository.findPostById(postId);
            if (!post) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Check if already liked
            const isLiked = await this._postRepository.checkIfLiked(userId, postId);

            let newLikesCount: number;
            let isNowLiked: boolean;
            let message: string;

            if (isLiked) {
                // Unlike the post
                await this._postRepository.unlikePost(userId, postId);
                newLikesCount = Math.max(0, post.likesCount - 1);
                isNowLiked = false;
                message = SuccessMessages.POST_UNLIKED_SUCCESS;
            } else {
                // Like the post
                await this._postRepository.likePost(userId, postId);
                newLikesCount = post.likesCount + 1;
                isNowLiked = true;
                message = SuccessMessages.POST_LIKED_SUCCESS;
            }

            return {
                success: true,
                isLiked: isNowLiked,
                likesCount: newLikesCount,
                message
            };
        } catch (error) {
            logger.error(LoggerMessages.TOGGLE_POST_LIKE_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_TOGGLE_POST_LIKE, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Toggles like on a comment.
     * @param {string} userId - User ID.
     * @param {string} commentId - Comment ID.
     * @returns {Promise<LikeResponseDto>} Like response.
     */
    async toggleCommentLike(userId: string, commentId: string): Promise<LikeResponseDto> {
        try {
            if (!userId || !commentId) {
                throw new CustomError(ErrorMessages.COMMENT_USER_ID_REQUIRED, StatusCode.BAD_REQUEST);
            }

            // Check if comment exists
            const comment = await this._postRepository.findCommentById(commentId);
            if (!comment) {
                throw new CustomError(ErrorMessages.COMMENT_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Check if already liked
            const isLiked = await this._postRepository.checkIfCommentLiked(userId, commentId);

            let newLikesCount: number;
            let isNowLiked: boolean;
            let message: string;

            if (isLiked) {
                // Unlike the comment
                await this._postRepository.unlikeComment(userId, commentId);
                newLikesCount = Math.max(0, comment.likesCount - 1);
                isNowLiked = false;
                message = SuccessMessages.COMMENT_UNLIKED_SUCCESS;
            } else {
                // Like the comment
                await this._postRepository.likeComment(userId, commentId);
                newLikesCount = comment.likesCount + 1;
                isNowLiked = true;
                message = SuccessMessages.COMMENT_LIKED_SUCCESS;
            }

            return {
                success: true,
                isLiked: isNowLiked,
                likesCount: newLikesCount,
                message
            };
        } catch (error) {
            logger.error(LoggerMessages.TOGGLE_COMMENT_LIKE_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_TOGGLE_COMMENT_LIKE, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves users who liked a post.
     * @param {string} postId - Post ID.
     * @param {string} [cursor] - Cursor.
     * @param {number} [limit=20] - Limit.
     * @returns {Promise<any>} List of likers.
     */
    async getPostLikers(postId: string, cursor?: string, limit: number = 20): Promise<any> {
        try {
            if (!postId) {
                throw new CustomError(ErrorMessages.POST_ID_REQUIRED, StatusCode.BAD_REQUEST);
            }

            const result = await this._postRepository.getPostLikes(postId, cursor, limit);

            return {
                users: result.likes.map(like => ({
                    _id: (like as any).user._id,
                    username: (like as any).user.username,
                    name: (like as any).user.name,
                    profilePic: (like as any).user.profilePic,
                    isVerified: (like as any).user.community?.isVerified || false,
                    likedAt: like.createdAt
                })),
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalCount: result.likes.length
            };
        } catch (error) {
            logger.error(LoggerMessages.GET_POST_LIKERS_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_FETCH_POST_LIKERS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Comment operations
    /**
     * Creates a new comment.
     * @param {string} userId - User ID.
     * @param {CreateCommentDto} data - Comment data.
     * @returns {Promise<CommentResponseDto>} Created comment.
     */
    async createComment(userId: string, data: CreateCommentDto): Promise<CommentResponseDto> {
        try {
            if (!userId || !data.postId || !data.content) {
                throw new CustomError(ErrorMessages.USER_POST_CONTENT_REQUIRED, StatusCode.BAD_REQUEST);
            }

            if (data.content.trim().length === 0) {
                throw new CustomError(ValidationMessages.EMPTY_COMMENT_CONTENT, StatusCode.BAD_REQUEST);
            }

            if (data.content.length > 1000) {
                throw new CustomError(ErrorMessages.COMMENT_TOO_LONG, StatusCode.BAD_REQUEST);
            }

            // Verify post exists
            const post = await this._postRepository.findPostById(data.postId);
            if (!post) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Verify parent comment exists if provided
            if (data.parentCommentId) {
                const parentComment = await this._postRepository.findCommentById(data.parentCommentId);
                if (!parentComment) {
                    throw new CustomError(ErrorMessages.PARENT_COMMENT_NOT_FOUND, StatusCode.NOT_FOUND);
                }
                if (parentComment.post.toString() !== data.postId) {
                    throw new CustomError(ErrorMessages.PARENT_COMMENT_MISMATCH, StatusCode.BAD_REQUEST);
                }
            }

            // Create comment
            const comment = await this._postRepository.createComment(
                userId,
                data.postId,
                data.content,
                data.parentCommentId
            );

            return this.transformToCommentResponse(comment, userId);
        } catch (error) {
            logger.error(LoggerMessages.CREATE_COMMENT_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_CREATE_COMMENT, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates a comment.
     * @param {string} commentId - Comment ID.
     * @param {string} userId - User ID.
     * @param {string} content - new content.
     * @returns {Promise<CommentResponseDto>} Updated comment.
     */
    async updateComment(commentId: string, userId: string, content: string): Promise<CommentResponseDto> {
        try {
            if (!commentId || !userId || !content) {
                throw new CustomError(ErrorMessages.COMMENT_ID_USER_CONTENT_REQUIRED, StatusCode.BAD_REQUEST);
            }

            if (content.trim().length === 0) {
                throw new CustomError(ValidationMessages.EMPTY_COMMENT_CONTENT, StatusCode.BAD_REQUEST);
            }

            if (content.length > 1000) {
                throw new CustomError(ErrorMessages.COMMENT_TOO_LONG, StatusCode.BAD_REQUEST);
            }

            // Verify comment exists and user owns it
            const existingComment = await this._postRepository.findCommentById(commentId);
            if (!existingComment) {
                throw new CustomError(ErrorMessages.COMMENT_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            if (existingComment.author._id.toString() !== userId) {
                throw new CustomError(ErrorMessages.UPDATE_OTHERS_COMMENT_ERROR, StatusCode.FORBIDDEN);
            }

            // Update comment
            const updatedComment = await this._postRepository.updateComment(commentId, content);
            if (!updatedComment) {
                throw new CustomError(ErrorMessages.FAILED_UPDATE_COMMENT, StatusCode.INTERNAL_SERVER_ERROR);
            }

            return this.transformToCommentResponse(updatedComment, userId);
        } catch (error) {
            logger.error(LoggerMessages.UPDATE_COMMENT_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_UPDATE_COMMENT, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes a comment.
     * @param {string} commentId - Comment ID.
     * @param {string} userId - User ID.
     * @returns {Promise<{ success: boolean; message: string }>} Result.
     */
    async deleteComment(commentId: string, userId: string): Promise<{ success: boolean; message: string }> {
        try {
            if (!commentId || !userId) {
                throw new CustomError(ErrorMessages.COMMENT_USER_ID_REQUIRED, StatusCode.BAD_REQUEST);
            }

            const success = await this._postRepository.deleteComment(commentId, userId);
            if (!success) {
                throw new CustomError(ErrorMessages.COMMENT_NOT_FOUND_OR_UNAUTHORIZED, StatusCode.NOT_FOUND);
            }

            return {
                success: true,
                message: SuccessMessages.COMMENT_DELETED_SUCCESS
            };
        } catch (error) {
            logger.error(LoggerMessages.DELETE_COMMENT_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_DELETE_COMMENT, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves comments for a post.
     * @param {string} postId - Post ID.
     * @param {string} [viewerUserId] - Viewer User ID.
     * @param {string} [cursor] - Cursor.
     * @param {number} [limit=10] - Limit.
     * @returns {Promise<CommentsListResponseDto>} List of comments.
     */
    async getPostComments(postId: string, viewerUserId?: string, cursor?: string, limit: number = 10): Promise<CommentsListResponseDto> {
        try {
            if (!postId) {
                throw new CustomError(ErrorMessages.POST_ID_REQUIRED, StatusCode.BAD_REQUEST);
            }

            const result = await this._postRepository.getPostComments(postId, cursor, limit);

            // Transform comments with like status
            const transformedComments = await Promise.all(
                result.comments.map(comment => this.transformToCommentResponse(comment, viewerUserId))
            );

            return {
                comments: transformedComments,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalCount: transformedComments.length
            };
        } catch (error) {
            logger.error(LoggerMessages.GET_POST_COMMENTS_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_FETCH_POST_COMMENTS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves replies for a comment.
     * @param {string} commentId - Comment ID.
     * @param {string} [viewerUserId] - Viewer User ID.
     * @param {string} [cursor] - Cursor.
     * @param {number} [limit=10] - Limit.
     * @returns {Promise<CommentsListResponseDto>} List of replies.
     */
    async getCommentReplies(commentId: string, viewerUserId?: string, cursor?: string, limit: number = 10): Promise<CommentsListResponseDto> {
        try {
            if (!commentId) {
                throw new CustomError(ValidationMessages.MISSING_COMMENT_ID, StatusCode.BAD_REQUEST);
            }

            const result = await this._postRepository.getCommentReplies(commentId, cursor, limit);

            // Transform comments with like status
            const transformedComments = await Promise.all(
                result.comments.map(comment => this.transformToCommentResponse(comment, viewerUserId))
            );

            return {
                comments: transformedComments,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalCount: transformedComments.length
            };
        } catch (error) {
            logger.error(LoggerMessages.GET_COMMENT_REPLIES_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_FETCH_COMMENT_REPLIES, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Media operations
    /**
     * Uploads media for a post.
     * @param {Express.Multer.File} file - File.
     * @returns {Promise<MediaUploadResponseDto>} Upload result.
     */
    async uploadPostMedia(file: Express.Multer.File): Promise<MediaUploadResponseDto> {
        try {
            if (!file) {
                throw new CustomError(ErrorMessages.NO_FILE_PROVIDED, StatusCode.BAD_REQUEST);
            }

            // Validate file type
            const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime'];
            const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

            if (!allowedTypes.includes(file.mimetype)) {
                throw new CustomError(ErrorMessages.INVALID_FILE_TYPE, StatusCode.BAD_REQUEST);
            }

            // Validate file size (10MB limit)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                throw new CustomError(ErrorMessages.FILE_TOO_LARGE, StatusCode.BAD_REQUEST);
            }

            const mediaType = allowedImageTypes.includes(file.mimetype) ? 'image' : 'video';
            const folderName = mediaType === 'image' ? 'post_images' : 'post_videos';

            // Upload to Cloudinary
            const result: UploadApiResponse = await new Promise((resolve, reject) => {
                const uploadOptions: any = {
                    folder: folderName,
                    quality: "auto",
                    fetch_format: "auto"
                };

                if (mediaType === 'image') {
                    uploadOptions.transformation = [
                        { width: 1200, height: 675, crop: "limit" },
                        { quality: "auto:good" }
                    ];
                } else {
                    uploadOptions.resource_type = "video";
                    uploadOptions.transformation = [
                        { width: 1280, height: 720, crop: "limit" },
                        { quality: "auto" }
                    ];
                }

                cloudinary.uploader.upload_stream(
                    uploadOptions,
                    (error, result) => {
                        if (error) {
                            console.error("Cloudinary upload error:", error);
                            reject(new CustomError(ErrorMessages.CLOUDINARY_UPLOAD_ERROR, StatusCode.INTERNAL_SERVER_ERROR));
                        } else {
                            resolve(result as UploadApiResponse);
                        }
                    }
                ).end(file.buffer);
            });

            return {
                success: true,
                mediaUrl: result.secure_url,
                mediaType: mediaType as 'image' | 'video',
                message: SuccessMessages.MEDIA_UPLOAD_SUCCESS
            };
        } catch (error) {
            logger.error(LoggerMessages.UPLOAD_MEDIA_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_UPLOAD_MEDIA, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Share operations
    /**
     * Shares a post.
     * @param {string} userId - User ID.
     * @param {SharePostDto} data - Share data.
     * @returns {Promise<ShareResponseDto>} Share result.
     */
    async sharePost(userId: string, data: SharePostDto): Promise<ShareResponseDto> {
        try {
            if (!userId || !data.postId) {
                throw new CustomError(ErrorMessages.POST_USER_ID_REQUIRED, StatusCode.BAD_REQUEST);
            }

            // Verify post exists
            const post = await this._postRepository.findPostById(data.postId);
            if (!post) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Update share count
            await this._postRepository.updatePostCounts(data.postId, 'sharesCount', 1);

            // Generate share URL (you can customize this based on your frontend URL structure)
            const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/user/community/post/${data.postId}`;

            return {
                success: true,
                shareUrl,
                sharesCount: post.sharesCount + 1,
                message: SuccessMessages.POST_SHARED_SUCCESS
            };
        } catch (error) {
            logger.error(LoggerMessages.SHARE_POST_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_SHARE_POST, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Analytics
    /**
     * Retrieves post statistics.
     * @param {string} [userId] - User ID.
     * @returns {Promise<PostStatsDto>} Post stats.
     */
    async getPostStats(userId?: string): Promise<PostStatsDto> {
        try {
            return await this._postRepository.getPostStats(userId);
        } catch (error) {
            logger.error(LoggerMessages.GET_POST_STATS_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_GET_POST_STATS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves popular hashtags.
     * @param {number} [limit=10] - Limit.
     * @returns {Promise<string[]>} List of hashtags.
     */
    async getPopularHashtags(limit: number = 10): Promise<string[]> {
        try {
            return await this._postRepository.getPopularHashtags(limit);
        } catch (error) {
            logger.error(LoggerMessages.GET_POPULAR_HASHTAGS_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_FETCH_POPULAR_HASHTAGS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Helper methods
    /**
     * Transforms post document to response DTO.
     * @param {any} post - Post document.
     * @param {string} [viewerUserId] - Viewer User ID.
     * @returns {PostResponseDto} Post response DTO.
     */
    private transformToPostResponse(post: any, viewerUserId?: string): PostResponseDto {
        return {
            _id: post._id.toString(),
            author: post.author ? {
                _id: post.author._id.toString(),
                username: post.author.username,
                name: post.author.name,
                profilePic: post.author.profilePic || '',
                isVerified: post.author.community?.isVerified || false
            } : {
                _id: 'deleted',
                username: 'deleted_user',
                name: 'Deleted User',
                profilePic: '',
                isVerified: false
            },
            content: post.content,
            mediaUrls: post.mediaUrls || [],
            mediaType: post.mediaType || 'none',
            hashtags: post.hashtags || [],
            mentions: post.mentions || [],
            likesCount: post.likesCount || 0,
            commentsCount: post.commentsCount || 0,
            sharesCount: post.sharesCount || 0,
            isLiked: false, // Will be set in transformToPostResponseWithLikeStatus
            isOwnPost: viewerUserId && post.author ? post.author._id.toString() === viewerUserId : false,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            editedAt: post.editedAt
        };
    }

    /**
     * Transforms post document to response DTO with like status.
     * @param {any} post - Post document.
     * @param {string} [viewerUserId] - Viewer User ID.
     * @returns {Promise<PostResponseDto>} Post response DTO.
     */
    private async transformToPostResponseWithLikeStatus(post: any, viewerUserId?: string): Promise<PostResponseDto> {
        const baseResponse = this.transformToPostResponse(post, viewerUserId);

        // Check if user liked the post
        if (viewerUserId) {
            baseResponse.isLiked = await this._postRepository.checkIfLiked(viewerUserId, post._id.toString());
        }

        return baseResponse;
    }

    /**
     * Transforms comment document to response DTO.
     * @param {any} comment - Comment document.
     * @param {string} [viewerUserId] - Viewer User ID.
     * @returns {Promise<CommentResponseDto>} Comment response DTO.
     */
    private async transformToCommentResponse(comment: any, viewerUserId?: string): Promise<CommentResponseDto> {
        let isLiked = false;

        // Check if user liked the comment
        if (viewerUserId) {
            isLiked = await this._postRepository.checkIfCommentLiked(viewerUserId, comment._id.toString());
        }

        return {
            _id: comment._id.toString(),
            post: comment.post.toString(),
            author: comment.author ? {
                _id: comment.author._id.toString(),
                username: comment.author.username,
                name: comment.author.name,
                profilePic: comment.author.profilePic || '',
                isVerified: comment.author.community?.isVerified || false
            } : {
                _id: 'deleted',
                username: 'deleted_user',
                name: 'Deleted User',
                profilePic: '',
                isVerified: false
            },
            content: comment.content,
            parentComment: comment.parentComment?.toString(),
            likesCount: comment.likesCount || 0,
            repliesCount: comment.repliesCount || 0,
            isLiked,
            isOwnComment: viewerUserId && comment.author ? comment.author._id.toString() === viewerUserId : false,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            editedAt: comment.editedAt,
            postedAsCommunity: comment.postedAsCommunity || false,
            community: comment.community ? {
                _id: comment.community._id.toString(),
                username: comment.community.username,
                name: comment.community.name,
                profilePic: comment.community.profilePic || ''
            } : undefined
        };
    }
}