// frontend/src/hooks/useProfile.ts
"use client";
import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { userApiService } from "@/services/userApiServices";
import { login, setLoading } from "@/redux/slices/userAuthSlice";

interface UserType {
  _id: string;
  username: string;
  email: string;
  profileImage?: string;
  name?: string;
  phone?: string;
  createdAt?: string;
  stats?: {
    achievements?: number;
    completedGoals?: number;
    currentStreak?: number;
  };
}

interface UsernameCheck {
  checking: boolean;
  available: boolean;
  lastChecked: string;
}

export const useProfile = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.userAuth);
  const [profile, setProfile] = useState<UserType | null>(null);
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
        const userData: UserType = {
          _id: response.data._id,
          username: response.data.username,
          email: response.data.email,
          // profileImage: response.data.profilePic,
          name: response.data.name,
          phone: response.data.phone,
          createdAt: response.data.createdAt,
          stats: response.data.stats,
        };
        setProfile(userData);
        dispatch(login({ user: userData })); // Update Redux with user data
      } else {
        setError(response.error || "Failed to fetch profile");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch profile");
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
          const userData: UserType = {
            _id: response.data._id,
            username: response.data.username,
            email: response.data.email,
            // profileImage: response.data.profilePic,
            name: response.data.name,
            phone: response.data.phone,
            createdAt: response.data.createdAt,
            stats: response.data.stats,
          };
          setProfile(userData);
          dispatch(login({ user: userData })); // Update Redux with new profile
          return true;
        } else {
          setError(response.error || "Failed to update profile");
          return false;
        }
      } catch (err: any) {
        setError(err.message || "Failed to update profile");
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
        available: response.available,
        lastChecked: username,
      });
    } catch (err: any) {
      setUsernameCheck({
        checking: false,
        available: false,
        lastChecked: username,
      });
      setError(err.message || "Failed to check username");
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
          const updatedProfile = { ...profile, profileImage: response.imageUrl } as UserType;
          setProfile(updatedProfile);
          dispatch(login({ user: updatedProfile }));
          return response;
        } else {
          setError(response.error || "Failed to upload image");
          return response;
        }
      } catch (err: any) {
        setError(err.message || "Failed to upload image");
        return { success: false, error: err.message };
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