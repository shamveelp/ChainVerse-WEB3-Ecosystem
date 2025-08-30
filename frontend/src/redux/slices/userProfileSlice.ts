import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  _id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  refferalCode: string;
  refferedBy: string;
  profilePic: string;
  role: "user";
  totalPoints: number;
  isBlocked: boolean;
  isBanned: boolean;
  tokenVersion?: number;
  isEmailVerified: boolean;
  isGoogleUser: boolean;
  dailyCheckin: {
    lastCheckIn: Date | string | null;
    streak: number;
  };
  followersCount: number;
  followingCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ReferralStats {
  totalReferrals: number;
  totalPointsEarned: number;
  referralCode: string;
  referralLink: string;
}

export interface CheckInStatus {
  hasCheckedInToday: boolean;
  currentStreak: number;
  nextCheckInAvailable: Date | null;
}

interface UserProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  
  // Referral data
  referralStats: ReferralStats | null;
  referralHistory: any[];
  referralLoading: boolean;
  
  // Points data
  checkInStatus: CheckInStatus | null;
  pointsHistory: any[];
  pointsSummary: any;
  pointsLoading: boolean;
}

const initialState: UserProfileState = {
  profile: null,
  loading: false,
  error: null,
  
  // Referral
  referralStats: null,
  referralHistory: [],
  referralLoading: false,
  
  // Points
  checkInStatus: null,
  pointsHistory: [],
  pointsSummary: null,
  pointsLoading: false,
};

export const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    // Profile actions
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setProfile: (state, action: PayloadAction<UserProfile>) => {
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
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    
    // Referral actions
    setReferralLoading: (state, action: PayloadAction<boolean>) => {
      state.referralLoading = action.payload;
    },
    setReferralStats: (state, action: PayloadAction<ReferralStats>) => {
      state.referralStats = action.payload;
    },
    setReferralHistory: (state, action: PayloadAction<any[]>) => {
      state.referralHistory = action.payload;
    },
    appendReferralHistory: (state, action: PayloadAction<any[]>) => {
      state.referralHistory.push(...action.payload);
    },
    
    // Points actions
    setPointsLoading: (state, action: PayloadAction<boolean>) => {
      state.pointsLoading = action.payload;
    },
    setCheckInStatus: (state, action: PayloadAction<CheckInStatus>) => {
      state.checkInStatus = action.payload;
    },
    setPointsHistory: (state, action: PayloadAction<any[]>) => {
      state.pointsHistory = action.payload;
    },
    appendPointsHistory: (state, action: PayloadAction<any[]>) => {
      state.pointsHistory.push(...action.payload);
    },
    setPointsSummary: (state, action: PayloadAction<any>) => {
      state.pointsSummary = action.payload;
    },
    updateTotalPoints: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.totalPoints = action.payload;
      }
    },
    updateStreak: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.dailyCheckin.streak = action.payload;
      }
    },
    
    // Clear all data
    clearProfileData: (state) => {
      state.profile = null;
      state.referralStats = null;
      state.referralHistory = [];
      state.checkInStatus = null;
      state.pointsHistory = [];
      state.pointsSummary = null;
      state.error = null;
    },
  },
});

export const { 
  setLoading, 
  setProfile, 
  setError, 
  clearError, 
  updateProfile,
  setReferralLoading,
  setReferralStats,
  setReferralHistory,
  appendReferralHistory,
  setPointsLoading,
  setCheckInStatus,
  setPointsHistory,
  appendPointsHistory,
  setPointsSummary,
  updateTotalPoints,
  updateStreak,
  clearProfileData,
} = userProfileSlice.actions;

export default userProfileSlice.reducer;