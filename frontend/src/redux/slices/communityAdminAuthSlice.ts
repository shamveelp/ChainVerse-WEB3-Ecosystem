import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CommunityAdminType {
  _id: string;
  name: string;
  email: string;
  communityId?: string;
  isActive: boolean;
  lastLogin?: Date;
}

// Define serializable application data interface (excluding File objects)
interface SerializableApplicationData {
  communityName: string;
  email: string;
  username: string;
  walletAddress: string;
  description: string;
  category: string;
  whyChooseUs: string;
  rules: string[];
  socialLinks: {
    twitter: string;
    discord: string;
    telegram: string;
    website: string;
  };
  // Store only file names/paths, not File objects
  logoFileName?: string;
  bannerFileName?: string;
}

interface CommunityAdminAuthState {
  communityAdmin: CommunityAdminType | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  applicationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  tempEmail: string | null;
  tempApplicationData: SerializableApplicationData | null;
  subscription: Subscription | null; // Add subscription
}

interface Subscription {
  communityId: string;
  plan: "lifetime";
  status: "active" | "inactive" | "pending";
  paymentId?: string;
  orderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const initialState: CommunityAdminAuthState = {
  communityAdmin: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  applicationStatus: 'none',
  tempEmail: null,
  tempApplicationData: null,
  subscription: null,
};

export const communityAdminAuthSlice = createSlice({
  name: 'communityAdminAuth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<any>) => {
      const payload = action.payload;
      state.communityAdmin = {
        _id: payload._id,
        name: payload.name,
        email: payload.email,
        communityId: payload.communityId,
        isActive: payload.isActive,
        lastLogin: payload.lastLogin,
      };
      state.token = payload.token;
      state.isAuthenticated = true;
      state.applicationStatus = 'approved';
    },
    logout: (state) => {
      state.communityAdmin = null;
      state.token = null;
      state.isAuthenticated = false;
      state.applicationStatus = 'none';
      state.subscription = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setApplicationStatus: (state, action: PayloadAction<'none' | 'pending' | 'approved' | 'rejected'>) => {
      state.applicationStatus = action.payload;
    },
    setTempEmail: (state, action: PayloadAction<string | null>) => {
      state.tempEmail = action.payload;
    },
    // Fixed: Only store serializable data, excluding File objects
    setTempApplicationData: (state, action: PayloadAction<SerializableApplicationData>) => {
      state.tempApplicationData = action.payload;
    },
    clearTempData: (state) => {
      state.tempEmail = null;
      state.tempApplicationData = null;
    },
    updateToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    setSubscription: (state, action: PayloadAction<Subscription | null>) => {
      state.subscription = action.payload;
    },
  },
});

export const { 
  login, 
  logout, 
  setLoading, 
  setApplicationStatus, 
  setTempEmail, 
  setTempApplicationData, 
  clearTempData,
  updateToken,
  setSubscription
} = communityAdminAuthSlice.actions;

export default communityAdminAuthSlice.reducer;