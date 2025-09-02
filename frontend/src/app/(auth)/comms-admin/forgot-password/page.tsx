"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ArrowLeft, Home, Shield, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { communityAdminApiService } from '@/services/communityAdminApiService'
import { toast } from '@/hooks/use-toast'
import { validateEmail } from '@/validations/communityAdminValidation'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<{ email?: string }>({})

  const validateForm = () => {
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      setErrors({ email: emailValidation.error })
      return false
    }
    setErrors({})
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setSent(false)

    try {
      const result = await communityAdminApiService.forgotPassword(email)

      if (result.success) {
        setSent(true)
        localStorage.setItem('forgotPasswordEmail', email)
        toast({
          title: "Success",
          description: result.message || "Password reset code sent to your email",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send reset code",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
                {sent ? <CheckCircle className="h-8 w-8 text-white" /> : <Shield className="h-8 w-8 text-white" />}
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              {sent ? 'Check Your Email' : 'Reset Password'}
            </CardTitle>
            <p className="text-gray-400">
              {sent
                ? 'We\'ve sent a password reset code to your email address'
                : 'Enter your email address and we\'ll send you a code to reset your password'
              }
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-red-400 font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-400/60" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-10 bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20 ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.email}</p>}
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-3 font-semibold rounded-xl shadow-lg shadow-red-900/30 hover:shadow-red-800/40 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Code'
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-10 w-10 text-green-400" />
                  </div>
                  <p className="text-gray-300">
                    A password reset code has been sent to <span className="text-red-400 font-semibold">{email}</span>
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/comms-admin/verify-otp')}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-3 font-semibold rounded-xl shadow-lg shadow-red-900/30 hover:shadow-red-800/40 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Continue to Verification
                </Button>
              </div>
            )}
            <div className="text-center pt-4 border-t border-red-800/30">
              <Button
                variant="link"
                onClick={() => router.push('/comms-admin/login')}
                className="text-red-400 hover:text-red-300 p-0 h-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}