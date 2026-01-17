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
import { COMMON_ROUTES, USER_ROUTES } from "@/routes"

// Interface for registration data
interface RegistrationData {
  username: string;
  name: string;
  email: string;
  password: string;
  referralCode?: string;
}

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
        router.push(COMMON_ROUTES.HOME)
        return true
      } else {
        throw new Error(response.error || "Invalid credentials")
      }
    }
    catch (error) {
      const err = error as Error;
      toast({
        title: "Login Failed",
        description: err.message || "An unexpected error occurred.",
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
        router.push(COMMON_ROUTES.HOME)
      } else {
        toast({
          title: "Google Login Failed",
          description: response.error || "An unknown error occurred during Google login.",
          variant: "destructive",
        })
      }
    } catch (err) {
      const error = err as any; // googleLogin logic in catch seems to expect axios-like error, keeping as any cast but inside catch
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Google login failed"
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
      router.push(USER_ROUTES.LOGIN)
    } catch {
      // Even if logout fails on server, clear local state
      dispatch(reduxLogout())
      toast({
        title: "Logged Out",
        description: "You have been logged out",
      })
      router.push(USER_ROUTES.LOGIN)
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
          router.push(USER_ROUTES.VERIFY_OTP)
        }, 100)

        return true
      } else {
        throw new Error(response.error || "Failed to send OTP")
      }
    } catch (error) {
      const err = error as Error;
      console.error("Registration OTP error:", err)
      toast({
        title: "Registration Failed",
        description: err.message || "Failed to send OTP",
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
          router.push(USER_ROUTES.VERIFY_OTP)
        }, 100)

        return true
      } else {
        throw new Error(response.error || "Failed to send reset code")
      }
    } catch (error) {
      const err = error as Error;
      console.error("Forgot password OTP error:", err)
      toast({
        title: "Failed to Send Reset Code",
        description: err.message || "Please try again later",
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
    tempUserData?: RegistrationData,
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
            router.push(COMMON_ROUTES.HOME)
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
            router.push(USER_ROUTES.RESET_PASSWORD)
          }, 100)

          return true
        } else {
          throw new Error(response.error || "Invalid OTP")
        }
      }
      return false
    } catch (error) {
      const err = error as Error;
      console.error("OTP verification error:", err)
      toast({
        title: "Verification Failed",
        description: err.message || "Invalid OTP",
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
          router.push(USER_ROUTES.LOGIN)
        }, 100)

        return true
      } else {
        throw new Error(response.error || "Failed to reset password")
      }
    } catch (error) {
      const err = error as Error;
      console.error("Reset password error:", err)
      toast({
        title: "Password Reset Failed",
        description: err.message || "Failed to reset password. Please try again.",
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
