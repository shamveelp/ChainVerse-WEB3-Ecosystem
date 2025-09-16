"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Home, ArrowLeft, RefreshCw, Loader2, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { verifyResetOtp, forgotPassword } from '@/services/adminApiService'
import { ADMIN_ROUTES, COMMON_ROUTES } from '@/routes'

const ChainVerseLogo = ({ className }: { className?: string }) => (
  <div className={`flex items-center ${className}`}>
    <div className="relative">
      <div className="h-8 w-8 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
        <div className="h-4 w-4 bg-slate-900 rounded-sm" />
      </div>
      <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse" />
    </div>
    <div className="ml-3 text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent">
      Chain<span className="text-cyan-400">Verse</span>
    </div>
  </div>
)

export default function AdminVerifyResetOTP() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [timer, setTimer] = useState(60)
  const [email, setEmail] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const storedEmail = localStorage.getItem('resetPasswordEmail')
    if (storedEmail) {
      setEmail(storedEmail)
    } else {
      router.push(ADMIN_ROUTES.FORGOT_PASSWORD)
      toast({
        title: "Error",
        description: "Please enter your email first",
        variant: "destructive"
      })
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
    const fullOtp = otp.join('')

    if (!email || fullOtp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await verifyResetOtp(email, fullOtp)

      if (response.success) {
        toast({
          title: "Success",
          description: "OTP verified successfully",
          className: "bg-green-900/90 border-green-500/50 text-green-100"
        })
        router.push(ADMIN_ROUTES.RESET_PASSWORD)
      } else {
        toast({
          title: "Error",
          description: response.error || "Invalid OTP",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) return

    setResending(true)
    setTimer(60)

    try {
      const response = await forgotPassword(email)
      if (response.success) {
        toast({
          title: "Success",
          description: "New OTP sent to your email",
          className: "bg-green-900/90 border-green-500/50 text-green-100"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend OTP",
        variant: "destructive"
      })
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Back buttons */}
      <div className="absolute top-6 left-6 z-50 flex gap-3">
        <Button
          onClick={() => router.push(COMMON_ROUTES.HOME)}
          variant="ghost"
          className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
        <Button
          onClick={() => router.push(ADMIN_ROUTES.FORGOT_PASSWORD)}
          variant="ghost"
          className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <ChainVerseLogo className="justify-center" />
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span className="text-sm text-slate-400 font-medium tracking-wider">OTP VERIFICATION</span>
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
          </div>
        </div>

        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-cyan-400/30">
              <Shield className="h-10 w-10 text-cyan-400" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent">
                Verify OTP
              </CardTitle>
              <CardDescription className="text-slate-400 text-lg">
                Enter the 6-digit code sent to your email
              </CardDescription>
              {email && (
                <p className="text-cyan-400 text-sm font-medium">{email}</p>
              )}
            </div>
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
                    className="w-12 h-12 text-center text-xl font-bold bg-slate-800/50 border-slate-600/50 text-slate-100 focus:border-cyan-400/50 focus:ring-cyan-400/20"
                  />
                ))}
              </div>

              <Button
                type="submit"
                disabled={loading || otp.some(digit => !digit) || !email}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-cyan-400/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Verifying Code...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <p className="text-slate-400 text-sm">Didn't receive the code?</p>
              {timer > 0 ? (
                <p className="text-cyan-400 text-sm">Resend code in {timer}s</p>
              ) : (
                <Button
                  variant="link"
                  onClick={handleResend}
                  disabled={resending || !email}
                  className="text-cyan-400 hover:text-cyan-300 p-0 h-auto"
                >
                  {resending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    'Resend Code'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}