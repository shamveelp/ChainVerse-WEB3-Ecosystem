"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft, Lock, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { login as reduxLogin, setLoading } from "@/redux/slices/userAuthSlice"
import API from "@/lib/api-client"

export function VerifyOtpForm() {
  const [otp, setOtp] = useState("")
  const [countdown, setCountdown] = useState(60)
  const [resendDisabled, setResendDisabled] = useState(true)
  const router = useRouter()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const { loading, tempEmail, tempUserData } = useSelector((state: RootState) => state.userAuth)
  const inputRef = useRef<HTMLInputElement>(null)

  const verificationType = tempUserData ? "register" : "forgot-password"

  useEffect(() => {
    if (!tempEmail) {
      toast({
        title: "Session Expired",
        description: "Please restart the verification process",
        variant: "destructive",
      })
      router.push("/user/login")
      return
    }

    if (resendDisabled) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setResendDisabled(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [tempEmail, router, toast, resendDisabled])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tempEmail || !otp.trim()) return

    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP",
        variant: "destructive",
      })
      return
    }

    dispatch(setLoading(true))

    try {
      if (verificationType === "register" && tempUserData) {
        const response = await API.post("/api/user/verify-otp", {
          name: tempUserData.name,
          email: tempUserData.email,
          password: tempUserData.password,
          otp: otp,
        })

        dispatch(reduxLogin({ user: response.data.user, token: response.data.token || response.data.accessToken }))

        toast({
          title: "Account Created Successfully",
          description: "Welcome to ChainVerse!",
        })

        router.push("/")
      } else if (verificationType === "forgot-password") {
        const response = await API.post("/api/user/verify-forgot-password-otp", {
          email: tempEmail,
          otp: otp,
        })

        toast({
          title: "OTP Verified",
          description: "You can now reset your password.",
        })

        router.push("/user/reset-password")
      }
    } catch (err: any) {
      toast({
        title: "Verification Failed",
        description: err.response?.data?.message || err.response?.data?.error || "OTP verification failed",
        variant: "destructive",
      })
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleResend = async () => {
    if (!tempEmail) return

    try {
      let response
      if (verificationType === "register") {
        response = await API.post("/api/user/request-otp", { email: tempEmail })
      } else {
        response = await API.post("/api/user/forgot-password", { email: tempEmail })
      }

      toast({
        title: "OTP Resent",
        description: "Please check your email for the new verification code",
      })

      setCountdown(60)
      setResendDisabled(true)
      setOtp("")
    } catch (err: any) {
      toast({
        title: "Failed to Resend",
        description: err.response?.data?.error || "Failed to resend OTP",
        variant: "destructive",
      })
    }
  }

  if (!tempEmail) {
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
            We&apos;ve sent a 6-digit code to <span className="text-blue-400">{tempEmail}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input - Single field like your friend's code */}
            <div className="relative group">
              <div className="flex items-center bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden group-focus-within:border-blue-500 group-focus-within:ring-1 group-focus-within:ring-blue-500 transition-all duration-300">
                <div className="flex items-center justify-center w-12 text-gray-400">
                  <Lock />
                </div>
                <Input
                  ref={inputRef}
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full bg-transparent border-none outline-none text-white p-4 placeholder-gray-500 tracking-widest text-center font-mono text-lg"
                  placeholder="Enter OTP"
                  maxLength={6}
                />
              </div>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-600 to-purple-600 group-focus-within:w-full transition-all duration-300"></div>
            </div>

            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  VERIFY & CONTINUE
                </>
              )}
            </Button>
          </form>

          {/* Resend OTP */}
          <div className="text-center pt-4">
            <p className="text-gray-400 text-sm">Didn&apos;t receive the code?</p>
            <Button
              type="button"
              variant="ghost"
              onClick={handleResend}
              disabled={resendDisabled}
              className={`mt-2 text-blue-400 hover:text-blue-300 transition-colors ${
                resendDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Resend {resendDisabled && <span className="ml-1">in {countdown}s</span>}
            </Button>
          </div>

          {/* Security Note */}
          <div className="mt-6 bg-slate-900/30 p-3 rounded-lg border border-slate-700">
            <p className="text-xs text-gray-400 text-center">
              For your security, the verification code will expire in 10 minutes. Please do not share this code with
              anyone.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
