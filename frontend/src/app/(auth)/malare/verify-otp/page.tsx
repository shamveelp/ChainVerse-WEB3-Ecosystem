"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Home, ArrowLeft, RefreshCw } from 'lucide-react'
import { verifyForgotPasswordOtp, forgotPassword } from '@/services/communityAdminApiService'
import { useToast } from '@/hooks/use-toast'

export default function VerifyOTPPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [timer, setTimer] = useState(60)
  const [email, setEmail] = useState<string | null>(null); // State to hold the email
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const storedEmail = localStorage.getItem('forgotPasswordEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email is found, redirect back to forgot password page
      router.push('/forgot-password');
      toast({
        title: "Error",
        description: "Please enter your email to reset password first.",
        variant: "destructive",
      });
    }

    if (timer > 0) {
      const interval = setInterval(() => setTimer(timer - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [timer, router, toast])

  const handleChange = (index: number, value: string) => {
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
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullOtp = otp.join('');
    if (!email || fullOtp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true)
    const result = await verifyForgotPasswordOtp(email, fullOtp)

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
      router.push('/malare/reset-password')
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleResend = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email not found. Please go back to the forgot password page.",
        variant: "destructive",
      });
      return;
    }

    setResending(true)
    setTimer(60) // Reset timer on resend

    const result = await forgotPassword(email)

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setResending(false)
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-600/10 to-red-800/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-red-500/5 to-red-700/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-50">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-800/30 backdrop-blur-sm"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </div>
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-black/80 backdrop-blur-xl border-red-800/30 shadow-2xl shadow-red-900/20">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center animate-pulse">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Verify OTP
            </CardTitle>
            <p className="text-gray-400">
              Enter the 6-digit code sent to your email address {email && <span className="font-semibold text-red-400">{email}</span>}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex gap-3 justify-center">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el:any) => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-bold bg-red-950/20 border-red-800/30 text-white focus:border-red-600 focus:ring-red-600/20"
                  />
                ))}
              </div>
              <Button
                type="submit"
                disabled={loading || otp.some(digit => !digit) || !email}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-3 font-semibold rounded-xl shadow-lg shadow-red-900/30 hover:shadow-red-800/40 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  'Verify Code'
                )}
              </Button>
            </form>
            <div className="text-center space-y-4">
              <p className="text-gray-400 text-sm">
                Didn't receive the code?
              </p>
              {timer > 0 ? (
                <p className="text-red-400 text-sm">
                  Resend code in {timer}s
                </p>
              ) : (
                <Button
                  variant="link"
                  onClick={handleResend}
                  disabled={resending || !email}
                  className="text-red-400 hover:text-red-300 p-0 h-auto"
                >
                  {resending ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Resending...
                    </div>
                  ) : (
                    'Resend Code'
                  )}
                </Button>
              )}
            </div>
            <div className="text-center pt-4 border-t border-red-800/30">
              <Button
                variant="link"
                onClick={() => router.push('/forgot-password')}
                className="text-red-400 hover:text-red-300 p-0 h-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Reset Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
