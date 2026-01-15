import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface UserType {
  _id: string
  username: string
  email: string
  name: string
  profileImage?: string
  profilePicture?: string
  profilePic?: string
  referralCode?: string
}

interface UserAuthState {
  user: UserType | null
  isAuthenticated: boolean
  loading: boolean
  tempEmail: string | null
  tempUserData: {
    username: string
    email: string
    password: string
    name: string
    referralCode?: string
  } | null
  resetToken: string | null
}

const initialState: UserAuthState = {
  user: null,
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
    login: (state, action: PayloadAction<{ user: UserType }>) => {
      state.user = action.payload.user
      state.isAuthenticated = true
      state.tempEmail = null
      state.tempUserData = null
      state.resetToken = null
    },
    logout: (state) => {
      state.user = null
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
    setTempUserData: (state, action: PayloadAction<{ username: string; email: string; password: string; name: string; referralCode?: string }>) => {
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