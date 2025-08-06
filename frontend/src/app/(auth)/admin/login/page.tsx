"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { Mail, Lock, Shield, Loader2, Eye, EyeOff, Dumbbell, Sparkles, Zap } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { adminLogin } from '@/services/authApiService'
import { login } from '@/redux/slices/adminAuthSlice'

// Web3 ChainVerse Logo Component
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

// Animated Background Component
const AnimatedBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20" />
    
    {/* Floating orbs */}
    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-blue-500/5 to-cyan-400/5 rounded-full blur-3xl animate-pulse delay-500" />
    
    {/* Grid pattern */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
    
    {/* Scanning line effect */}
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent h-px animate-scan" />
  </div>
)

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const dispatch = useDispatch()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await adminLogin(email, password)
      dispatch(login(response.admin))
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard",
        className: "bg-green-900/90 border-green-500/50 text-green-100"
      })
      router.push("/admin/dashboard")
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.response?.data?.error || "Invalid credentials",
        variant: "destructive",
        className: "bg-red-900/90 border-red-500/50 text-red-100"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Custom styles */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.3); }
          50% { box-shadow: 0 0 40px rgba(6, 182, 212, 0.6), 0 0 60px rgba(6, 182, 212, 0.3); }
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <ChainVerseLogo className="justify-center" />
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span className="text-sm text-slate-400 font-medium tracking-wider">WEB3 ECOSYSTEM</span>
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
          </div>
        </div>

        {/* Main Card */}
        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl animate-glow">
          <CardHeader className="text-center space-y-6 pb-8">
            {/* Animated Shield Icon */}
            <div className="mx-auto relative">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center animate-float backdrop-blur-sm border border-cyan-400/30">
                <Shield className="h-10 w-10 text-cyan-400" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-500/20 animate-pulse" />
              </div>
              {/* Orbiting elements */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-bounce" />
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce delay-500" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent">
                Admin Portal
              </CardTitle>
              <CardDescription className="text-slate-400 text-lg">
                Secure access to blockchain command center
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  Neural ID
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400/70 group-focus-within:text-cyan-400 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@chainverse.web3"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300 group-focus-within:shadow-lg group-focus-within:shadow-cyan-400/20"
                    required
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-cyan-400" />
                  Access Code
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400/70 group-focus-within:text-cyan-400 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-12 bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300 group-focus-within:shadow-lg group-focus-within:shadow-cyan-400/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400/70 hover:text-cyan-400 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-cyan-400/25 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Initializing Neural Link...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Access Blockchain Interface
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-700/50">
              <div className="text-center space-y-3">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Shield className="h-3 w-3" />
                  Quantum-encrypted secure access
                </p>
                <p className="text-xs text-slate-500">
                  Need assistance? Contact{' '}
                  <a 
                    href="mailto:support@chainverse.com" 
                    className="text-cyan-400 hover:text-cyan-300 transition-colors underline decoration-cyan-400/30 hover:decoration-cyan-300"
                  >
                    support@chainverse.com
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-xs text-slate-600 flex items-center justify-center gap-2">
            <Sparkles className="h-3 w-3" />
            © 2024 ChainVerse Web3 Ecosystem. All rights reserved.
            <Sparkles className="h-3 w-3" />
          </p>
        </div>
      </div>
    </div>
  )
}
