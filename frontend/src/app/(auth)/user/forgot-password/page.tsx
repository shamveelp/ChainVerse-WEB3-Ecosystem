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
import { apiService } from "@/lib/api"
import { AuthGuard } from "@/lib/auth-guard"
import { sessionManager } from "@/lib/session-manager"

function ForgotPasswordPageContent() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

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
    setIsLoading(true)
    try {
      const response = await apiService.forgotPassword(email)
      if (response.success && response.resetToken) {
        // Generate secure session ID and store reset token
        const sessionId = sessionManager.generateSessionId()
        sessionManager.storeResetToken(sessionId, response.resetToken, email)
        toast({
          title: "Reset Code Sent",
          description: "Please check your email for the password reset code",
        })
        router.push(`/user/verify-otp?session=${sessionId}`)
      } else {
        toast({
          title: "Failed to Send Reset Code",
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
      setIsLoading(false)
    }
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
          <p className="text-gray-400 mt-2">Reset your password</p>
        </div>
        <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-200">Forgot Password</CardTitle>
            <p className="text-gray-400 text-sm mt-2">
              Enter your email address and we&apos;ll send you a code to reset your password
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
                  />
                </div>
                {emailError && <p className="text-red-400 text-sm">{emailError}</p>}
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Reset Code...
                  </>
                ) : (
                  "Send Reset Code"
                )}
              </Button>
            </form>
            <div className="text-center">
              <p className="text-gray-400">
                Remember your password?{" "}
                <Link href="/user/login" className="text-blue-400 hover:text-blue-300 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <AuthGuard requireGuest={true} redirectTo="/">
      <ForgotPasswordPageContent />
    </AuthGuard>
  )
}
