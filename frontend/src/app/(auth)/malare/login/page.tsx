"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock, Home, Users, Loader2 } from 'lucide-react'
import { useCommunityAdminAuthActions } from '@/lib/communityAdminAuthActions'
import type { RootState } from '@/redux/store'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useCommunityAdminAuthActions()
  const { loading } = useSelector((state: RootState) => state.communityAdminAuth)
    
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black" />
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-r from-red-600/10 to-red-800/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-gradient-to-r from-red-500/5 to-red-700/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-50">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-800/30 backdrop-blur-sm"
        >
          <Home className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-black/80 backdrop-blur-xl border-red-800/30 shadow-2xl shadow-red-900/20">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center animate-pulse">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <p className="text-gray-400">Sign in to your community dashboard</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-red-400 font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-400/60" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-red-400 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-400/60" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400/60 hover:text-red-400"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => router.push('/malare/forgot-password')}
                  className="text-red-400 hover:text-red-300 p-0 h-auto"
                >
                  Forgot password?
                </Button>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-3 font-semibold rounded-xl shadow-lg shadow-red-900/30 hover:shadow-red-800/40 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            <div className="text-center pt-4 border-t border-red-800/30">
              <p className="text-gray-400">
                Don't have a community?{' '}
                <Button
                  variant="link"
                  onClick={() => router.push('/malare/create-community')}
                  className="text-red-400 hover:text-red-300 p-0 h-auto font-semibold"
                >
                  Create one
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
