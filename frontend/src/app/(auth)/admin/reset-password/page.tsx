"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Shield, Loader2, Eye, EyeOff, Home, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { resetPassword } from '@/services/adminApiService'
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

export default function AdminResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
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
        description: "Please start the password reset process",
        variant: "destructive"
      })
    }
  }, [router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      })
      return
    }

    if (!email) {
      toast({
        title: "Error",
        description: "Email not found",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const response = await resetPassword(email, password)

      if (response.success) {
        localStorage.removeItem('resetPasswordEmail')
        toast({
          title: "Success",
          description: "Password reset successfully",
          className: "bg-green-900/90 border-green-500/50 text-green-100"
        })
        router.push(ADMIN_ROUTES.LOGIN)
      } else {
        toast({
          title: "Error",
          description: response.error || "Password reset failed",
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

  const passwordsMatch = password === confirmPassword
  const isValid = password.length >= 8 && passwordsMatch

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
          onClick={() => router.push(ADMIN_ROUTES.VERIFY_RESET_OTP)}
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
            <span className="text-sm text-slate-400 font-medium tracking-wider">SET NEW PASSWORD</span>
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
          </div>
        </div>

        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-cyan-400/30">
              <Lock className="h-10 w-10 text-cyan-400" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent">
                Set New Password
              </CardTitle>
              <CardDescription className="text-slate-400 text-lg">
                Create a secure password for your admin account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                  New Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400/70 group-focus-within:text-cyan-400 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-12 bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400/70 hover:text-cyan-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {password && password.length < 8 && (
                  <p className="text-red-400 text-sm">Password must be at least 8 characters</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300 text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400/70 group-focus-within:text-cyan-400 transition-colors" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-12 bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400/70 hover:text-cyan-400 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-red-400 text-sm">Passwords do not match</p>
                )}
                {confirmPassword && passwordsMatch && password.length >= 8 && (
                  <p className="text-green-400 text-sm flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Passwords match
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !isValid}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-cyan-400/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}