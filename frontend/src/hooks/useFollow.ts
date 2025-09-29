import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { communityApiService, FollowListResponse, UserFollowInfo } from '@/services/communityApiService';

export const useFollow = () => {
  const [loading, setLoading] = useState(false);
  const [followersData, setFollowersData] = useState<FollowListResponse | null>(null);
  const [followingData, setFollowingData] = useState<FollowListResponse | null>(null);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const followUser = useCallback(async (username: string): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await communityApiService.followUser(username);
      toast.success(result.message || `You are now following @${username}`);
      return true;
    } catch (error: any) {
      toast.error("Failed to follow user", { description: error.message });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unfollowUser = useCallback(async (username: string): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await communityApiService.unfollowUser(username);
      toast.success(result.message || `You unfollowed @${username}`);
      return true;
    } catch (error: any) {
      toast.error("Failed to unfollow user", { description: error.message });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFollowers = useCallback(async (cursor?: string): Promise<void> => {
    setLoadingFollowers(true);
    try {
      const result = await communityApiService.getFollowers(cursor);
      setFollowersData(result);
    } catch (error: any) {
      toast.error("Failed to load followers", { description: error.message });
    } finally {
      setLoadingFollowers(false);
    }
  }, []);

  const getFollowing = useCallback(async (cursor?: string): Promise<void> => {
    setLoadingFollowing(true);
    try {
      const result = await communityApiService.getFollowing(cursor);
      setFollowingData(result);
    } catch (error: any) {
      toast.error("Failed to load following", { description: error.message });
    } finally {
      setLoadingFollowing(false);
    }
  }, []);

  const getUserFollowers = useCallback(async (username: string, cursor?: string): Promise<void> => {
    setLoadingFollowers(true);
    try {
      const result = await communityApiService.getUserFollowers(username, cursor);
      setFollowersData(result);
    } catch (error: any) {
      toast.error("Failed to load followers", { description: error.message });
    } finally {
      setLoadingFollowers(false);
    }
  }, []);

  const getUserFollowing = useCallback(async (username: string, cursor?: string): Promise<void> => {
    setLoadingFollowing(true);
    try {
      const result = await communityApiService.getUserFollowing(username, cursor);
      setFollowingData(result);
    } catch (error: any) {
      toast.error("Failed to load following", { description: error.message });
    } finally {
      setLoadingFollowing(false);
    }
  }, []);

  const loadMoreFollowers = useCallback(async (username?: string): Promise<void> => {
    if (!followersData?.hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const result = username 
        ? await communityApiService.getUserFollowers(username, followersData.nextCursor)
        : await communityApiService.getFollowers(followersData.nextCursor);
      
      setFollowersData(prev => prev ? {
        ...result,
        users: [...prev.users, ...result.users]
      } : result);
    } catch (error: any) {
      toast.error("Failed to load more followers", { description: error.message });
    } finally {
      setLoadingMore(false);
    }
  }, [followersData, loadingMore]);

  const loadMoreFollowing = useCallback(async (username?: string): Promise<void> => {
    if (!followingData?.hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const result = username 
        ? await communityApiService.getUserFollowing(username, followingData.nextCursor)
        : await communityApiService.getFollowing(followingData.nextCursor);
      
      setFollowingData(prev => prev ? {
        ...result,
        users: [...prev.users, ...result.users]
      } : result);
    } catch (error: any) {
      toast.error("Failed to load more following", { description: error.message });
    } finally {
      setLoadingMore(false);
    }
  }, [followingData, loadingMore]);

  const updateUserFollowStatus = useCallback((userId: string, isFollowing: boolean): void => {
    // Update followers list
    setFollowersData(prev => prev ? {
      ...prev,
      users: prev.users.map(user => 
        user._id === userId ? { ...user, isFollowing } : user
      )
    } : null);

    // Update following list
    setFollowingData(prev => prev ? {
      ...prev,
      users: prev.users.map(user => 
        user._id === userId ? { ...user, isFollowing } : user
      )
    } : null);
  }, []);

  const clearFollowersData = useCallback(() => {
    setFollowersData(null);
  }, []);

  const clearFollowingData = useCallback(() => {
    setFollowingData(null);
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
    clearFollowingData
  };
};

export default useFollow;