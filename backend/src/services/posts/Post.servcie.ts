import { injectable, inject } from "inversify";
import { IPostService } from "../../core/interfaces/services/posts/IPost.service";
import { IPostRepository } from "../../core/interfaces/repositories/IPostRepository";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunityRepository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
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
    ) {}

    // Post operations
    async createPost(userId: string, data: CreatePostDto): Promise<PostResponseDto> {
        try {
            

            if (!userId) {
                throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
            }

            if (!data.content || data.content.trim().length === 0) {
                throw new CustomError("Post content is required", StatusCode.BAD_REQUEST);
            }

            if (data.content.length > 2000) {
                throw new CustomError("Post content is too long (max 2000 characters)", StatusCode.BAD_REQUEST);
            }

            // Verify user exists
            const user = await this._communityRepository.findUserById(userId);
            if (!user) {
                throw new CustomError("User not found", StatusCode.NOT_FOUND);
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
            console.error('PostService: Create post error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to create post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getPostById(postId: string, viewerUserId?: string): Promise<PostDetailResponseDto> {
        try {
            

            if (!postId) {
                throw new CustomError("Post ID is required", StatusCode.BAD_REQUEST);
            }

            const post = await this._postRepository.findPostById(postId);
            if (!post) {
                throw new CustomError("Post not found", StatusCode.NOT_FOUND);
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
            console.error('PostService: Get post by ID error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async updatePost(postId: string, userId: string, data: UpdatePostDto): Promise<PostResponseDto> {
        try {
            

            if (!postId || !userId) {
                throw new CustomError("Post ID and User ID are required", StatusCode.BAD_REQUEST);
            }

            if (!data.content || data.content.trim().length === 0) {
                throw new CustomError("Post content is required", StatusCode.BAD_REQUEST);
            }

            if (data.content.length > 2000) {
                throw new CustomError("Post content is too long (max 2000 characters)", StatusCode.BAD_REQUEST);
            }

            // Verify post exists and user owns it
            const existingPost = await this._postRepository.findPostById(postId);
            if (!existingPost) {
                throw new CustomError("Post not found", StatusCode.NOT_FOUND);
            }

            if (existingPost.author._id.toString() !== userId) {
                throw new CustomError("You can only update your own posts", StatusCode.FORBIDDEN);
            }

            // Update post
            const updatedPost = await this._postRepository.updatePost(postId, data);
            if (!updatedPost) {
                throw new CustomError("Failed to update post", StatusCode.INTERNAL_SERVER_ERROR);
            }

            
            return this.transformToPostResponse(updatedPost, userId);
        } catch (error) {
            console.error('PostService: Update post error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to update post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async deletePost(postId: string, userId: string): Promise<{ success: boolean; message: string }> {
        try {
            

            if (!postId || !userId) {
                throw new CustomError("Post ID and User ID are required", StatusCode.BAD_REQUEST);
            }

            const success = await this._postRepository.deletePost(postId, userId);
            if (!success) {
                throw new CustomError("Post not found or you don't have permission to delete it", StatusCode.NOT_FOUND);
            }

            
            return {
                success: true,
                message: "Post deleted successfully"
            };
        } catch (error) {
            console.error('PostService: Delete post error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to delete post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Post queries
    async getFeedPosts(userId: string, cursor?: string, limit: number = 10): Promise<PostsListResponseDto> {
        try {
            

            if (!userId) {
                throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
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
            console.error('PostService: Get feed posts error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch feed posts", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getUserPosts(targetUserId: string, viewerUserId?: string, cursor?: string, limit: number = 10): Promise<PostsListResponseDto> {
        try {
            

            if (!targetUserId) {
                throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
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
            console.error('PostService: Get user posts error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch user posts", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getLikedPosts(targetUserId: string, viewerUserId?: string, cursor?: string, limit: number = 10): Promise<PostsListResponseDto> {
        try {
            

            if (!targetUserId) {
                throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
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
            console.error('PostService: Get liked posts error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch liked posts", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

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
            console.error('PostService: Get trending posts error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch trending posts", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getPostsByHashtag(hashtag: string, cursor?: string, limit: number = 10): Promise<PostsListResponseDto> {
        try {
            

            if (!hashtag || hashtag.trim().length === 0) {
                throw new CustomError("Hashtag is required", StatusCode.BAD_REQUEST);
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
            console.error('PostService: Get posts by hashtag error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch posts by hashtag", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async searchPosts(query: string, cursor?: string, limit: number = 10): Promise<PostsListResponseDto> {
        try {
            

            if (!query || query.trim().length === 0) {
                throw new CustomError("Search query is required", StatusCode.BAD_REQUEST);
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
            console.error('PostService: Search posts error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to search posts", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Like operations
    async togglePostLike(userId: string, postId: string): Promise<LikeResponseDto> {
        try {
            

            if (!userId || !postId) {
                throw new CustomError("User ID and Post ID are required", StatusCode.BAD_REQUEST);
            }

            // Check if post exists
            const post = await this._postRepository.findPostById(postId);
            if (!post) {
                throw new CustomError("Post not found", StatusCode.NOT_FOUND);
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
                message = "Post unliked successfully";
            } else {
                // Like the post
                await this._postRepository.likePost(userId, postId);
                newLikesCount = post.likesCount + 1;
                isNowLiked = true;
                message = "Post liked successfully";
            }

            

            return {
                success: true,
                isLiked: isNowLiked,
                likesCount: newLikesCount,
                message
            };
        } catch (error) {
            console.error('PostService: Toggle post like error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to toggle post like", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async toggleCommentLike(userId: string, commentId: string): Promise<LikeResponseDto> {
        try {
            

            if (!userId || !commentId) {
                throw new CustomError("User ID and Comment ID are required", StatusCode.BAD_REQUEST);
            }

            // Check if comment exists
            const comment = await this._postRepository.findCommentById(commentId);
            if (!comment) {
                throw new CustomError("Comment not found", StatusCode.NOT_FOUND);
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
                message = "Comment unliked successfully";
            } else {
                // Like the comment
                await this._postRepository.likeComment(userId, commentId);
                newLikesCount = comment.likesCount + 1;
                isNowLiked = true;
                message = "Comment liked successfully";
            }

            

            return {
                success: true,
                isLiked: isNowLiked,
                likesCount: newLikesCount,
                message
            };
        } catch (error) {
            console.error('PostService: Toggle comment like error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to toggle comment like", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getPostLikers(postId: string, cursor?: string, limit: number = 20): Promise<any> {
        try {
            

            if (!postId) {
                throw new CustomError("Post ID is required", StatusCode.BAD_REQUEST);
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
            console.error('PostService: Get post likers error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch post likers", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Comment operations
    async createComment(userId: string, data: CreateCommentDto): Promise<CommentResponseDto> {
        try {
            

            if (!userId || !data.postId || !data.content) {
                throw new CustomError("User ID, Post ID, and content are required", StatusCode.BAD_REQUEST);
            }

            if (data.content.trim().length === 0) {
                throw new CustomError("Comment content cannot be empty", StatusCode.BAD_REQUEST);
            }

            if (data.content.length > 1000) {
                throw new CustomError("Comment content is too long (max 1000 characters)", StatusCode.BAD_REQUEST);
            }

            // Verify post exists
            const post = await this._postRepository.findPostById(data.postId);
            if (!post) {
                throw new CustomError("Post not found", StatusCode.NOT_FOUND);
            }

            // Verify parent comment exists if provided
            if (data.parentCommentId) {
                const parentComment = await this._postRepository.findCommentById(data.parentCommentId);
                if (!parentComment) {
                    throw new CustomError("Parent comment not found", StatusCode.NOT_FOUND);
                }
                if (parentComment.post.toString() !== data.postId) {
                    throw new CustomError("Parent comment belongs to a different post", StatusCode.BAD_REQUEST);
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
            console.error('PostService: Create comment error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to create comment", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async updateComment(commentId: string, userId: string, content: string): Promise<CommentResponseDto> {
        try {
            

            if (!commentId || !userId || !content) {
                throw new CustomError("Comment ID, User ID, and content are required", StatusCode.BAD_REQUEST);
            }

            if (content.trim().length === 0) {
                throw new CustomError("Comment content cannot be empty", StatusCode.BAD_REQUEST);
            }

            if (content.length > 1000) {
                throw new CustomError("Comment content is too long (max 1000 characters)", StatusCode.BAD_REQUEST);
            }

            // Verify comment exists and user owns it
            const existingComment = await this._postRepository.findCommentById(commentId);
            if (!existingComment) {
                throw new CustomError("Comment not found", StatusCode.NOT_FOUND);
            }

            if (existingComment.author._id.toString() !== userId) {
                throw new CustomError("You can only update your own comments", StatusCode.FORBIDDEN);
            }

            // Update comment
            const updatedComment = await this._postRepository.updateComment(commentId, content);
            if (!updatedComment) {
                throw new CustomError("Failed to update comment", StatusCode.INTERNAL_SERVER_ERROR);
            }

            
            return this.transformToCommentResponse(updatedComment, userId);
        } catch (error) {
            console.error('PostService: Update comment error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to update comment", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteComment(commentId: string, userId: string): Promise<{ success: boolean; message: string }> {
        try {
            

            if (!commentId || !userId) {
                throw new CustomError("Comment ID and User ID are required", StatusCode.BAD_REQUEST);
            }

            const success = await this._postRepository.deleteComment(commentId, userId);
            if (!success) {
                throw new CustomError("Comment not found or you don't have permission to delete it", StatusCode.NOT_FOUND);
            }

            
            return {
                success: true,
                message: "Comment deleted successfully"
            };
        } catch (error) {
            console.error('PostService: Delete comment error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to delete comment", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getPostComments(postId: string, viewerUserId?: string, cursor?: string, limit: number = 10): Promise<CommentsListResponseDto> {
        try {
            

            if (!postId) {
                throw new CustomError("Post ID is required", StatusCode.BAD_REQUEST);
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
            console.error('PostService: Get post comments error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch post comments", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getCommentReplies(commentId: string, viewerUserId?: string, cursor?: string, limit: number = 10): Promise<CommentsListResponseDto> {
        try {
            

            if (!commentId) {
                throw new CustomError("Comment ID is required", StatusCode.BAD_REQUEST);
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
            console.error('PostService: Get comment replies error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch comment replies", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Media operations
    async uploadPostMedia(file: Express.Multer.File): Promise<MediaUploadResponseDto> {
        try {
            

            if (!file) {
                throw new CustomError("No file provided", StatusCode.BAD_REQUEST);
            }

            // Validate file type
            const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime'];
            const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

            if (!allowedTypes.includes(file.mimetype)) {
                throw new CustomError("Invalid file type. Only images (JPEG, PNG, GIF) and videos (MP4, MPEG, QuickTime) are allowed", StatusCode.BAD_REQUEST);
            }

            // Validate file size (10MB limit)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                throw new CustomError("File too large. Maximum size is 10MB", StatusCode.BAD_REQUEST);
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
                            reject(new CustomError("Failed to upload media to cloud storage", StatusCode.INTERNAL_SERVER_ERROR));
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
                message: "Media uploaded successfully"
            };
        } catch (error) {
            console.error('PostService: Upload media error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to upload media", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Share operations
    async sharePost(userId: string, data: SharePostDto): Promise<ShareResponseDto> {
        try {
            

            if (!userId || !data.postId) {
                throw new CustomError("User ID and Post ID are required", StatusCode.BAD_REQUEST);
            }

            // Verify post exists
            const post = await this._postRepository.findPostById(data.postId);
            if (!post) {
                throw new CustomError("Post not found", StatusCode.NOT_FOUND);
            }

            // Update share count
            await this._postRepository.updatePostCounts(data.postId, 'sharesCount', 1);

            // Generate share URL (you can customize this based on your frontend URL structure)
            const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/user/community/post/${data.postId}`;

            return {
                success: true,
                shareUrl,
                sharesCount: post.sharesCount + 1,
                message: "Post shared successfully"
            };
        } catch (error) {
            console.error('PostService: Share post error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to share post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Analytics
    async getPostStats(userId?: string): Promise<PostStatsDto> {
        try {
            
            return await this._postRepository.getPostStats(userId);
        } catch (error) {
            console.error('PostService: Get post stats error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch post stats", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getPopularHashtags(limit: number = 10): Promise<string[]> {
        try {
            
            return await this._postRepository.getPopularHashtags(limit);
        } catch (error) {
            console.error('PostService: Get popular hashtags error:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch popular hashtags", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Helper methods
    private transformToPostResponse(post: any, viewerUserId?: string): PostResponseDto {
        return {
            _id: post._id.toString(),
            author: {
                _id: post.author._id.toString(),
                username: post.author.username,
                name: post.author.name,
                profilePic: post.author.profilePic || '',
                isVerified: post.author.community?.isVerified || false
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
            isOwnPost: viewerUserId ? post.author._id.toString() === viewerUserId : false,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            editedAt: post.editedAt
        };
    }

    private async transformToPostResponseWithLikeStatus(post: any, viewerUserId?: string): Promise<PostResponseDto> {
        const baseResponse = this.transformToPostResponse(post, viewerUserId);
        
        // Check if user liked the post
        if (viewerUserId) {
            baseResponse.isLiked = await this._postRepository.checkIfLiked(viewerUserId, post._id.toString());
        }

        return baseResponse;
    }

    private async transformToCommentResponse(comment: any, viewerUserId?: string): Promise<CommentResponseDto> {
        let isLiked = false;
        
        // Check if user liked the comment
        if (viewerUserId) {
            isLiked = await this._postRepository.checkIfCommentLiked(viewerUserId, comment._id.toString());
        }

        return {
            _id: comment._id.toString(),
            post: comment.post.toString(),
            author: {
                _id: comment.author._id.toString(),
                username: comment.author.username,
                name: comment.author.name,
                profilePic: comment.author.profilePic || '',
                isVerified: comment.author.community?.isVerified || false
            },
            content: comment.content,
            parentComment: comment.parentComment?.toString(),
            likesCount: comment.likesCount || 0,
            repliesCount: comment.repliesCount || 0,
            isLiked,
            isOwnComment: viewerUserId ? comment.author._id.toString() === viewerUserId : false,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            editedAt: comment.editedAt
        };
    }
}