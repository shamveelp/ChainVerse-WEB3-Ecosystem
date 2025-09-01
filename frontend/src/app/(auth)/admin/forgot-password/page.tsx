"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Shield, Loader2, ArrowLeft, Home, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { forgotPassword } from '@/services/adminApiService'

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

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await forgotPassword(email)
      
      if (response.success) {
        localStorage.setItem('resetPasswordEmail', email)
        toast({
          title: "OTP Sent",
          description: "Check your email for the verification code",
          className: "bg-green-900/90 border-green-500/50 text-green-100"
        })
        router.push("/admin/verify-reset-otp")
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to send OTP",
          variant: "destructive",
          className: "bg-red-900/90 border-red-500/50 text-red-100"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
        className: "bg-red-900/90 border-red-500/50 text-red-100"
      })
    } finally {
      setLoading(false)
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
          onClick={() => router.push('/')}
          variant="ghost"
          className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
        <Button
          onClick={() => router.push('/admin/login')}
          variant="ghost"
          className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Button>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <ChainVerseLogo className="justify-center" />
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span className="text-sm text-slate-400 font-medium tracking-wider">ADMIN PASSWORD RECOVERY</span>
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
          </div>
        </div>

        {/* Main Card */}
        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-cyan-400/30">
              <Shield className="h-10 w-10 text-cyan-400" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent">
                Reset Password
              </CardTitle>
              <CardDescription className="text-slate-400 text-lg">
                Enter your email to receive a verification code
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-cyan-400" />
                  Admin Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400/70 group-focus-within:text-cyan-400 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@chainverse.web3"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-cyan-400/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Sending Reset Code...
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5 mr-2" />
                    Send Reset Code
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}