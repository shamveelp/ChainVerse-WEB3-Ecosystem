"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { GoogleLogin } from "@react-oauth/google"
import API from "@/lib/api-client"
import { login as reduxLogin, setLoading } from "@/redux/slices/userAuthSlice"
import { useAuthActions } from "@/lib/auth-actions"
import type { RootState } from "@/redux/store"
import { validateLoginForm } from "@/validations/auth"
import { USER_ROUTES, COMMON_ROUTES } from "@/routes"

interface LoginData {
  email: string
  password: string
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Partial<LoginData>>({})
  const { toast } = useToast()
  const { googleLogin } = useAuthActions()
  const { loading } = useSelector((state: RootState) => state.userAuth)
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || COMMON_ROUTES.HOME

  const handleInputChange = (field: keyof LoginData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const validationErrors = validateLoginForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    dispatch(setLoading(true))

    try {
      const response = await API.post("/api/user/login", {
        email: formData.email,
        password: formData.password,
      })

      dispatch(
        reduxLogin({
          user: response.data.user,
          token: response.data.token || response.data.accessToken,
        }),
      )

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in to ChainVerse.",
      })

      router.push(redirectUrl)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Invalid email or password"
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      await googleLogin(credentialResponse.credential)
    }
  }

  const handleGoogleError = () => {
    toast({
      title: "Google Login Error",
      description: "Unable to authenticate with Google. Please try again.",
      variant: "destructive",
    })
  }

  return (
    <div className="w-full">
      <Card className="border-0 shadow-2xl bg-white">
        <CardHeader className="space-y-1 pb-6 pt-8 px-8">
          <CardTitle className="text-3xl font-bold text-gray-900 tracking-tight">
            Welcome back
          </CardTitle>
          <p className="text-gray-600 text-base">
            Enter your credentials to access your account
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <div className="space-y-6">
            {/* Google Login */}
            <div className="w-full flex justify-center">
              <GoogleLogin 
                onSuccess={handleGoogleSuccess} 
                onError={handleGoogleError}
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                width="384"
              />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label 
                  htmlFor="email" 
                  className="text-sm font-semibold text-gray-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="h-12 pl-11 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label 
                  htmlFor="password" 
                  className="text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="h-12 pl-11 pr-11 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked:any) => setRememberMe(checked as boolean)}
                    className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                  >
                    Remember me
                  </label>
                </div>
                <Link 
                  href={USER_ROUTES.FORGOT_PASSWORD} 
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to account
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm pt-2">
              <Shield className="h-4 w-4" />
              <span>Secured with industry-standard encryption</span>
            </div>

            {/* Sign Up Link */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-center text-gray-600 text-sm">
                Don't have an account?{" "}
                <Link 
                  href={`${USER_ROUTES.REGISTER}?redirect=${encodeURIComponent(redirectUrl)}`} 
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Create a free account
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}