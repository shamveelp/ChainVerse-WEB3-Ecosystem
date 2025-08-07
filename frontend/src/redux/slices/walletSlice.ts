import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface WalletState {
  isOpen: boolean
  isConnected: boolean
  address: string | null
  balance: string
  network: {
    id: number
    name: string
    symbol: string
  }
  loading: boolean
}

const initialState: WalletState = {
  isOpen: false,
  isConnected: false,
  address: null,
  balance: "0.00",
  network: {
    id: 1,
    name: "Ethereum",
    symbol: "ETH"
  },
  loading: false
}

export const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    openWallet: (state) => {
      state.isOpen = true
    },
    closeWallet: (state) => {
      state.isOpen = false
    },
    connectWallet: (state, action: PayloadAction<{ address: string; balance: string }>) => {
      state.isConnected = true
      state.address = action.payload.address
      state.balance = action.payload.balance
      state.loading = false
    },
    disconnectWallet: (state) => {
      state.isConnected = false
      state.address = null
      state.balance = "0.00"
      state.loading = false
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    switchNetwork: (state, action: PayloadAction<{ id: number; name: string; symbol: string }>) => {
      state.network = action.payload
    },
    updateBalance: (state, action: PayloadAction<string>) => {
      state.balance = action.payload
    }
  }
})

export const { 
  openWallet, 
  closeWallet, 
  connectWallet, 
  disconnectWallet, 
  setLoading, 
  switchNetwork, 
  updateBalance 
} = walletSlice.actions

export default walletSlice.reducer
