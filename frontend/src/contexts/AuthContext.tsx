"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from "react"
import { apiService } from "@/lib/api"
import { GoogleOAuthProvider } from "@react-oauth/google"

interface User {
  _id: string
  username: string
  name: string
  email: string
  role: string
  totalPoints: number
  isEmailVerified: boolean
  profilePic: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  googleLogin: (idToken: string) => Promise<boolean>
  checkAuth: () => Promise<void>
  setUserDirectly: (user: User | null) => void
  clearSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start as loading

  const isAuthenticated = useMemo(() => !!user, [user])

  const clearSession = useCallback(() => {
    setUser(null)
    setIsLoading(false)
    // Clear any client-side storage if it were used (e.g., localStorage.removeItem('user'))
  }, [])

  const checkAuth = useCallback(async () => {
    setIsLoading(true)
    try {
      const userResponse = await apiService.getCurrentUser()
      if (userResponse.success && userResponse.user) {
        setUser(userResponse.user)
      } else {
        // If getting user fails (e.g., access token expired), try to refresh the token
        const refreshResponse = await apiService.refreshToken()
        if (refreshResponse.success) {
          // If refresh is successful, try getting user again with the new access token
          const refreshedUserResponse = await apiService.getCurrentUser()
          if (refreshedUserResponse.success && refreshedUserResponse.user) {
            setUser(refreshedUserResponse.user)
          } else {
            // If even after refresh, user data can't be fetched, clear session
            clearSession()
          }
        } else {
          // If refresh token also fails, clear session
          clearSession()
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      clearSession() // Clear session on any unexpected error during auth check
    } finally {
      setIsLoading(false) // Always set loading to false at the end
    }
  }, [clearSession])

  useEffect(() => {
    // On initial mount, perform an authentication check
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await apiService.login(email, password)
      if (response.success && response.user) {
        setUser(response.user)
        setIsLoading(false)
        return true
      } else {
        setUser(null)
        setIsLoading(false)
        throw new Error(response.error || "Login failed")
      }
    } catch (error) {
      setUser(null)
      setIsLoading(false)
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await apiService.logout() // API call to clear server-side session/cookies
    } catch (error) {
      console.error("Logout API call failed:", error)
    } finally {
      clearSession()
    }
  }, [clearSession])

  const googleLogin = useCallback(async (idToken: string) => {
    setIsLoading(true)
    try {
      const response = await apiService.googleAuth(idToken)
      if (response.success && response.user) {
        setUser(response.user)
        setIsLoading(false)
        return true
      } else {
        setUser(null)
        setIsLoading(false)
        throw new Error(response.error || "Google login failed")
      }
    } catch (error) {
      setUser(null)
      setIsLoading(false)
      throw error
    }
  }, [])

  const setUserDirectly = useCallback((newUser: User | null) => {
    setUser(newUser)
    setIsLoading(false)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      login,
      logout,
      googleLogin,
      checkAuth,
      setUserDirectly,
      clearSession,
    }),
    [user, isLoading, isAuthenticated, login, logout, googleLogin, checkAuth, setUserDirectly, clearSession],
  )

  // Google OAuth Provider needs to wrap the components that use GoogleLogin
  // It requires NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!googleClientId) {
    console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined. Google login will not work.")
    // You might want to render an error state or disable Google login features
  }

  return (
    <AuthContext.Provider value={value}>
      {googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider> : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
