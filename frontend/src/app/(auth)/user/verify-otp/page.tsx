"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext" // Changed import to useAuth
import { AuthGuard } from "@/lib/auth-guard"
import { sessionManager } from "@/lib/session-manager"

function VerifyOtpPageContent() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [sessionData, setSessionData] = useState<{ email: string; type: string; resetToken?: string } | null>(null) // Added resetToken
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")
  const { toast } = useToast()
  const { setUserDirectly } = useAuth() // Uses the useAuth hook
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!sessionId) {
      toast({
        title: "Invalid Session",
        description: "Please restart the verification process",
        variant: "destructive",
      })
      router.push("/user/login")
      return
    }

    const resetData = sessionManager.getResetToken(sessionId)
    if (resetData) {
      setSessionData({ email: resetData.email, type: "forgot-password", resetToken: resetData.resetToken })
    } else {
      const otpSession = sessionManager.getOtpSession(sessionId)
      if (otpSession) {
        setSessionData(otpSession)
      } else {
        toast({
          title: "Session Expired",
          description: "Please restart the verification process",
          variant: "destructive",
        })
        router.push("/user/login")
        return
      }
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionId, router, toast])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionData || !sessionId) return
    const otpString = otp.join("")
    if (otpString.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter all 6 digits",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      if (sessionData.type === "register") {
        const registrationData = sessionStorage.getItem("registrationData")
        if (!registrationData) {
          throw new Error("Registration data not found")
        }
        const userData = JSON.parse(registrationData)
        const response = await apiService.verifyOtp(sessionData.email, otpString, userData.name, userData.password)
        if (response.success) {
          toast({
            title: "Account Created Successfully",
            description: "Welcome to ChainVerse!",
          })
          sessionStorage.removeItem("registrationData")
          sessionManager.clearOtpSession(sessionId)
          if (response.user) {
            setUserDirectly(response.user)
          }
          router.push("/")
        } else {
          toast({
            title: "Verification Failed",
            description: response.error || "Invalid OTP",
            variant: "destructive",
          })
        }
      } else if (sessionData.type === "forgot-password") {
        if (!sessionData.resetToken) {
          throw new Error("Reset token missing for forgot password verification")
        }
        // Pass resetData.resetToken instead of email
        const response = await apiService.verifyForgotPasswordOtp(sessionData.resetToken, otpString)
        if (response.success && response.passwordResetToken) {
          toast({
            title: "OTP Verified",
            description: "You can now reset your password.",
          })
          // Store password reset token for the next step
          const newSessionId = sessionManager.generateSessionId()
          sessionManager.storePasswordResetToken(newSessionId, response.passwordResetToken) // Use sessionManager for this
          router.push(`/user/reset-password?session=${newSessionId}`)
        } else {
          toast({
            title: "Verification Failed",
            description: response.error || "Invalid OTP",
            variant: "destructive",
          })
        }
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

  const handleResendOtp = async () => {
    if (!sessionData || !sessionId) return
    setIsResending(true)
    try {
      let response
      if (sessionData.type === "register") {
        response = await apiService.requestOtp(sessionData.email)
      } else if (sessionData.type === "forgot-password") {
        response = await apiService.forgotPassword(sessionData.email) // This still uses email, which is correct for resending
      } else {
        throw new Error("Invalid OTP type for resend")
      }

      if (response.success) {
        toast({
          title: "OTP Resent",
          description: "Please check your email for the new verification code",
        })
        setCountdown(60)
        setCanResend(false)
        setOtp(["", "", "", "", "", ""])
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              setCanResend(true)
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        toast({
          title: "Failed to Resend",
          description: response.error || "Please try again later",
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
      setIsResending(false)
    }
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
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
          <p className="text-gray-400 mt-2">Verify your email</p>
        </div>
        <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-200">Enter Verification Code</CardTitle>
            <p className="text-gray-400 text-sm mt-2">
              We&apos;ve sent a 6-digit code to <span className="text-blue-400">{sessionData.email}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OTP Input */}
              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold bg-slate-700/50 border-slate-600 text-white"
                  />
                ))}
              </div>
              <Button
                type="submit"
                disabled={isLoading || otp.join("").length !== 6}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Account"
                )}
              </Button>
            </form>
            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Didn&apos;t receive the code?</p>
              {canResend ? (
                <Button
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    "Resend Code"
                  )}
                </Button>
              ) : (
                <p className="text-gray-500 text-sm">Resend in {countdown}s</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <AuthGuard requireGuest={true} redirectTo="/">
      <VerifyOtpPageContent />
    </AuthGuard>
  )
}
