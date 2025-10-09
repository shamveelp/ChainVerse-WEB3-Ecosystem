import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CommunityAdminType {
  _id: string;
  name: string;
  email: string;
  communityId?: string;
  isActive: boolean;
  lastLogin?: Date;
}

interface CommunityAdminAuthState {
  communityAdmin: CommunityAdminType | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  applicationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  tempEmail: string | null;
  tempApplicationData: any;
}

const initialState: CommunityAdminAuthState = {
  communityAdmin: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  applicationStatus: 'none',
  tempEmail: null,
  tempApplicationData: null,
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
    setTempApplicationData: (state, action: PayloadAction<any>) => {
      state.tempApplicationData = action.payload;
    },
    clearTempData: (state) => {
      state.tempEmail = null;
      state.tempApplicationData = null;
    },
    updateToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
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
  updateToken
} = communityAdminAuthSlice.actions;

export default communityAdminAuthSlice.reducer;