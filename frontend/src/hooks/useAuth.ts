"use client";

import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface User {
  _id: string;
  username: string;
  email: string;
  name: string;
  profileImage?: string;
  profilePicture?: string;
  profilePic?: string;
  referralCode?: string;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export function useAuth(): UseAuthReturn {
  const user = useSelector((state: RootState) => state.userAuth.user);
  const isAuthenticated = useSelector((state: RootState) => state.userAuth.isAuthenticated);
  const isLoading = useSelector((state: RootState) => state.userAuth.loading);
  const token = useSelector((state: RootState) => state.userAuth.token);

  return {
    user,
    isAuthenticated,
    isLoading,
    token,
  };
}

