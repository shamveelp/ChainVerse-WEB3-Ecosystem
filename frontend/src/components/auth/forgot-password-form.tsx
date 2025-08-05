"use client"
import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/redux/store"
import { setTempEmail, setLoading, setTempUserData } from "@/redux/slices/userAuthSlice"
import API from "@/lib/api-client"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [isCooldown, setIsCooldown] = useState(false)
  const router = useRouter()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const { loading } = useSelector((state: RootState) => state.userAuth)

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError("Email is required")
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email is invalid")
      return false
    }
    setEmailError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      return
    }

    if (isCooldown) {
      toast({
        title: "Please Wait",
        description: "Please wait 30 seconds before requesting another OTP.",
        variant: "destructive",
      })
      return
    }

    dispatch(setLoading(true))

    try {
      // Call API directly like your friend's code
      const response = await API.post("/api/user/forgot-password", { email })

      // Store email in Redux and clear user data
      dispatch(setTempEmail(email))
      dispatch(setTempUserData(null))

      toast({
        title: "Verification Code Sent",
        description: "Please check your email for the password reset code",
      })

      // Set cooldown
      setIsCooldown(true)
      setTimeout(() => setIsCooldown(false), 30 * 1000)

      // Navigate to OTP verification
      router.push("/user/verify-otp")
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message
      toast({
        title: "Failed to Send Reset Code",
        description: errorMessage || "Please try again later",
        variant: "destructive",
      })
    } finally {
      dispatch(setLoading(false))
    }
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
        <p className="text-gray-400 mt-2">Reset your password</p>
      </div>

      <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-gray-200">Forgot Password</CardTitle>
          <p className="text-gray-400 text-sm mt-2">
            Enter your email address and we&apos;ll send you a verification code
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError("")
                  }}
                  className="bg-slate-700/50 border-slate-600 text-white h-12 pl-10"
                  disabled={loading}
                  required
                />
              </div>
              {emailError && <p className="text-red-400 text-sm">{emailError}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading || isCooldown}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Verification Code...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-gray-400">
              Remember your password?{" "}
              <Link href="/user/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Back to Login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
