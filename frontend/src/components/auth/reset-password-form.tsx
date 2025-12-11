"use client"
import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Lock, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/redux/store"
import { setLoading, clearTempData } from "@/redux/slices/userAuthSlice"
import API from "@/lib/api-client"
import { USER_ROUTES, COMMON_ROUTES } from "@/routes"

export function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const { loading, tempEmail } = useSelector((state: RootState) => state.userAuth)

  useEffect(() => {
    if (!tempEmail) {
      toast({
        title: "Session Expired",
        description: "Please restart the password reset process",
        variant: "destructive",
      })
      router.push(USER_ROUTES.LOGIN)
      return
    }
  }, [tempEmail, router, toast])

  const passwordValidation = (password: string): boolean => {
    // At least 8 chars, one uppercase, one lowercase, one number, one special char
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return regex.test(password)
  }

  const validateForm = (): boolean => {
    let isValid = true

    if (!password) {
      setPasswordError("New password is required")
      isValid = false
    } else if (!passwordValidation(password)) {
      setPasswordError(
        "Password should be at least 8 characters long and include uppercase, lowercase, number, and special character.",
      )
      isValid = false
    } else {
      setPasswordError("")
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your new password")
      isValid = false
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords don't match")
      isValid = false
    } else {
      setConfirmPasswordError("")
    }

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!tempEmail) {
      toast({
        title: "Error",
        description: "Reset session not found. Please restart the process.",
        variant: "destructive",
      })
      router.push(USER_ROUTES.FORGOT_PASSWORD)
      return
    }

    if (!validateForm()) {
      return
    }

    dispatch(setLoading(true))

    try {
      await API.post("/api/user/reset-password", {
        email: tempEmail,
        newPassword: password,
      })

      dispatch(clearTempData())

      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in.",
      })

      router.push(USER_ROUTES.LOGIN)
    } catch (error) {
      const err = error as { response?: { data?: { error?: string, message?: string } }; message?: string }
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message
      toast({
        title: "Password Reset Failed",
        description: errorMessage || "Error updating password",
        variant: "destructive",
      })
    } finally {
      dispatch(setLoading(false))
    }
  }

  if (!tempEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Verifying session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Back Button */}
      <Button variant="ghost" className="mb-4 text-gray-400 hover:text-gray-300" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Logo */}
      <div className="text-center mb-8">
        <Link
          href={COMMON_ROUTES.HOME}
          className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
        >
          ChainVerse
        </Link>
        <p className="text-gray-400 mt-2">Set your new password</p>
      </div>

      <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-gray-200">Set New Password</CardTitle>
          <p className="text-gray-400 text-sm mt-2">Create a strong password for your account</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError("")
                  }}
                  className="bg-slate-700/50 border-slate-600 text-white h-12 pl-10 pr-12"
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (confirmPasswordError) setConfirmPasswordError("")
                  }}
                  className="bg-slate-700/50 border-slate-600 text-white h-12 pl-10 pr-12"
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {confirmPasswordError && <p className="text-red-400 text-sm">{confirmPasswordError}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link href={USER_ROUTES.LOGIN} className="text-blue-400 hover:text-blue-300 text-sm">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}