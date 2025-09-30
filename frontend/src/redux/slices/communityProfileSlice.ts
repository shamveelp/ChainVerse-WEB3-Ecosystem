import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CommunityProfile {
  _id: string;
  username: string;
  name: string;
  email: string;
  profilePic: string;
  followersCount: number;
  followingCount: number;
  bio: string;
  location: string;
  website: string;
  bannerImage: string;
  isVerified: boolean;
  postsCount: number;
  likesReceived: number;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
  };
  settings: {
    isProfilePublic: boolean;
    allowDirectMessages: boolean;
    showFollowersCount: boolean;
    showFollowingCount: boolean;
  };
  joinDate: Date | string;
  isOwnProfile: boolean;
  isFollowing?: boolean; // Add this property to fix the type error
}

interface CommunityProfileState {
  profile: CommunityProfile | null;
  loading: boolean;
  error: string | null;
  
  // Profile by username (for viewing other profiles)
  viewedProfile: CommunityProfile | null;
  viewedProfileLoading: boolean;
  
  // Update states
  updating: boolean;
  uploadingBanner: boolean;
}

const initialState: CommunityProfileState = {
  profile: null,
  loading: false,
  error: null,
  
  viewedProfile: null,
  viewedProfileLoading: false,
  
  updating: false,
  uploadingBanner: false,
};

export const communityProfileSlice = createSlice({
  name: 'communityProfile',
  initialState,
  reducers: {
    // Own profile actions
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setProfile: (state, action: PayloadAction<CommunityProfile>) => {
      state.profile = action.payload;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateProfile: (state, action: PayloadAction<Partial<CommunityProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    
    // Viewed profile actions (for other users)
    setViewedProfileLoading: (state, action: PayloadAction<boolean>) => {
      state.viewedProfileLoading = action.payload;
    },
    setViewedProfile: (state, action: PayloadAction<CommunityProfile>) => {
      state.viewedProfile = action.payload;
    },
    clearViewedProfile: (state) => {
      state.viewedProfile = null;
    },
    updateViewedProfileFollowStatus: (state, action: PayloadAction<{ isFollowing: boolean; followersCount: number }>) => {
      if (state.viewedProfile) {
        state.viewedProfile.isFollowing = action.payload.isFollowing;
        state.viewedProfile.followersCount = action.payload.followersCount;
      }
    },
    
    // Update states
    setUpdating: (state, action: PayloadAction<boolean>) => {
      state.updating = action.payload;
    },
    setUploadingBanner: (state, action: PayloadAction<boolean>) => {
      state.uploadingBanner = action.payload;
    },
    
    // Stats updates
    updateFollowersCount: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.followersCount = action.payload;
      }
    },
    updateFollowingCount: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.followingCount = action.payload;
      }
    },
    incrementPostsCount: (state) => {
      if (state.profile) {
        state.profile.postsCount += 1;
      }
    },
    updateLikesReceived: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.likesReceived += action.payload;
      }
    },
    
    // Clear all data
    clearCommunityProfileData: (state) => {
      state.profile = null;
      state.viewedProfile = null;
      state.error = null;
      state.loading = false;
      state.viewedProfileLoading = false;
      state.updating = false;
      state.uploadingBanner = false;
    },
  },
});

export const { 
  setLoading, 
  setProfile, 
  setError, 
  clearError, 
  updateProfile,
  setViewedProfileLoading,
  setViewedProfile,
  clearViewedProfile,
  updateViewedProfileFollowStatus,
  setUpdating,
  setUploadingBanner,
  updateFollowersCount,
  updateFollowingCount,
  incrementPostsCount,
  updateLikesReceived,
  clearCommunityProfileData,
} = communityProfileSlice.actions;

export default communityProfileSlice.reducer;