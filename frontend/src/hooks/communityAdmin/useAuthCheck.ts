"use client"

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface UseAuthCheckReturn {
  isReady: boolean;
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
}

export function useAuthCheck(): UseAuthCheckReturn {
  const [isReady, setIsReady] = useState(false);
  
  const userAuth = useSelector((state: RootState) => state.userAuth);
  const communityAdminAuth = useSelector((state: RootState) => state.communityAdminAuth);

  useEffect(() => {
    // Add a small delay to ensure Redux persist has rehydrated
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Check if either user or community admin is authenticated
  const isUserAuthenticated = userAuth?.isAuthenticated && userAuth?.user && userAuth?.token;
  const isAdminAuthenticated = communityAdminAuth?.isAuthenticated && communityAdminAuth?.communityAdmin && communityAdminAuth?.token;

  return {
    isReady,
    isAuthenticated: Boolean(isUserAuthenticated || isAdminAuthenticated),
    user: userAuth?.user || communityAdminAuth?.communityAdmin || null,
    token: userAuth?.token || communityAdminAuth?.token || null,
  };
}

export function useCommunityAdminAuth() {
  const [isReady, setIsReady] = useState(false);
  
  const communityAdminAuth = useSelector((state: RootState) => state.communityAdminAuth);

  useEffect(() => {
    // Add a small delay to ensure Redux persist has rehydrated
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return {
    isReady,
    isAuthenticated: Boolean(communityAdminAuth?.isAuthenticated && communityAdminAuth?.communityAdmin && communityAdminAuth?.token),
    admin: communityAdminAuth?.communityAdmin || null,
    token: communityAdminAuth?.token || null,
    loading: communityAdminAuth?.loading || false,
  };
}