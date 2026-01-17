import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AdminAuthState {
  isAuthenticated: boolean;
  admin: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLogin: string | null;
  } | null;
  token: string | null;
}

const initialState: AdminAuthState = {
  isAuthenticated: false,
  admin: null,
  token: null,
};

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ admin: NonNullable<AdminAuthState['admin']>; token: string }>) => {
      state.isAuthenticated = true;
      state.admin = action.payload.admin;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.admin = null;
      state.token = null;
    },
    updateToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
  },
});

export const { login, logout, updateToken } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;