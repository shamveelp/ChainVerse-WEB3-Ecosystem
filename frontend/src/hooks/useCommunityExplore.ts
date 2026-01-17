import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  setSearchLoading,
  setSearchResults,
  setSearchQuery,
  setSearchFilter,
  clearSearchResults,
  setPopularLoading,
  setPopularCommunities,
  setCurrentCommunityLoading,
  setCurrentCommunity,
  updateCommunityMembership,
  setError,
  clearError,
} from '@/redux/slices/communityExploreSlice';
import {
  communityExploreApiService,
  type Community,
  type SearchResponse,
  type CommunityProfile
} from '@/services/userCommunityServices/communityExploreApiService';
import { toast } from 'sonner';

export const useCommunityExplore = () => {
  const dispatch = useDispatch();
  const {
    searchResults,
    searchLoading,
    searchQuery,
    searchFilter,
    popularCommunities,
    popularLoading,
    currentCommunity,
    currentCommunityLoading,
    error,
  } = useSelector((state: RootState) => state.communityExplore);

  // Search communities and users
  const searchCommunities = useCallback(async (
    query: string,
    type: string = 'all',
    cursor?: string,
    limit: number = 20
  ): Promise<SearchResponse | null> => {
    if (!query.trim()) {
      dispatch(clearSearchResults());
      return null;
    }

    try {
      dispatch(setSearchLoading(true));
      dispatch(clearError());

      const results = await communityExploreApiService.search(query.trim(), type, cursor, limit);

      dispatch(setSearchResults(results));
      dispatch(setSearchQuery(query.trim()));
      dispatch(setSearchFilter(type));

      return results;
    } catch (err) {
      const error  = err as Error;
      console.error('Search failed:', error);
      dispatch(setError(error.message || 'Search failed'));
      toast.error('Search failed', {
        description: error.message || 'Please try again'
      });
      return null;
    } finally {
      dispatch(setSearchLoading(false));
    }
  }, [dispatch]);

  // Get popular communities
  const getPopularCommunities = useCallback(async (
    cursor?: string,
    limit: number = 20,
    category?: string
  ): Promise<Community[]> => {
    try {
      dispatch(setPopularLoading(true));
      dispatch(clearError());

      const response = await communityExploreApiService.getPopularCommunities(cursor, limit, category);

      dispatch(setPopularCommunities(response.communities));
      return response.communities;
    } catch (err) {
      const error  = err as Error;
      console.error('Failed to get popular communities:', error);
      dispatch(setError(error.message || 'Failed to load popular communities'));
      toast.error('Failed to load popular communities', {
        description: error.message || 'Please try again'
      });
      return [];
    } finally {
      dispatch(setPopularLoading(false));
    }
  }, [dispatch]);

  // Get community profile
  const getCommunityProfile = useCallback(async (username: string): Promise<CommunityProfile | null> => {
    if (!username.trim()) {
      dispatch(setError('Community username is required'));
      return null;
    }

    try {
      dispatch(setCurrentCommunityLoading(true));
      dispatch(clearError());

      const community = await communityExploreApiService.getCommunityProfile(username.trim());

      dispatch(setCurrentCommunity(community));
      return community;
    } catch (err) {
      const error = err as Error;
      console.error('Failed to get community profile:', error);
      dispatch(setError(error.message || 'Failed to load community profile'));
      toast.error('Failed to load community', {
        description: error.message || 'Please try again'
      });
      return null;
    } finally {
      dispatch(setCurrentCommunityLoading(false));
    }
  }, [dispatch]);

  // Join community
  const joinCommunity = useCallback(async (communityUsername: string): Promise<boolean> => {
    if (!communityUsername.trim()) {
      toast.error('Community username is required');
      return false;
    }

    try {
      const result = await communityExploreApiService.joinCommunity(communityUsername.trim());

      if (result.success) {
        // Find community ID from current state to update membership
        let communityId: string | null = null;

        if (currentCommunity && currentCommunity.username === communityUsername.trim()) {
          communityId = currentCommunity._id;
        } else {
          // Try to find in search results or popular communities
          const foundInSearch = searchResults?.communities.find(c => c.username === communityUsername.trim());
          const foundInPopular = popularCommunities.find(c => c.username === communityUsername.trim());
          communityId = foundInSearch?._id || foundInPopular?._id || null;
        }

        if (communityId) {
          dispatch(updateCommunityMembership({
            communityId,
            isMember: true,
            memberCount: result.memberCount
          }));
        }

        toast.success(result.message);
        return true;
      }

      return false;
    } catch (err) {
      const error = err as Error;
      console.error('Join community failed:', error);
      toast.error('Failed to join community', {
        description: error.message || 'Please try again'
      });
      return false;
    }
  }, [dispatch, currentCommunity, searchResults, popularCommunities]);

  // Leave community
  const leaveCommunity = useCallback(async (communityUsername: string): Promise<boolean> => {
    if (!communityUsername.trim()) {
      toast.error('Community username is required');
      return false;
    }

    try {
      const result = await communityExploreApiService.leaveCommunity(communityUsername.trim());

      if (result.success) {
        // Find community ID from current state to update membership
        let communityId: string | null = null;

        if (currentCommunity && currentCommunity.username === communityUsername.trim()) {
          communityId = currentCommunity._id;
        } else {
          // Try to find in search results or popular communities
          const foundInSearch = searchResults?.communities.find(c => c.username === communityUsername.trim());
          const foundInPopular = popularCommunities.find(c => c.username === communityUsername.trim());
          communityId = foundInSearch?._id || foundInPopular?._id || null;
        }

        if (communityId) {
          dispatch(updateCommunityMembership({
            communityId,
            isMember: false,
            memberCount: result.memberCount
          }));
        }

        toast.success(result.message);
        return true;
      }

      return false;
    } catch (err) {
      const error = err as Error;
      console.error('Leave community failed:', error);
      toast.error('Failed to leave community', {
        description: error.message || 'Please try again'
      });
      return false;
    }
  }, [dispatch, currentCommunity, searchResults, popularCommunities]);

  // Clear search
  const clearSearch = useCallback(() => {
    dispatch(clearSearchResults());
  }, [dispatch]);

  // Clear error
  const clearErrors = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    searchResults,
    searchLoading,
    searchQuery,
    searchFilter,
    popularCommunities,
    popularLoading,
    currentCommunity,
    currentCommunityLoading,
    error,

    // Actions
    searchCommunities,
    getPopularCommunities,
    getCommunityProfile,
    joinCommunity,
    leaveCommunity,
    clearSearch,
    clearErrors,
  };
};