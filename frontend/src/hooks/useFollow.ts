import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { communityApiService, FollowListResponse, UserFollowInfo } from '@/services/communityApiService';

export const useFollow = () => {
  const [loading, setLoading] = useState(false);
  const [followersData, setFollowersData] = useState<FollowListResponse | null>(null);
  const [followingData, setFollowingData] = useState<FollowListResponse | null>(null);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Use refs to store the latest values for callbacks
  const followersDataRef = useRef<FollowListResponse | null>(null);
  const followingDataRef = useRef<FollowListResponse | null>(null);
  const loadingMoreRef = useRef(false);

  // Update refs whenever state changes
  followersDataRef.current = followersData;
  followingDataRef.current = followingData;
  loadingMoreRef.current = loadingMore;

  const followUser = useCallback(async (username: string): Promise<boolean> => {
    if (!username) return false;

    setLoading(true);
    try {
      const result = await communityApiService.followUser(username);
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Follow user error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const unfollowUser = useCallback(async (username: string): Promise<boolean> => {
    if (!username) return false;

    setLoading(true);
    try {
      const result = await communityApiService.unfollowUser(username);
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Unfollow user error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFollowers = useCallback(async (cursor?: string): Promise<void> => {
    setLoadingFollowers(true);
    try {
      const result = await communityApiService.getFollowers(cursor);
      setFollowersData(result);
    } catch (err) {
      const error = err as Error;
      console.error('Get followers error:', error);
      toast.error("Failed to load followers", {
        description: error.message || "Please try again"
      });
      setFollowersData(null);
    } finally {
      setLoadingFollowers(false);
    }
  }, []);

  const getFollowing = useCallback(async (cursor?: string): Promise<void> => {
    setLoadingFollowing(true);
    try {
      const result = await communityApiService.getFollowing(cursor);
      setFollowingData(result);
    } catch (err) {
      const error = err as Error;
      console.error('Get following error:', error);
      toast.error("Failed to load following", {
        description: error.message || "Please try again"
      });
      setFollowingData(null);
    } finally {
      setLoadingFollowing(false);
    }
  }, []);

  const getUserFollowers = useCallback(async (username: string, cursor?: string): Promise<void> => {
    if (!username) return;

    setLoadingFollowers(true);
    try {
      const result = await communityApiService.getUserFollowers(username, cursor);
      setFollowersData(result);
    } catch (err) {
      const error = err as Error;
      console.error('Get user followers error:', error);
      throw error;
    } finally {
      setLoadingFollowers(false);
    }
  }, []);

  const getUserFollowing = useCallback(async (username: string, cursor?: string): Promise<void> => {
    if (!username) return;

    setLoadingFollowing(true);
    try {
      const result = await communityApiService.getUserFollowing(username, cursor);
      setFollowingData(result);
    } catch (err) {
      const error = err as Error;
      console.error('Get user following error:', error);
      throw error;
    } finally {
      setLoadingFollowing(false);
    }
  }, []);

  const loadMoreFollowers = useCallback(async (username?: string): Promise<void> => {
    const currentData = followersDataRef.current;
    const isLoadingMore = loadingMoreRef.current;

    if (!currentData?.hasMore || isLoadingMore) return;

    setLoadingMore(true);
    try {
      const result = username
        ? await communityApiService.getUserFollowers(username, currentData.nextCursor)
        : await communityApiService.getFollowers(currentData.nextCursor);

      setFollowersData(prev => {
        if (!prev) return result;
        return {
          ...result,
          users: [...prev.users, ...result.users]
        };
      });
    } catch (err) {
      const error = err as Error;
      console.error('Load more followers error:', error);
      toast.error("Failed to load more followers", {
        description: error.message || "Please try again"
      });
    } finally {
      setLoadingMore(false);
    }
  }, []);

  const loadMoreFollowing = useCallback(async (username?: string): Promise<void> => {
    const currentData = followingDataRef.current;
    const isLoadingMore = loadingMoreRef.current;

    if (!currentData?.hasMore || isLoadingMore) return;

    setLoadingMore(true);
    try {
      const result = username
        ? await communityApiService.getUserFollowing(username, currentData.nextCursor)
        : await communityApiService.getFollowing(currentData.nextCursor);

      setFollowingData(prev => {
        if (!prev) return result;
        return {
          ...result,
          users: [...prev.users, ...result.users]
        };
      });
    } catch (err) {
      const error = err as Error;
      console.error('Load more following error:', error);
      toast.error("Failed to load more following", {
        description: error.message || "Please try again"
      });
    } finally {
      setLoadingMore(false);
    }
  }, []);

  const updateUserFollowStatus = useCallback((userId: string, isFollowing: boolean): void => {
    if (!userId) return;

    // Update followers list
    setFollowersData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        users: prev.users.map(user =>
          user._id === userId ? { ...user, isFollowing } : user
        )
      };
    });

    // Update following list
    setFollowingData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        users: prev.users.map(user =>
          user._id === userId ? { ...user, isFollowing } : user
        )
      };
    });
  }, []);

  const clearFollowersData = useCallback(() => {
    setFollowersData(null);
  }, []);

  const clearFollowingData = useCallback(() => {
    setFollowingData(null);
  }, []);

  const clearAllData = useCallback(() => {
    setFollowersData(null);
    setFollowingData(null);
    setLoading(false);
    setLoadingFollowers(false);
    setLoadingFollowing(false);
    setLoadingMore(false);
  }, []);

  return {
    loading,
    followersData,
    followingData,
    loadingFollowers,
    loadingFollowing,
    loadingMore,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getUserFollowers,
    getUserFollowing,
    loadMoreFollowers,
    loadMoreFollowing,
    updateUserFollowStatus,
    clearFollowersData,
    clearFollowingData,
    clearAllData
  };
};

export default useFollow;