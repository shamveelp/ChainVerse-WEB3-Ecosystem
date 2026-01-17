"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft, Lock, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { login as reduxLogin, setLoading } from "@/redux/slices/userAuthSlice"
import { signup, requestOtp, verifyForgotPasswordOtp } from "@/services/authApiService"
import { USER_ROUTES, COMMON_ROUTES } from "@/routes"

export function VerifyOtpForm() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [countdown, setCountdown] = useState(60)
  const [resendDisabled, setResendDisabled] = useState(true)
  const router = useRouter()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const { loading, tempEmail, tempUserData } = useSelector((state: RootState) => state.userAuth)
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || COMMON_ROUTES.HOME
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const verificationType = tempUserData ? "register" : "forgot-password"

  useEffect(() => {
    if (!tempEmail) {
      toast({
        title: "Session Expired",
        description: "Please restart the verification process",
        variant: "destructive",
      })
      router.push(USER_ROUTES.LOGIN)
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

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Allow only digits
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Take only the last digit
    setOtp(newOtp)

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    // Move to previous input on backspace
    if (!value && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pastedData.length) {
      const newOtp = [...otp]
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newOtp[i] = pastedData[i]
      }
      setOtp(newOtp)
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tempEmail) return

    const otpValue = otp.join("")
    if (otpValue.length !== 6) {
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
        console.log("Verifying OTP and creating account with data:", {
          username: tempUserData.username,
          email: tempUserData.email,
          name: tempUserData.name,
          referralCode: tempUserData.referralCode,
          otpValue
        });

        const result = await signup(
          tempUserData.username,
          tempUserData.email,
          tempUserData.password,
          tempUserData.name,
          tempUserData.referralCode,
          otpValue
        )

        if (result.success) {
          dispatch(reduxLogin({ user: result.user as any, token: result.token }))

          toast({
            title: "Account Created Successfully",
            description: "Welcome to ChainVerse!",
            className: "bg-green-600 text-white border-none",
          })

          router.push(redirectUrl)
        } else {
          throw new Error(result.error)
        }
      } else if (verificationType === "forgot-password") {
        const result = await verifyForgotPasswordOtp(tempEmail, otpValue)
        if (result.success) {
          toast({
            title: "OTP Verified",
            description: "You can now reset your password.",
            className: "bg-green-600 text-white border-none",
          })

          router.push(`${USER_ROUTES.RESET_PASSWORD}?redirect=${encodeURIComponent(redirectUrl)}`)
        } else {
          throw new Error(result.error)
        }
      }
    } catch (err: any) {
      console.error("OTP verification error:", err);
      toast({
        title: "Verification Failed",
        description: err.message || "OTP verification failed",
        variant: "destructive",
      })
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleResend = async () => {
    if (!tempEmail) return

    try {
      const result = await requestOtp(tempEmail)
      if (result.success) {
        toast({
          title: "OTP Resent",
          description: "Please check your email for the new verification code",
          className: "bg-green-600 text-white border-none",
        })

        setCountdown(60)
        setResendDisabled(true)
        setOtp(["", "", "", "", "", ""])
      } else {
        throw new Error(result.error)
      }
    } catch (err: any) {
      toast({
        title: "Failed to Resend",
        description: err.message || "Failed to resend OTP",
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
    <div className="relative w-full max-w-md mx-auto p-4">
      <Button variant="ghost" className="mb-4 text-gray-400 hover:text-gray-300" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="text-center mb-8">
        <Link
          href={COMMON_ROUTES.HOME}
          className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
        >
          ChainVerse
        </Link>
        <p className="text-gray-400 mt-2">Verify your email</p>
      </div>

      <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30 shadow-lg shadow-blue-500/10">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-gray-200">Enter Verification Code</CardTitle>
          <p className="text-gray-400 text-sm mt-2">
            We&apos;ve sent a 6-digit code to <span className="text-blue-400">{tempEmail}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el: any) => (inputRefs.current[index] = el)}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onPaste={(e) => handlePaste(e, index)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  maxLength={1}
                  className="w-12 h-12 text-center text-lg font-mono bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="-"
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={loading || otp.some((digit) => !digit)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 disabled:opacity-50 rounded-lg font-semibold shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Verify & Continue
                </>
              )}
            </Button>
          </form>

          <div className="text-center pt-4">
            <p className="text-gray-400 text-sm">Didn&apos;t receive the code?</p>
            <Button
              type="button"
              variant="ghost"
              onClick={handleResend}
              disabled={resendDisabled}
              className={`mt-2 text-blue-400 hover:text-blue-300 transition-colors ${resendDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Resend OTP {resendDisabled && <span className="ml-1">in {countdown}s</span>}
            </Button>
          </div>

          <div className="mt-6 bg-slate-900/30 p-3 rounded-lg border border-slate-700">
            <p className="text-xs text-gray-400 text-center">
              For your security, the verification code will expire in 10 minutes. Please do not share this code with anyone.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}