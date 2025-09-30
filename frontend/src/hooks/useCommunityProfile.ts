import { useCallback, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RootState } from '@/redux/store';
import { 
  setLoading,
  setProfile,
  setError,
  clearError,
  setViewedProfileLoading,
  setViewedProfile,
  clearViewedProfile,
  setUpdating,
  setUploadingBanner,
  clearCommunityProfileData,
  updateViewedProfileFollowStatus
} from '@/redux/slices/communityProfileSlice';
import { logout } from '@/redux/slices/userAuthSlice';
import { communityApiService, CommunityProfile, UpdateCommunityProfileData } from '@/services/communityApiService';

export const useCommunityProfile = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  // Add safety check for communityProfile state
  const communityProfileState = useSelector((state: RootState) => state?.communityProfile || {});
  const userAuthState = useSelector((state: RootState) => state?.userAuth || {});
  
  // Provide default values if state is undefined
  const { 
    profile = null, 
    loading = false, 
    error = null, 
    viewedProfile = null, 
    viewedProfileLoading = false, 
    updating = false, 
    uploadingBanner = false 
  } = communityProfileState;
  
  const { user = null } = userAuthState;

  // Fetch own community profile with force refresh option
  const fetchCommunityProfile = useCallback(async (forceRefresh: boolean = false): Promise<CommunityProfile | null> => {
    if (!user) {
      console.log('No user found, redirecting to login');
      router.replace("/user/login");
      return null;
    }

    // If we already have profile and not forcing refresh, return existing
    if (profile && !forceRefresh && !loading) {
      return profile;
    }

    if (loading && !forceRefresh) {
      console.log('Already loading, skipping request');
      return profile;
    }

    dispatch(setLoading(true));
    dispatch(clearError());
    
    try {
      console.log('Fetching community profile for user:', user._id);
      const response = await communityApiService.getCommunityProfile();
      dispatch(setProfile(response.data));
      setRetryCount(0);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch community profile";
      console.error('Fetch community profile error:', errorMessage);
      
      if (errorMessage.includes("not authenticated") || errorMessage.includes("401")) {
        toast.error("Session expired", { description: "Please log in again" });
        dispatch(logout());
        dispatch(clearCommunityProfileData());
        router.replace("/user/login");
        return null;
      }
      
      dispatch(setError(errorMessage));
      
      // Retry logic with exponential backoff
      if (retryCount < maxRetries && !forceRefresh) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchCommunityProfile(true);
        }, delay);
      } else {
        toast.error("Error loading profile", { description: errorMessage });
      }
      
      return null;
    } finally {
      dispatch(setLoading(false));
    }
  }, [user, dispatch, router, retryCount, maxRetries, profile, loading]);

  // Fetch community profile by username with better caching
  const fetchCommunityProfileByUsername = useCallback(async (username: string, forceRefresh: boolean = false): Promise<CommunityProfile | null> => {
    if (!username) {
      toast.error("Invalid username");
      return null;
    }

    // Check if this is for the currently viewed profile and we don't need to refresh
    if (viewedProfile && viewedProfile.username === username && !forceRefresh && !viewedProfileLoading) {
      return viewedProfile;
    }

    dispatch(setViewedProfileLoading(true));
    try {
      console.log('Fetching profile for username:', username);
      const response = await communityApiService.getCommunityProfileByUsername(username);
      dispatch(setViewedProfile(response.data));
      return response.data;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch community profile";
      console.error('Fetch profile by username error:', errorMessage);
      
      if (errorMessage.includes("not found")) {
        toast.error("User not found", { description: `@${username} doesn't exist` });
      } else if (errorMessage.includes("private")) {
        toast.error("Private profile", { description: "This profile is private" });
      } else {
        toast.error("Error loading profile", { description: errorMessage });
      }
      
      return null;
    } finally {
      dispatch(setViewedProfileLoading(false));
    }
  }, [dispatch, viewedProfile, viewedProfileLoading]);

  // Update follow status for viewed profile
  const updateFollowStatus = useCallback((username: string, isFollowing: boolean, followersCount: number) => {
    if (viewedProfile && viewedProfile.username === username) {
      dispatch(updateViewedProfileFollowStatus({ isFollowing, followersCount }));
    }
    
    // Also update own profile if we're viewing our own profile
    if (profile && profile.username === username) {
      dispatch(setProfile({
        ...profile,
        isFollowing,
        followersCount
      }));
    }
  }, [dispatch, viewedProfile, profile]);

  // Clear profile data when user logs out
  const clearProfileData = useCallback(() => {
    dispatch(clearCommunityProfileData());
  }, [dispatch]);

  // Update community profile
  const updateCommunityProfile = useCallback(async (data: UpdateCommunityProfileData): Promise<boolean> => {
    if (!data || Object.keys(data).length === 0) {
      toast.error("No data to update");
      return false;
    }

    dispatch(setUpdating(true));
    try {
      const response = await communityApiService.updateCommunityProfile(data);
      if (response.success && response.data) {
        dispatch(setProfile(response.data));
        toast.success("Profile updated successfully");
        return true;
      } else {
        toast.error("Failed to update profile", { description: response.error });
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to update profile";
      console.error('Update profile error:', errorMessage);
      toast.error("Failed to update profile", { description: errorMessage });
      return false;
    } finally {
      dispatch(setUpdating(false));
    }
  }, [dispatch]);

  // Upload banner image
  const uploadBannerImage = useCallback(async (file: File): Promise<boolean> => {
    if (!file) {
      toast.error("No file selected");
      return false;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type", { description: "Only JPEG and PNG files are allowed" });
      return false;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("File too large", { description: "Maximum file size is 5MB" });
      return false;
    }

    dispatch(setUploadingBanner(true));
    try {
      const response = await communityApiService.uploadBannerImage(file);
      if (response.success && response.data) {
        dispatch(setProfile(response.data));
        toast.success("Banner image updated successfully");
        return true;
      } else {
        toast.error("Failed to upload banner image", { description: response.error });
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to upload banner image";
      console.error('Upload banner error:', errorMessage);
      toast.error("Failed to upload banner image", { description: errorMessage });
      return false;
    } finally {
      dispatch(setUploadingBanner(false));
    }
  }, [dispatch]);

  // Clear viewed profile when component unmounts
  const clearViewedProfileData = useCallback(() => {
    dispatch(clearViewedProfile());
  }, [dispatch]);

  // Retry function
  const retry = useCallback(() => {
    dispatch(clearError());
    setRetryCount(0);
    return fetchCommunityProfile(true);
  }, [dispatch, fetchCommunityProfile]);

  // Clear error
  const clearProfileError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    profile,
    loading,
    error,
    viewedProfile,
    viewedProfileLoading,
    updating,
    uploadingBanner,
    fetchCommunityProfile,
    fetchCommunityProfileByUsername,
    updateCommunityProfile,
    uploadBannerImage,
    updateFollowStatus,
    clearProfileData,
    clearViewedProfileData,
    clearError: clearProfileError,
    retry
  };
};

export default useCommunityProfile;