"use client"
import type React from "react"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { Provider, useDispatch } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { store, persistor } from "@/redux/store"
import { setupAxiosInterceptors } from "@/lib/api-client"
import { setLoading } from "@/redux/slices/userAuthSlice"
import { useEffect } from "react"
import { GoogleOAuthProvider } from "@react-oauth/google"

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
function PersistGateLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

export default function ClientLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Setup Axios interceptors after the store is available
  setupAxiosInterceptors(store)

  // Ensure NEXT_PUBLIC_GOOGLE_CLIENT_ID is defined
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!googleClientId) {
    console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined. Google OAuth will not work.")
  }

  return (
    <html lang="en">
      <body className="antialiased">
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            <Provider store={store}>
              <PersistGate loading={<PersistGateLoading />} persistor={persistor}>
                <AuthInitializer>{children}</AuthInitializer>
              </PersistGate>
            </Provider>
          </GoogleOAuthProvider>
        ) : (
          <Provider store={store}>
            <PersistGate loading={<PersistGateLoading />} persistor={persistor}>
              <AuthInitializer>{children}</AuthInitializer>
            </PersistGate>
          </Provider>
        )}
        <Toaster />
        <SonnerToaster position="top-right" richColors />
      </body>
    </html>
  )
}
