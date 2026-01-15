"use client"
import type React from "react"
// import "./globals.css" // Moved to layout.tsx

import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { Provider, useDispatch } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { store, persistor } from "@/redux/store"
import { setupAxiosInterceptors } from "@/lib/api-client"
import { setLoading } from "@/redux/slices/userAuthSlice"
import { useEffect, useRef } from "react"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { GlobalChatListener } from "@/components/chat/GlobalChatListener"
import LoadingScreen from "@/components/ui/loading-screen"

import { logout } from "@/redux/slices/userAuthSlice"
import { useSelector } from "react-redux"
import type { RootState } from "@/redux/store"

// Component to handle dispatching setLoading(false) and syncing session
function AuthInitializer({ children, sessionExists }: { children: React.ReactNode; sessionExists: boolean }) {
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.userAuth.user)

  const isMounted = useRef(false)

  useEffect(() => {
    // This effect runs after PersistGate has rehydrated the store
    if (!isMounted.current) {
      dispatch(setLoading(false))

      // Sync Redux state with cookie presence ONLY when the app first loads
      if (!sessionExists && user) {
        dispatch(logout())
      }
      isMounted.current = true
    }
  }, [dispatch, sessionExists, user])

  return <>{children}</>
}

// Loading component for PersistGate

export default function ClientLayout({ children, sessionExists }: Readonly<{ children: React.ReactNode; sessionExists: boolean }>) {
  // Setup Axios interceptors after the store is available (only on client)
  useEffect(() => {
    setupAxiosInterceptors(store)
  }, [])

  // Ensure NEXT_PUBLIC_GOOGLE_CLIENT_ID is defined
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!googleClientId) {
    console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined. Google OAuth will not work.")
  }

  const content = (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <AuthInitializer sessionExists={sessionExists}>
          <GlobalChatListener />
          {children}
        </AuthInitializer>
      </PersistGate>
    </Provider>
  )

  return (
    <>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          {content}
        </GoogleOAuthProvider>
      ) : (
        content
      )}

      <SonnerToaster position="top-right" richColors />
    </>
  )
}
