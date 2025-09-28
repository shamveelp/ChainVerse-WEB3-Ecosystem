import { useEffect, useState } from 'react';
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
  clearCommunityProfileData
} from '@/redux/slices/communityProfileSlice';
import { logout } from '@/redux/slices/userAuthSlice';
import { communityApiService, CommunityProfile, UpdateCommunityProfileData } from '@/services/communityApiService';

export const useCommunityProfile = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  
  // Add safety check for communityProfile state
  const communityProfileState = useSelector((state: RootState) => state.communityProfile);
  const userAuthState = useSelector((state: RootState) => state.userAuth);
  
  // Provide default values if state is undefined
  const { 
    profile = null, 
    loading = false, 
    error = null, 
    viewedProfile = null, 
    viewedProfileLoading = false, 
    updating = false, 
    uploadingBanner = false 
  } = communityProfileState || {};
  
  const { user = null } = userAuthState || {};
  
  const [retryCount, setRetryCount] = useState(0);

  // Fetch own community profile
  const fetchCommunityProfile = async () => {
    if (!user) {
      router.replace("/user/login");
      return;
    }

    dispatch(setLoading(true));
    try {
      const response = await communityApiService.getCommunityProfile();
      dispatch(setProfile(response.data));
      dispatch(clearError());
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch community profile";
      dispatch(setError(errorMessage));
      toast.error("Error loading community profile", { description: errorMessage });
      
      if (errorMessage.includes("not authenticated") || err.message?.includes("401")) {
        dispatch(logout());
        dispatch(clearCommunityProfileData());
        router.replace("/user/login");
      } else if (retryCount < 3) {
        setTimeout(() => setRetryCount(retryCount + 1), 1000 * Math.pow(2, retryCount));
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Fetch community profile by username
  const fetchCommunityProfileByUsername = async (username: string) => {
    dispatch(setViewedProfileLoading(true));
    try {
      const response = await communityApiService.getCommunityProfileByUsername(username);
      dispatch(setViewedProfile(response.data));
      return response.data;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch community profile";
      toast.error("Error loading profile", { description: errorMessage });
      throw err;
    } finally {
      dispatch(setViewedProfileLoading(false));
    }
  };

  // Update community profile
  const updateCommunityProfile = async (data: UpdateCommunityProfileData): Promise<boolean> => {
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
      toast.error("Failed to update profile", { description: err.message });
      return false;
    } finally {
      dispatch(setUpdating(false));
    }
  };

  // Upload banner image
  const uploadBannerImage = async (file: File): Promise<boolean> => {
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
      toast.error("Failed to upload banner image", { description: err.message });
      return false;
    } finally {
      dispatch(setUploadingBanner(false));
    }
  };

  // Clear viewed profile when component unmounts
  const clearViewedProfileData = () => {
    dispatch(clearViewedProfile());
  };

  // Auto-fetch profile on mount
  useEffect(() => {
    if (user && !profile && !loading) {
      fetchCommunityProfile();
    }
  }, [user, profile, loading]);

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
    clearViewedProfileData,
    clearError: () => dispatch(clearError()),
    retry: () => {
      dispatch(clearError());
      setRetryCount(0);
      fetchCommunityProfile();
    }
  };
};

export default useCommunityProfile;