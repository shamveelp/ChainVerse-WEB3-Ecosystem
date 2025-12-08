"use client"
import { useDispatch } from "react-redux"
import { useRouter } from "next/navigation"
import {
  login as reduxLogin,
  logout as reduxLogout,
  setLoading,
  setTempEmail,
  setTempUserData,
  clearTempData,
} from "@/redux/slices/userAuthSlice"
import { useToast } from "@/hooks/use-toast"
import * as authApiService from "@/services/authApiService"

export function useAuthActions() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { toast } = useToast()

  const login = async (email: string, password: string) => {
    dispatch(setLoading(true))
    try {
      const response = await authApiService.login(email, password)
      if (response.success && response.user && response.token) {
        dispatch(reduxLogin({ user: response.user, token: response.token }))
        toast({
          title: "Login Successful",
          description: "Welcome back to ChainVerse!",
        })
        router.push("/")
        return true
      } else {
        throw new Error(response.error || "Invalid credentials")
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
      return false
    } finally {
      dispatch(setLoading(false))
    }
  }

  const googleLogin = async (credential: string, referralCode?: string) => {
    dispatch(setLoading(true))
    try {
      const response = await authApiService.googleLogin(credential, referralCode)
      if (response.success && response.user && response.token) {
        dispatch(
          reduxLogin({
            user: response.user,
            token: response.token,
          }),
        )
        toast({
          title: "Google Login Successful",
          description: "Welcome back to ChainVerse!",
        })
        router.push("/")
      } else {
        toast({
          title: "Google Login Failed",
          description: response.error || "An unknown error occurred during Google login.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || "Google login failed"
      toast({
        title: "Google Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      dispatch(setLoading(false))
    }
  }

  const logout = async () => {
    dispatch(setLoading(true))
    try {
      await authApiService.logout()
      dispatch(reduxLogout())
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      })
      router.push("/user/login")
    } catch (error: any) {
      // Even if logout fails on server, clear local state
      dispatch(reduxLogout())
      toast({
        title: "Logged Out",
        description: "You have been logged out",
      })
      router.push("/user/login")
    } finally {
      dispatch(setLoading(false))
    }
  }

  const requestRegistrationOtp = async (email: string, userData: { username: string; name: string; email: string; password: string; referralCode?: string }) => {
    dispatch(setLoading(true))
    try {
      const response = await authApiService.requestOtp(email)

      if (response.success) {
        // Store the data in Redux
        dispatch(setTempUserData(userData))
        dispatch(setTempEmail(email))

        toast({
          title: "OTP Sent",
          description: "Please check your email for the verification code",
        })

        // Use setTimeout to ensure state is updated before navigation
        setTimeout(() => {
          router.push("/user/verify-otp")
        }, 100)

        return true
      } else {
        throw new Error(response.error || "Failed to send OTP")
      }
    } catch (error: any) {
      console.error("Registration OTP error:", error)
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      })
      return false
    } finally {
      dispatch(setLoading(false))
    }
  }

  const requestForgotPasswordOtp = async (email: string) => {
    dispatch(setLoading(true))
    try {
      const response = await authApiService.forgotPassword(email)

      if (response.success) {
        // Store email in Redux
        dispatch(setTempEmail(email))
        // Clear any existing user data since this is forgot password
        dispatch(setTempUserData({ username: '', name: '', email: '', password: '' }))

        toast({
          title: "Reset Code Sent",
          description: "Please check your email for the password reset code",
        })

        // Use setTimeout to ensure state is updated before navigation
        setTimeout(() => {
          router.push("/user/verify-otp")
        }, 100)

        return true
      } else {
        throw new Error(response.error || "Failed to send reset code")
      }
    } catch (error: any) {
      console.error("Forgot password OTP error:", error)
      toast({
        title: "Failed to Send Reset Code",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
      return false
    } finally {
      dispatch(setLoading(false))
    }
  }

  const verifyOtp = async (
    otp: string,
    type: "register" | "forgot-password",
    tempUserData?: any,
    tempEmail?: string,
  ) => {
    dispatch(setLoading(true))
    try {
      if (type === "register" && tempUserData) {
        const response = await authApiService.signup(
          tempUserData.username,
          tempUserData.email,
          tempUserData.password,
          tempUserData.name,
          tempUserData.referralCode,
          otp
        )

        if (response.success && response.user && response.token) {
          dispatch(reduxLogin({ user: response.user, token: response.token }))
          toast({
            title: "Account Created Successfully",
            description: "Welcome to ChainVerse!",
          })

          setTimeout(() => {
            router.push("/")
          }, 100)

          return true
        } else {
          throw new Error(response.error || "Invalid OTP")
        }
      } else if (type === "forgot-password" && tempEmail) {
        const response = await authApiService.verifyForgotPasswordOtp(tempEmail, otp)

        if (response.success) {
          toast({
            title: "OTP Verified",
            description: "You can now reset your password.",
          })

          setTimeout(() => {
            router.push("/user/reset-password")
          }, 100)

          return true
        } else {
          throw new Error(response.error || "Invalid OTP")
        }
      }
      return false
    } catch (error: any) {
      console.error("OTP verification error:", error)
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP",
        variant: "destructive",
      })
      return false
    } finally {
      dispatch(setLoading(false))
    }
  }

  const resetPassword = async (email: string, newPassword: string) => {
    dispatch(setLoading(true))
    try {
      const response = await authApiService.resetPassword(email, newPassword)

      if (response.success) {
        dispatch(clearTempData())
        toast({
          title: "Password Reset Successful",
          description: "Your password has been updated. You can now log in.",
        })

        setTimeout(() => {
          router.push("/user/login")
        }, 100)

        return true
      } else {
        throw new Error(response.error || "Failed to reset password")
      }
    } catch (error: any) {
      console.error("Reset password error:", error)
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      })
      return false
    } finally {
      dispatch(setLoading(false))
    }
  }

  return {
    login,
    googleLogin,
    logout,
    requestRegistrationOtp,
    requestForgotPasswordOtp,
    verifyOtp,
    resetPassword,
  }
}
