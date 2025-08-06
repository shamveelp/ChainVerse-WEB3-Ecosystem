import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface AdminStatsState {
  totalUsers: number
  activeUsers: number
  bannedUsers: number
  totalTransactions: number
  totalVolume: string
  networkHealth: string
  loading: boolean
  lastUpdated: string | null
}

const initialState: AdminStatsState = {
  totalUsers: 0,
  activeUsers: 0,
  bannedUsers: 0,
  totalTransactions: 0,
  totalVolume: '$0',
  networkHealth: '99.9%',
  loading: false,
  lastUpdated: null
}

export const adminStatsSlice = createSlice({
  name: 'adminStats',
  initialState,
  reducers: {
    setTotalUsers: (state, action: PayloadAction<number>) => {
      state.totalUsers = action.payload
      state.lastUpdated = new Date().toISOString()
    },
    setActiveUsers: (state, action: PayloadAction<number>) => {
      state.activeUsers = action.payload
      state.lastUpdated = new Date().toISOString()
    },
    setBannedUsers: (state, action: PayloadAction<number>) => {
      state.bannedUsers = action.payload
      state.lastUpdated = new Date().toISOString()
    },
    setAllStats: (state, action: PayloadAction<Partial<AdminStatsState>>) => {
      Object.assign(state, action.payload)
      state.lastUpdated = new Date().toISOString()
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    resetStats: (state) => {
      Object.assign(state, initialState)
    }
  }
})

export const { 
  setTotalUsers, 
  setActiveUsers, 
  setBannedUsers, 
  setAllStats, 
  setLoading, 
  resetStats 
} = adminStatsSlice.actions

export default adminStatsSlice.reducer
