import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiService } from "@/lib/api"

interface User {
  _id: string // Keep _id as per original context
  username: string
  name: string
  email: string
  role: string
  totalPoints: number
  isEmailVerified: boolean
  profilePic: string
  createdAt: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  // Removed token, refreshToken, sessionExpiry as they are assumed to be HTTP-only cookies

  // Auth actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  setUserDirectly: (user: User | null) => void
  checkAuth: () => Promise<void>
  googleLogin: (idToken: string) => Promise<boolean>
  // Removed refreshAuthToken

  // Session management
  clearSession: () => void
  initializeAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true, // Start as loading
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await apiService.login(email, password)
          if (response.success && response.user) {
            set({
              user: response.user,
              isLoading: false,
              isAuthenticated: true,
            })
            return true
          } else {
            set({
              user: null,
              isLoading: false,
              isAuthenticated: false,
            })
            throw new Error(response.error || "Login failed")
          }
        } catch (error) {
          set({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          })
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await apiService.logout() // API call to clear server-side session/cookies
        } catch (error) {
          console.error("Logout API call failed:", error)
        } finally {
          set({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          })
          // Clear any stored session data from persist middleware
          localStorage.removeItem("auth-storage")
          sessionStorage.clear() // Clear temporary session data
        }
      },

      setUserDirectly: (user) => {
        set({ user, isLoading: false, isAuthenticated: !!user })
      },

      checkAuth: async () => {
        set({ isLoading: true })
        try {
          // 1. Attempt to get current user data (relies on existing access token cookie)
          const userResponse = await apiService.getCurrentUser()
          if (userResponse.success && userResponse.user) {
            set({
              user: userResponse.user,
              isLoading: false,
              isAuthenticated: true,
            })
          } else {
            // 2. If getting user fails (e.g., access token expired), try to refresh the token
            const refreshResponse = await apiService.refreshToken()
            if (refreshResponse.success) {
              // 3. If refresh is successful, try getting user again with the new access token
              const refreshedUserResponse = await apiService.getCurrentUser()
              if (refreshedUserResponse.success && refreshedUserResponse.user) {
                set({
                  user: refreshedUserResponse.user,
                  isLoading: false,
                  isAuthenticated: true,
                })
              } else {
                // If even after refresh, user data can't be fetched, clear session
                get().clearSession()
              }
            } else {
              // If refresh token also fails, clear session
              get().clearSession()
            }
          }
        } catch (error) {
          console.error("Auth check failed:", error)
          get().clearSession() // Clear session on any unexpected error during auth check
        } finally {
          set({ isLoading: false }) // Ensure loading is set to false
        }
      },

      googleLogin: async (idToken: string) => {
        set({ isLoading: true })
        try {
          const response = await apiService.googleAuth(idToken)
          if (response.success && response.user) {
            set({
              user: response.user,
              isLoading: false,
              isAuthenticated: true,
            })
            return true
          } else {
            set({
              user: null,
              isLoading: false,
              isAuthenticated: false,
            })
            throw new Error(response.error || "Google login failed")
          }
        } catch (error) {
          set({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          })
          throw error
        }
      },

      clearSession: () => {
        set({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
        localStorage.removeItem("auth-storage") // Ensure persist storage is cleared
        sessionStorage.clear() // Clear temporary session data
      },

      initializeAuth: async () => {
        // This function is called once at the root of the client app.
        // It should trigger the initial authentication check.
        await get().checkAuth()
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        // isAuthenticated is derived from user, no need to persist it directly
      }),
      // Only store user, as tokens are cookie-based
    },
  ),
)
