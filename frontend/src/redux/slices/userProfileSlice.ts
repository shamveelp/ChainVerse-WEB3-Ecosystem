import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

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
    lastCheckIn: Date | null;
    streak: number;
  };
  followersCount: number;
  followingCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UserProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  usernameCheck: {
    checking: boolean;
    available: boolean | null;
    lastChecked: string | null;
  };
}

const initialState: UserProfileState = {
  profile: null,
  loading: false,
  error: null,
  usernameCheck: {
    checking: false,
    available: null,
    lastChecked: null,
  },
};

export const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.error = null;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setUsernameChecking: (state, action: PayloadAction<boolean>) => {
      state.usernameCheck.checking = action.payload;
    },
    setUsernameAvailable: (state, action: PayloadAction<{ available: boolean; username: string }>) => {
      state.usernameCheck.available = action.payload.available;
      state.usernameCheck.lastChecked = action.payload.username;
      state.usernameCheck.checking = false;
    },
    clearUsernameCheck: (state) => {
      state.usernameCheck.available = null;
      state.usernameCheck.lastChecked = null;
      state.usernameCheck.checking = false;
    },
  },
});

export const {
  setLoading,
  setProfile,
  updateProfile,
  setError,
  clearError,
  setUsernameChecking,
  setUsernameAvailable,
  clearUsernameCheck,
} = userProfileSlice.actions;

export default userProfileSlice.reducer;