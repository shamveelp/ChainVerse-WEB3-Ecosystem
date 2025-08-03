"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Lock, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { AuthGuard } from "@/lib/auth-guard"
import { sessionManager } from "@/lib/session-manager" // Import sessionManager

function ResetPasswordPageContent() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordResetToken, setPasswordResetToken] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")
  const { toast } = useToast()

  useEffect(() => {
    if (!sessionId) {
      toast({
        title: "Invalid Session",
        description: "Please restart the password reset process",
        variant: "destructive",
      })
      router.push("/user/forgot-password")
      return
    }
    // Get password reset token from secure session storage
    const token = sessionManager.getPasswordResetToken(sessionId) // Use sessionManager for this
    if (!token) {
      toast({
        title: "Session Expired",
        description: "Please restart the password reset process",
        variant: "destructive",
      })
      router.push("/user/forgot-password")
      return
    }
    setPasswordResetToken(token)
  }, [sessionId, router, toast])

  const validateForm = (): boolean => {
    let isValid = true
    if (!newPassword) {
      setPasswordError("New password is required")
      isValid = false
    } else if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      isValid = false
    } else {
      setPasswordError("")
    }
    if (!confirmNewPassword) {
      setConfirmPasswordError("Please confirm your new password")
      isValid = false
    } else if (newPassword !== confirmNewPassword) {
      setConfirmPasswordError("Passwords do not match")
      isValid = false
    } else {
      setConfirmPasswordError("")
    }
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordResetToken) {
      toast({
        title: "Error",
        description: "Reset token not found. Please restart the process.",
        variant: "destructive",
      })
      router.push("/user/forgot-password")
      return
    }
    if (!validateForm()) {
      return
    }
    setIsLoading(true)
    try {
      // Pass passwordResetToken to apiService.resetPassword
      const response = await apiService.resetPassword(passwordResetToken, newPassword)
      if (response.success) {
        toast({
          title: "Password Reset Successful",
          description: "Your password has been updated. You can now log in.",
        })

        // Clear the reset token from sessionManager
        sessionManager.clearPasswordResetToken(sessionId)
        router.push("/user/login")
      } else {
        toast({
          title: "Password Reset Failed",
          description: response.error || "Failed to reset password. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Please check your connection and try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!passwordResetToken) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-3xl"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      <div className="relative w-full max-w-md">
        {/* Back Button */}
        <Button variant="ghost" className="mb-4 text-gray-400 hover:text-gray-300" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
          >
            ChainVerse
          </Link>
          <p className="text-gray-400 mt-2">Set your new password</p>
        </div>
        <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-200">Reset Password</CardTitle>
            <p className="text-gray-400 text-sm mt-2">Enter your new password below.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium text-gray-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      if (passwordError) setPasswordError("")
                    }}
                    className="bg-slate-700/50 border-slate-600 text-white h-12 pl-10 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-new-password" className="text-sm font-medium text-gray-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirm-new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value)
                      if (confirmPasswordError) setConfirmPasswordError("")
                    }}
                    className="bg-slate-700/50 border-slate-600 text-white h-12 pl-10 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {confirmPasswordError && <p className="text-red-400 text-sm">{confirmPasswordError}</p>}
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthGuard requireGuest={true} redirectTo="/">
      <ResetPasswordPageContent />
    </AuthGuard>
  )
}
