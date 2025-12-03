import { injectable } from "inversify";
import { IPostRepository } from "../core/interfaces/repositories/IPostRepository";
import { IPost, PostModel } from "../models/post.models";
import { ILike, LikeModel } from "../models/like.models";
import { IComment, CommentModel } from "../models/comment.models";
import { ICommentLike, CommentLikeModel } from "../models/commentLikes.model";
import { FollowModel } from "../models/follow.models";
import { CustomError } from "../utils/customError";
import { StatusCode } from "../enums/statusCode.enum";
import { Types } from "mongoose";
import { PostResponseDto, PostsListResponseDto, PostStatsDto } from "../dtos/posts/Post.dto";

@injectable()
export class PostRepository implements IPostRepository {
  // Post CRUD operations
  async createPost(
    authorId: string,
    content: string,
    mediaUrls: string[] = [],
    mediaType: "none" | "image" | "video" = "none"
  ): Promise<IPost> {
    try {
      if (!Types.ObjectId.isValid(authorId)) {
        throw new CustomError("Invalid author ID", StatusCode.BAD_REQUEST);
      }

      // Extract hashtags and mentions from content
      const hashtags = this.extractHashtags(content);
      const mentions = this.extractMentions(content);

      const post = new PostModel({
        author: new Types.ObjectId(authorId),
        content: content.trim(),
        mediaUrls: mediaUrls.filter((url) => url && url.trim()),
        mediaType,
        hashtags,
        mentions,
      });

      return await post.save();
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while creating post",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findPostById(postId: string): Promise<IPost | null> {
    try {
      if (!Types.ObjectId.isValid(postId)) {
        return null;
      }

      return await PostModel.findOne({
        _id: new Types.ObjectId(postId),
        isDeleted: false,
      })
        .populate("author", "_id username name profilePic community.isVerified")
        .lean()
        .exec();
    } catch (error) {
      throw new CustomError(
        "Database error while fetching post",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updatePost(
    postId: string,
    updateData: Partial<IPost>
  ): Promise<IPost | null> {
    try {
      if (!Types.ObjectId.isValid(postId)) {
        throw new CustomError("Invalid post ID", StatusCode.BAD_REQUEST);
      }

      // If content is being updated, re-extract hashtags and mentions
      if (updateData.content) {
        updateData.hashtags = this.extractHashtags(updateData.content);
        updateData.mentions = this.extractMentions(updateData.content);
        updateData.editedAt = new Date();
      }

      return await PostModel.findOneAndUpdate(
        { _id: new Types.ObjectId(postId), isDeleted: false },
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate("author", "_id username name profilePic community.isVerified")
        .exec();
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while updating post",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deletePost(postId: string, authorId: string): Promise<boolean> {
    try {
      if (
        !Types.ObjectId.isValid(postId) ||
        !Types.ObjectId.isValid(authorId)
      ) {
        throw new CustomError(
          "Invalid post or author ID",
          StatusCode.BAD_REQUEST
        );
      }

      const result = await PostModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(postId),
          author: new Types.ObjectId(authorId),
          isDeleted: false,
        },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        },
        { new: true }
      ).exec();

      return !!result;
    } catch (error) {
      throw new CustomError(
        "Database error while deleting post",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Feed algorithm - prioritizes followed users, then trending posts, then random posts
  async getFeedPosts(
    userId: string,
    cursor?: string,
    limit: number = 10
  ): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      const validLimit = Math.min(Math.max(limit, 1), 20);
      const userObjectId = new Types.ObjectId(userId);

      // Build base query
      const baseQuery: any = { isDeleted: false };
      if (cursor && Types.ObjectId.isValid(cursor)) {
        baseQuery._id = { $lt: new Types.ObjectId(cursor) };
      }

      // Get user's following list
      const followingList = await FollowModel.find({
        follower: userObjectId,
      })
        .select("following")
        .lean()
        .exec();

      const followingIds = followingList.map((f) => f.following);
      // Add user's own ID to the list
      const feedAuthorIds = [...followingIds, userObjectId];

      // Query 1: Posts from followed users and self
      const friendsPostsPromise = PostModel.find({
        ...baseQuery,
        author: { $in: feedAuthorIds },
      })
        .populate("author", "_id username name profilePic community.isVerified")
        .sort({ createdAt: -1 })
        .limit(validLimit)
        .lean()
        .exec();

      // Query 2: Public posts (excluding followed users and self)
      const publicPostsPromise = PostModel.find({
        ...baseQuery,
        author: { $nin: feedAuthorIds },
      })
        .populate("author", "_id username name profilePic community.isVerified")
        .sort({ createdAt: -1 })
        .limit(validLimit)
        .lean()
        .exec();

      const [friendsPosts, publicPosts] = await Promise.all([
        friendsPostsPromise,
        publicPostsPromise,
      ]);

      // Combine and sort
      const allPosts = [...friendsPosts, ...publicPosts].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Check if there are more posts
      const hasMore = allPosts.length > validLimit;
      const finalPosts = allPosts.slice(0, validLimit);
      const nextCursor =
        hasMore && finalPosts.length > 0
          ? finalPosts[finalPosts.length - 1]._id.toString()
          : undefined;

      return {
        posts: finalPosts,
        hasMore,
        nextCursor,
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while fetching feed posts",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getUserPosts(
    userId: string,
    viewerUserId?: string,
    cursor?: string,
    limit: number = 10
  ): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      const validLimit = Math.min(Math.max(limit, 1), 20);
      const query: any = {
        author: new Types.ObjectId(userId),
        isDeleted: false,
      };

      if (cursor && Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new Types.ObjectId(cursor) };
      }

      const posts = await PostModel.find(query)
        .populate("author", "_id username name profilePic community.isVerified")
        .sort({ createdAt: -1 })
        .limit(validLimit + 1)
        .lean()
        .exec();

      const hasMore = posts.length > validLimit;
      const finalPosts = posts.slice(0, validLimit);
      const nextCursor =
        hasMore && finalPosts.length > 0
          ? finalPosts[finalPosts.length - 1]._id.toString()
          : undefined;

      return {
        posts: finalPosts,
        hasMore,
        nextCursor,
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while fetching user posts",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getLikedPosts(
    userId: string,
    viewerUserId?: string,
    cursor?: string,
    limit: number = 10
  ): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      const validLimit = Math.min(Math.max(limit, 1), 20);
      const query: any = { user: new Types.ObjectId(userId) };

      if (cursor && Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new Types.ObjectId(cursor) };
      }

      const likes = await LikeModel.find(query)
        .populate({
          path: "post",
          match: { isDeleted: false },
          populate: {
            path: "author",
            select: "_id username name profilePic community.isVerified",
          },
        })
        .sort({ createdAt: -1 })
        .limit(validLimit + 1)
        .lean()
        .exec();

      // Filter out likes where post was deleted
      const validLikes = likes.filter((like) => like.post);
      const hasMore = validLikes.length > validLimit;
      const finalLikes = validLikes.slice(0, validLimit);

      const posts = finalLikes.map((like) => like.post as any);
      const nextCursor =
        hasMore && finalLikes.length > 0
          ? finalLikes[finalLikes.length - 1]._id.toString()
          : undefined;

      return {
        posts,
        hasMore,
        nextCursor,
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while fetching liked posts",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getTrendingPosts(
    cursor?: string,
    limit: number = 10
  ): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }> {
    try {
      const validLimit = Math.min(Math.max(limit, 1), 20);
      const query: any = { isDeleted: false };

      if (cursor && Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new Types.ObjectId(cursor) };
      }

      // Get posts with high engagement (likes + comments * 2)
      const posts = await PostModel.find(query)
        .populate("author", "_id username name profilePic community.isVerified")
        .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
        .limit(validLimit + 1)
        .lean()
        .exec();

      const hasMore = posts.length > validLimit;
      const finalPosts = posts.slice(0, validLimit);
      const nextCursor =
        hasMore && finalPosts.length > 0
          ? finalPosts[finalPosts.length - 1]._id.toString()
          : undefined;

      return {
        posts: finalPosts,
        hasMore,
        nextCursor,
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while fetching trending posts",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPostsByHashtag(
    hashtag: string,
    cursor?: string,
    limit: number = 10
  ): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }> {
    try {
      const validLimit = Math.min(Math.max(limit, 1), 20);
      const cleanHashtag = hashtag.toLowerCase().replace("#", "");

      const query: any = {
        hashtags: cleanHashtag,
        isDeleted: false,
      };

      if (cursor && Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new Types.ObjectId(cursor) };
      }

      const posts = await PostModel.find(query)
        .populate("author", "_id username name profilePic community.isVerified")
        .sort({ createdAt: -1 })
        .limit(validLimit + 1)
        .lean()
        .exec();

      const hasMore = posts.length > validLimit;
      const finalPosts = posts.slice(0, validLimit);
      const nextCursor =
        hasMore && finalPosts.length > 0
          ? finalPosts[finalPosts.length - 1]._id.toString()
          : undefined;

      return {
        posts: finalPosts,
        hasMore,
        nextCursor,
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while fetching posts by hashtag",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async searchPosts(
    query: string,
    cursor?: string,
    limit: number = 10
  ): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }> {
    try {
      const validLimit = Math.min(Math.max(limit, 1), 20);
      const searchQuery: any = {
        $text: { $search: query },
        isDeleted: false,
      };

      if (cursor && Types.ObjectId.isValid(cursor)) {
        searchQuery._id = { $lt: new Types.ObjectId(cursor) };
      }

      const posts = await PostModel.find(searchQuery)
        .populate("author", "_id username name profilePic community.isVerified")
        .sort({ score: { $meta: "textScore" }, createdAt: -1 })
        .limit(validLimit + 1)
        .lean()
        .exec();

      const hasMore = posts.length > validLimit;
      const finalPosts = posts.slice(0, validLimit);
      const nextCursor =
        hasMore && finalPosts.length > 0
          ? finalPosts[finalPosts.length - 1]._id.toString()
          : undefined;

      return {
        posts: finalPosts,
        hasMore,
        nextCursor,
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while searching posts",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Like operations
  async likePost(userId: string, postId: string): Promise<ILike> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(postId)) {
        throw new CustomError(
          "Invalid user or post ID",
          StatusCode.BAD_REQUEST
        );
      }

      const like = new LikeModel({
        user: new Types.ObjectId(userId),
        post: new Types.ObjectId(postId),
      });

      const savedLike = await like.save();

      // Increment like count
      await this.updatePostCounts(postId, "likesCount", 1);

      return savedLike;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new CustomError("Post already liked", StatusCode.BAD_REQUEST);
      }
      throw new CustomError(
        "Database error while liking post",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async unlikePost(userId: string, postId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(postId)) {
        throw new CustomError(
          "Invalid user or post ID",
          StatusCode.BAD_REQUEST
        );
      }

      const result = await LikeModel.findOneAndDelete({
        user: new Types.ObjectId(userId),
        post: new Types.ObjectId(postId),
      }).exec();

      if (result) {
        // Decrement like count
        await this.updatePostCounts(postId, "likesCount", -1);
        return true;
      }

      return false;
    } catch (error) {
      throw new CustomError(
        "Database error while unliking post",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async checkIfLiked(userId: string, postId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(postId)) {
        return false;
      }

      const like = await LikeModel.findOne({
        user: new Types.ObjectId(userId),
        post: new Types.ObjectId(postId),
      })
        .select("_id")
        .lean()
        .exec();

      return !!like;
    } catch (error) {
      return false;
    }
  }

  async getPostLikes(
    postId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<{ likes: ILike[]; hasMore: boolean; nextCursor?: string }> {
    try {
      if (!Types.ObjectId.isValid(postId)) {
        throw new CustomError("Invalid post ID", StatusCode.BAD_REQUEST);
      }

      const validLimit = Math.min(Math.max(limit, 1), 50);
      const query: any = { post: new Types.ObjectId(postId) };

      if (cursor && Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new Types.ObjectId(cursor) };
      }

      const likes = await LikeModel.find(query)
        .populate("user", "_id username name profilePic community.isVerified")
        .sort({ createdAt: -1 })
        .limit(validLimit + 1)
        .lean()
        .exec();

      const hasMore = likes.length > validLimit;
      const finalLikes = likes.slice(0, validLimit);
      const nextCursor =
        hasMore && finalLikes.length > 0
          ? finalLikes[finalLikes.length - 1]._id.toString()
          : undefined;

      return {
        likes: finalLikes,
        hasMore,
        nextCursor,
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while fetching post likes",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Comment operations
  async createComment(
    authorId: string,
    postId: string,
    content: string,
    parentCommentId?: string
  ): Promise<IComment> {
    try {
      if (
        !Types.ObjectId.isValid(authorId) ||
        !Types.ObjectId.isValid(postId)
      ) {
        throw new CustomError(
          "Invalid author or post ID",
          StatusCode.BAD_REQUEST
        );
      }

      if (parentCommentId && !Types.ObjectId.isValid(parentCommentId)) {
        throw new CustomError(
          "Invalid parent comment ID",
          StatusCode.BAD_REQUEST
        );
      }

      const comment = new CommentModel({
        post: new Types.ObjectId(postId),
        author: new Types.ObjectId(authorId),
        content: content.trim(),
        parentComment: parentCommentId
          ? new Types.ObjectId(parentCommentId)
          : null,
      });

      const savedComment = await comment.save();

      // Update counts
      await this.updatePostCounts(postId, "commentsCount", 1);

      if (parentCommentId) {
        await this.updateCommentCounts(parentCommentId, "repliesCount", 1);
      }

      return savedComment;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while creating comment",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findCommentById(commentId: string): Promise<IComment | null> {
    try {
      if (!Types.ObjectId.isValid(commentId)) {
        return null;
      }

      return await CommentModel.findOne({
        _id: new Types.ObjectId(commentId),
        isDeleted: false,
      })
        .populate("author", "_id username name profilePic community.isVerified")
        .lean()
        .exec();
    } catch (error) {
      throw new CustomError(
        "Database error while fetching comment",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateComment(
    commentId: string,
    content: string
  ): Promise<IComment | null> {
    try {
      if (!Types.ObjectId.isValid(commentId)) {
        throw new CustomError("Invalid comment ID", StatusCode.BAD_REQUEST);
      }

      return await CommentModel.findOneAndUpdate(
        { _id: new Types.ObjectId(commentId), isDeleted: false },
        {
          $set: {
            content: content.trim(),
            editedAt: new Date(),
          },
        },
        { new: true, runValidators: true }
      )
        .populate("author", "_id username name profilePic community.isVerified")
        .exec();
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while updating comment",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteComment(commentId: string, authorId: string): Promise<boolean> {
    try {
      if (
        !Types.ObjectId.isValid(commentId) ||
        !Types.ObjectId.isValid(authorId)
      ) {
        throw new CustomError(
          "Invalid comment or author ID",
          StatusCode.BAD_REQUEST
        );
      }

      const comment = await CommentModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(commentId),
          author: new Types.ObjectId(authorId),
          isDeleted: false,
        },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        },
        { new: true }
      ).exec();

      if (comment) {
        // Update counts
        await this.updatePostCounts(
          comment.post.toString(),
          "commentsCount",
          -1
        );

        if (comment.parentComment) {
          await this.updateCommentCounts(
            comment.parentComment.toString(),
            "repliesCount",
            -1
          );
        }

        return true;
      }

      return false;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while deleting comment",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPostComments(
    postId: string,
    cursor?: string,
    limit: number = 10,
    parentCommentId?: string
  ): Promise<{ comments: IComment[]; hasMore: boolean; nextCursor?: string }> {
    try {
      if (!Types.ObjectId.isValid(postId)) {
        throw new CustomError("Invalid post ID", StatusCode.BAD_REQUEST);
      }

      const validLimit = Math.min(Math.max(limit, 1), 50);
      const query: any = {
        post: new Types.ObjectId(postId),
        isDeleted: false,
        parentComment: parentCommentId
          ? new Types.ObjectId(parentCommentId)
          : null,
      };

      if (cursor && Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new Types.ObjectId(cursor) };
      }

      const comments = await CommentModel.find(query)
        .populate("author", "_id username name profilePic community.isVerified")
        .sort({ createdAt: -1 })
        .limit(validLimit + 1)
        .lean()
        .exec();

      const hasMore = comments.length > validLimit;
      const finalComments = comments.slice(0, validLimit);
      const nextCursor =
        hasMore && finalComments.length > 0
          ? finalComments[finalComments.length - 1]._id.toString()
          : undefined;

      return {
        comments: finalComments,
        hasMore,
        nextCursor,
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while fetching post comments",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCommentReplies(
    commentId: string,
    cursor?: string,
    limit: number = 10
  ): Promise<{ comments: IComment[]; hasMore: boolean; nextCursor?: string }> {
    try {
      if (!Types.ObjectId.isValid(commentId)) {
        throw new CustomError("Invalid comment ID", StatusCode.BAD_REQUEST);
      }

      const validLimit = Math.min(Math.max(limit, 1), 50);
      const query: any = {
        parentComment: new Types.ObjectId(commentId),
        isDeleted: false,
      };

      if (cursor && Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new Types.ObjectId(cursor) };
      }

      const comments = await CommentModel.find(query)
        .populate("author", "_id username name profilePic community.isVerified")
        .sort({ createdAt: -1 })
        .limit(validLimit + 1)
        .lean()
        .exec();

      const hasMore = comments.length > validLimit;
      const finalComments = comments.slice(0, validLimit);
      const nextCursor =
        hasMore && finalComments.length > 0
          ? finalComments[finalComments.length - 1]._id.toString()
          : undefined;

      return {
        comments: finalComments,
        hasMore,
        nextCursor,
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while fetching comment replies",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Comment like operations
  async likeComment(userId: string, commentId: string): Promise<ICommentLike> {
    try {
      if (
        !Types.ObjectId.isValid(userId) ||
        !Types.ObjectId.isValid(commentId)
      ) {
        throw new CustomError(
          "Invalid user or comment ID",
          StatusCode.BAD_REQUEST
        );
      }

      const commentLike = new CommentLikeModel({
        user: new Types.ObjectId(userId),
        comment: new Types.ObjectId(commentId),
      });

      const savedLike = await commentLike.save();

      // Increment like count
      await this.updateCommentCounts(commentId, "likesCount", 1);

      return savedLike;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new CustomError("Comment already liked", StatusCode.BAD_REQUEST);
      }
      throw new CustomError(
        "Database error while liking comment",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async unlikeComment(userId: string, commentId: string): Promise<boolean> {
    try {
      if (
        !Types.ObjectId.isValid(userId) ||
        !Types.ObjectId.isValid(commentId)
      ) {
        throw new CustomError(
          "Invalid user or comment ID",
          StatusCode.BAD_REQUEST
        );
      }

      const result = await CommentLikeModel.findOneAndDelete({
        user: new Types.ObjectId(userId),
        comment: new Types.ObjectId(commentId),
      }).exec();

      if (result) {
        // Decrement like count
        await this.updateCommentCounts(commentId, "likesCount", -1);
        return true;
      }

      return false;
    } catch (error) {
      throw new CustomError(
        "Database error while unliking comment",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async checkIfCommentLiked(
    userId: string,
    commentId: string
  ): Promise<boolean> {
    try {
      if (
        !Types.ObjectId.isValid(userId) ||
        !Types.ObjectId.isValid(commentId)
      ) {
        return false;
      }

      const like = await CommentLikeModel.findOne({
        user: new Types.ObjectId(userId),
        comment: new Types.ObjectId(commentId),
      })
        .select("_id")
        .lean()
        .exec();

      return !!like;
    } catch (error) {
      return false;
    }
  }

  // Count operations
  async updatePostCounts(
    postId: string,
    field: "likesCount" | "commentsCount" | "sharesCount",
    increment: number
  ): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(postId)) {
        throw new CustomError("Invalid post ID", StatusCode.BAD_REQUEST);
      }

      await PostModel.findByIdAndUpdate(
        postId,
        { $inc: { [field]: increment } },
        { new: true }
      ).exec();
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while updating post counts",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateCommentCounts(
    commentId: string,
    field: "likesCount" | "repliesCount",
    increment: number
  ): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(commentId)) {
        throw new CustomError("Invalid comment ID", StatusCode.BAD_REQUEST);
      }

      await CommentModel.findByIdAndUpdate(
        commentId,
        { $inc: { [field]: increment } },
        { new: true }
      ).exec();
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while updating comment counts",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Analytics and stats
  async getPostStats(userId?: string): Promise<PostStatsDto> {
    try {
      const matchQuery =
        userId && Types.ObjectId.isValid(userId)
          ? { author: new Types.ObjectId(userId), isDeleted: false }
          : { isDeleted: false };

      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats = await PostModel.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalPosts: { $sum: 1 },
            totalLikes: { $sum: "$likesCount" },
            totalComments: { $sum: "$commentsCount" },
            totalShares: { $sum: "$sharesCount" },
            todayPosts: {
              $sum: {
                $cond: [{ $gte: ["$createdAt", todayStart] }, 1, 0],
              },
            },
            weekPosts: {
              $sum: {
                $cond: [{ $gte: ["$createdAt", weekStart] }, 1, 0],
              },
            },
          },
        },
      ]);

      const result = stats[0] || {};

      return {
        totalPosts: result.totalPosts || 0,
        totalLikes: result.totalLikes || 0,
        totalComments: result.totalComments || 0,
        totalShares: result.totalShares || 0,
        todayPosts: result.todayPosts || 0,
        weekPosts: result.weekPosts || 0,
      };
    } catch (error) {
      throw new CustomError(
        "Database error while fetching post stats",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPopularHashtags(limit: number = 10): Promise<string[]> {
    try {
      const hashtags = await PostModel.aggregate([
        { $match: { isDeleted: false } },
        { $unwind: "$hashtags" },
        {
          $group: {
            _id: "$hashtags",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: Math.min(Math.max(limit, 1), 50) },
        { $project: { _id: 1 } },
      ]);

      return hashtags.map((h) => h._id);
    } catch (error) {
      throw new CustomError(
        "Database error while fetching popular hashtags",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Admin operations
  async findPostsByUser(
    userId: string,
    includeDeleted: boolean = false
  ): Promise<IPost[]> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", StatusCode.BAD_REQUEST);
      }

      const query: any = { author: new Types.ObjectId(userId) };
      if (!includeDeleted) {
        query.isDeleted = false;
      }

      return await PostModel.find(query)
        .populate("author", "_id username name profilePic community.isVerified")
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while fetching user posts",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async bulkDeletePosts(postIds: string[]): Promise<boolean> {
    try {
      const validIds = postIds.filter((id) => Types.ObjectId.isValid(id));

      if (validIds.length === 0) {
        return false;
      }

      const result = await PostModel.updateMany(
        { _id: { $in: validIds.map((id) => new Types.ObjectId(id)) } },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      throw new CustomError(
        "Database error while bulk deleting posts",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Helper methods
  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const hashtags = content.match(hashtagRegex);
    return hashtags ? hashtags.map((tag) => tag.slice(1).toLowerCase()) : [];
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@[a-zA-Z0-9_]+/g;
    const mentions = content.match(mentionRegex);
    return mentions
      ? mentions.map((mention) => mention.slice(1).toLowerCase())
      : [];
  }

  async getPostCountByUsersAfterDate(
    userIds: string[],
    date: Date
  ): Promise<number> {
    try {
      const validUserIds = userIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      if (validUserIds.length === 0) {
        return 0;
      }

      const result = await PostModel.countDocuments({
        author: { $in: validUserIds },
        createdAt: { $gte: date },
      });

      return result;
    } catch (error) {
      throw new CustomError(
        "Database error while fetching post count by users",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
    return PostModel.countDocuments({
      author: { $in: userIds },
      createdAt: { $gte: date },
    })
  }

  async deletePostByAdmin(
    postId: string,
    adminId: string,
    reason?: string
  ): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(postId) || !Types.ObjectId.isValid(adminId)) {
        throw new CustomError(
          "Invalid post or admin ID",
          StatusCode.BAD_REQUEST
        );
      }

      const post = await PostModel.findById(postId);
      if (!post) {
        throw new CustomError("Post not found", StatusCode.NOT_FOUND);
      }

      if (post.author.toString() !== adminId) {
        post.isDeleted = true;
        post.deletedAt = new Date();
        await post.save();
      } else {
        post.isDeleted = true;
        post.deletedAt = new Date();
        await post.save();
      }

      return true;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Database error while deleting post",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPostsByUserIds(
    userIds: string[],
    cursor?: string,
    limit: number = 10
  ): Promise<PostsListResponseDto> {
    const validUserIds = userIds
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    if (validUserIds.length === 0) {
      return {
        posts: [],
        nextCursor: undefined,
        hasMore: false
      };
    }

    const query: any = {
      author: { $in: validUserIds },
      isDeleted: false
    };

    // If cursor provided, only get posts created before it
    if (cursor && Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    // Fetch posts sorted by creation date (newest first)
    const posts = await PostModel.find(query)
      .populate("author", "_id username name profilePic community.isVerified")
      .sort({ _id: -1 })
      .limit(limit + 1) // +1 to check for hasMore
      .lean()
      .exec();

    const hasMore = posts.length > limit;
    const finalPosts = posts.slice(0, limit);

    // Transform IPost to PostResponseDto with proper type assertion
    const transformedPosts: PostResponseDto[] = finalPosts.map((post: any) => {
      // Type assertion for populated author
      const author = post.author as {
        _id: Types.ObjectId;
        username: string;
        name: string;
        profilePic: string;
        community?: { isVerified: boolean };
      };

      return {
        _id: post._id.toString(),
        author: {
          _id: author._id.toString(),
          username: author.username,
          name: author.name,
          profilePic: author.profilePic,
          isVerified: author.community?.isVerified || false
        },
        content: post.content,
        mediaUrls: post.mediaUrls || [],
        mediaType: post.mediaType,
        hashtags: post.hashtags || [],
        mentions: post.mentions || [],
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        sharesCount: post.sharesCount || 0,
        // Default values for required fields (can be overridden in service layer)
        isLiked: false,
        isOwnPost: false,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        editedAt: post.editedAt
      };
    });

    const nextCursor = hasMore && finalPosts.length > 0
      ? finalPosts[finalPosts.length - 1]._id.toString()
      : undefined;

    return {
      posts: transformedPosts,
      nextCursor,
      hasMore
    };
  }

  /**
   * Count total number of posts across multiple users.
   */
  async getPostCountByUsers(userIds: string[]): Promise<number> {
    const count = await PostModel.countDocuments({ author: { $in: userIds } });
    return count;
  }


}
