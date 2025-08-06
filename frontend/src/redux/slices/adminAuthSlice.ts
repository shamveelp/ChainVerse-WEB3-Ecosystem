import { createSlice,type PayloadAction } from '@reduxjs/toolkit';

interface AdminType {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface AdminAuthState {
  admin: AdminType | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AdminAuthState = {
  admin: null,
  token: null,
  isAuthenticated: false,
  loading: false,
};

export const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<any>) => {
      const payload = action.payload;
      state.admin = {
        _id: payload._id,
        name: payload.name,
        email: payload.email,
        profileImage: payload.profileImage,
      };
      state.token = payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.admin = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { login, logout, setLoading } = adminAuthSlice.actions;

export default adminAuthSlice.reducer;
