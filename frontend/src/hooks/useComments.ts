import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { postsApiService, Comment, CommentsListResponse, CreateCommentData } from '@/services/postsApiService';

export const useComments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  // Create comment
  const createComment = useCallback(async (commentData: CreateCommentData): Promise<Comment | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await postsApiService.createComment(commentData);
      const newComment = response.data;

      // Add new comment to the beginning of the list if it's a top-level comment
      if (!commentData.parentCommentId) {
        setComments(prevComments => [newComment, ...prevComments]);
      }

      toast.success('Comment added successfully!');
      return newComment;
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || 'Failed to create comment';
      console.error('Error creating comment:', errorMessage);
      setError(errorMessage);
      toast.error('Failed to add comment', {
        description: errorMessage
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update comment
  const updateComment = useCallback(async (commentId: string, content: string): Promise<Comment | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await postsApiService.updateComment(commentId, content);
      const updatedComment = response.data;

      // Update comment in the list
      setComments(prevComments => prevComments.map(comment =>
        comment._id === commentId ? updatedComment : comment
      ));

      toast.success('Comment updated successfully!');
      return updatedComment;
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || 'Failed to update comment';
      console.error('Error updating comment:', errorMessage);
      setError(errorMessage);
      toast.error('Failed to update comment', {
        description: errorMessage
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete comment
  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await postsApiService.deleteComment(commentId);

      // Remove comment from the list
      setComments(prevComments => prevComments.filter(comment => comment._id !== commentId));

      toast.success('Comment deleted successfully!');
      return true;
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || 'Failed to delete comment';
      console.error('Error deleting comment:', errorMessage);
      setError(errorMessage);
      toast.error('Failed to delete comment', {
        description: errorMessage
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle comment like
  const toggleCommentLike = useCallback(async (commentId: string): Promise<void> => {
    try {
      // Optimistic update
      setComments(prevComments => prevComments.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likesCount: comment.isLiked ? comment.likesCount - 1 : comment.likesCount + 1
          };
        }
        return comment;
      }));

      const response = await postsApiService.toggleCommentLike(commentId);

      // Update with server response
      setComments(prevComments => prevComments.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            isLiked: response.isLiked,
            likesCount: response.likesCount
          };
        }
        return comment;
      }));
    } catch (err) {
      const error = err as Error;
      // Revert optimistic update on error
      setComments(prevComments => prevComments.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likesCount: comment.isLiked ? comment.likesCount + 1 : comment.likesCount - 1
          };
        }
        return comment;
      }));

      const errorMessage = error.message || 'Failed to update like';
      console.error('Error toggling like:', errorMessage);
      toast.error('Failed to update like', {
        description: errorMessage
      });
    }
  }, []);

  // Load comments with pagination
  const loadComments = useCallback(async (
    postId: string,
    refresh: boolean = false
  ): Promise<void> => {
    try {
      setLoading(true);
      if (refresh) {
        setError(null);
      }

      const cursor = refresh ? undefined : nextCursor;
      const response = await postsApiService.getPostComments(postId, cursor);

      if (refresh) {
        setComments(response.comments);
      } else {
        setComments(prevComments => [...prevComments, ...response.comments]);
      }

      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || 'Failed to load comments';
      console.error('Error loading comments:', { postId, error: errorMessage });
      setError(errorMessage);
      if (!refresh) {
        toast.error('Failed to load comments', {
          description: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  }, [nextCursor]);

  // Load comment replies
  const loadReplies = useCallback(async (
    commentId: string
  ): Promise<Comment[]> => {
    try {
      const response = await postsApiService.getCommentReplies(commentId);
      return response.comments;
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || 'Failed to load replies';
      toast.error('Failed to load replies', {
        description: errorMessage
      });
      return [];
    }
  }, []);

  // Refresh comments
  const refreshComments = useCallback(async (postId: string): Promise<void> => {
    setNextCursor(undefined);
    setHasMore(true);
    await loadComments(postId, true);
  }, [loadComments]);

  // Load more comments
  const loadMoreComments = useCallback(async (postId: string): Promise<void> => {
    if (!hasMore || loading) return;
    await loadComments(postId, false);
  }, [loadComments, hasMore, loading]);

  // Clear comments
  const clearComments = useCallback(() => {
    setComments([]);
    setHasMore(true);
    setNextCursor(undefined);
    setError(null);
  }, []);

  // Update comment in list (for external updates)
  const updateCommentInList = useCallback((updatedComment: Comment) => {
    setComments(prevComments => prevComments.map(comment =>
      comment._id === updatedComment._id ? updatedComment : comment
    ));
  }, []);

  return {
    comments,
    loading,
    error,
    hasMore,
    nextCursor,
    createComment,
    updateComment,
    deleteComment,
    toggleCommentLike,
    loadComments,
    loadReplies,
    refreshComments,
    loadMoreComments,
    clearComments,
    updateCommentInList
  };
};

export default useComments;