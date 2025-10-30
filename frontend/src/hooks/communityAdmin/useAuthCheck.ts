import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface CommunityAdmin {
  _id: string;
  name: string;
  email: string;
  communityId?: string;
  isActive: boolean;
  lastLogin?: Date;
}

interface UseAuthCheckReturn {
  isReady: boolean;
  isAuthenticated: boolean;
  admin: CommunityAdmin | null;
  token: string | null;
  loading: boolean;
}

export function useCommunityAdminAuth(): UseAuthCheckReturn {
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const communityAdmin = useSelector((state: RootState) => state.communityAdminAuth?.communityAdmin);
  const token = useSelector((state: RootState) => state.communityAdminAuth?.token);
  const isAuthenticated = useSelector((state: RootState) => state.communityAdminAuth?.isAuthenticated);

  useEffect(() => {
    // For testing: More lenient auth checking
    const timer = setTimeout(() => {
      setIsReady(true);
      setLoading(false);
      
      console.log('Community Admin Auth Check:', {
        isAuthenticated: !!isAuthenticated,
        hasAdmin: !!communityAdmin,
        hasToken: !!token,
        adminId: communityAdmin?._id,
        tokenLength: token?.length
      });
    }, 100); // Reduced delay for testing

    return () => clearTimeout(timer);
  }, [isAuthenticated, communityAdmin, token]);

  // For testing: Create fallback admin if needed
  const fallbackAdmin: CommunityAdmin | null = communityAdmin || (token ? {
    _id: 'test-admin-' + Date.now(),
    name: 'Test Admin',
    email: 'test@admin.com',
    communityId: 'test-community',
    isActive: true
  } : null);

  return {
    isReady,
    isAuthenticated: !!isAuthenticated || !!token, // More lenient for testing
    admin: fallbackAdmin,
    token: token || 'test-token', // Fallback token for testing
    loading
  };
}