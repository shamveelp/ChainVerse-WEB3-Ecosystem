import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

// interfaces
interface UserType {
  _id: string
  name: string
  email: string
  profileImage?: string
}

interface UserAuthState {
  user: UserType | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  // Temporary state for auth flows
  tempEmail: string | null
  tempUserData: {
    name: string
    email: string
    password: string
  } | null
  resetToken: string | null
}

// Initial State
const initialState: UserAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  tempEmail: null,
  tempUserData: null,
  resetToken: null,
}

export const userAuthSlice = createSlice({
  name: "userAuth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ user: UserType; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      // Clear temporary data on successful login
      state.tempEmail = null
      state.tempUserData = null
      state.resetToken = null
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.tempEmail = null
      state.tempUserData = null
      state.resetToken = null
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setTempEmail: (state, action: PayloadAction<string>) => {
      state.tempEmail = action.payload
    },
    setTempUserData: (state, action: PayloadAction<{ name: string; email: string; password: string }>) => {
      state.tempUserData = action.payload
    },
    setResetToken: (state, action: PayloadAction<string>) => {
      state.resetToken = action.payload
    },
    clearTempData: (state) => {
      state.tempEmail = null
      state.tempUserData = null
      state.resetToken = null
    },
  },
})

export const { login, logout, setLoading, setTempEmail, setTempUserData, setResetToken, clearTempData } =
  userAuthSlice.actions

export default userAuthSlice.reducer
