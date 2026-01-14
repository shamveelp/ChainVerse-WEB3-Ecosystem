"use client"
import type React from "react"
// import "./globals.css" // Moved to layout.tsx

import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { Provider, useDispatch } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { store, persistor } from "@/redux/store"
import { setupAxiosInterceptors } from "@/lib/api-client"
import { setLoading } from "@/redux/slices/userAuthSlice"
import { useEffect } from "react"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { GlobalChatListener } from "@/components/chat/GlobalChatListener"
import LoadingScreen from "@/components/ui/loading-screen"

// Component to handle dispatching setLoading(false) after rehydration
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()

  useEffect(() => {
    // This useEffect will run after the component mounts and rehydration is complete.
    // We can safely set loading to false here, as the persisted state will have been loaded.
    dispatch(setLoading(false))
  }, [dispatch])

  return <>{children}</>
}

// Loading component for PersistGate

export default function ClientLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Setup Axios interceptors after the store is available
  setupAxiosInterceptors(store)

  // Ensure NEXT_PUBLIC_GOOGLE_CLIENT_ID is defined
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!googleClientId) {
    console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined. Google OAuth will not work.")
  }

  const content = (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <AuthInitializer>
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
