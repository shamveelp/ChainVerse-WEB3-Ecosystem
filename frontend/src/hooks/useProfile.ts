// frontend/src/hooks/useProfile.ts
"use client";
import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { userApiService } from "@/services/userApiServices";
import { login, setLoading } from "@/redux/slices/userAuthSlice";

// Use any for local data to avoid conflict with Redux types
interface UserProfile {
  _id: string;
  username: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
  stats?: {
    followersCount: number;
    followingCount: number;
    postsCount: number;
  };
  profileImage?: string;
  [key: string]: unknown;
}

interface UsernameCheck {
  checking: boolean;
  available: boolean;
  lastChecked: string;
}

export const useProfile = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.userAuth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLocalLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheck>({
    checking: false,
    available: false,
    lastChecked: "",
  });

  const fetchProfile = useCallback(async () => {
    dispatch(setLoading(true));
    setLocalLoading(true);
    setError(null);
    try {
      const response = await userApiService.getProfile();
      if (response.success && response.data) {
        const userData: UserProfile = {
          _id: response.data._id,
          username: response.data.username,
          email: response.data.email,
          // profileImage: response.data.profilePic,
          name: response.data.name,
          phone: response.data.phone,
          createdAt: String(response.data.createdAt),
          stats: {
            followersCount: response.data.followersCount,
            followingCount: response.data.followingCount,
            postsCount: 0 // Placeholder as it's not in the API response yet
          },
        };
        setProfile(userData);
        dispatch(login({ user: userData })); // Update Redux with user data
      } else {
        setError(response.error || "Failed to fetch profile");
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to fetch profile");
    } finally {
      dispatch(setLoading(false));
      setLocalLoading(false);
    }
  }, [dispatch]);

  const updateUserProfile = useCallback(
    async (data: { name: string; username: string; phone?: string; profilePic?: string }) => {
      dispatch(setLoading(true));
      setLocalLoading(true);
      setError(null);
      try {
        const response = await userApiService.updateProfile(data);
        if (response.success && response.data) {
          const userData: UserProfile = {
            _id: response.data._id,
            username: response.data.username,
            email: response.data.email,
            // profileImage: response.data.profilePic,
            name: response.data.name,
            phone: response.data.phone,
            createdAt: String(response.data.createdAt),
            stats: {
              followersCount: response.data.followersCount,
              followingCount: response.data.followingCount,
              postsCount: 0
            },
          };
          setProfile(userData);
          dispatch(login({ user: userData })); // Update Redux with new profile
          return true;
        }
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Failed to update profile");
        return false;
      } finally {
        dispatch(setLoading(false));
        setLocalLoading(false);
      }
    },
    [dispatch]
  );

  const checkUsername = useCallback(async (username: string) => {
    setUsernameCheck({ checking: true, available: false, lastChecked: username });
    try {
      const response = await userApiService.checkUsernameAvailability(username);
      setUsernameCheck({
        checking: false,
        available: !!response.available,
        lastChecked: username,
      });
    } catch (err) {
      const error = err as Error;
      setUsernameCheck({
        checking: false,
        available: false,
        lastChecked: username,
      });
      setError(error.message || "Failed to check username");
    }
  }, []);

  const uploadProfileImage = useCallback(
    async (file: File) => {
      dispatch(setLoading(true));
      setLocalLoading(true);
      setError(null);
      try {
        const response = await userApiService.uploadProfileImage(file);
        if (response.success) {
          const updatedProfile = { ...profile, profileImage: response.imageUrl } as UserProfile;
          setProfile(updatedProfile);
          dispatch(login({ user: updatedProfile }));
          return response;
        } else {
          setError(response.error || "Failed to upload image");
          return response;
        }
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Failed to upload image");
        return { success: false, error: error.message };
      } finally {
        dispatch(setLoading(false));
        setLocalLoading(false);
      }
    },
    [dispatch, profile]
  );

  useEffect(() => {
    if (isAuthenticated && !profile) {
      fetchProfile();
    }
  }, [isAuthenticated, profile, fetchProfile]);

  return {
    profile,
    loading: loading,
    error,
    usernameCheck,
    fetchProfile,
    updateUserProfile,
    checkUsername,
    uploadProfileImage,
  };
};