"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    } catch (err) {
      const error = err as { response: { data: { error: string } } }
      const errorMessage = error.response?.data?.error || "Invalid email or password"
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
    <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/50">
      <div className="space-y-1 mb-6 text-center lg:text-left">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Welcome Back
        </h2>
        <p className="text-xs text-gray-400">
          Enter your credentials to access your account
        </p>
      </div>

      <div className="space-y-4">
        {/* Compact Google Button */}
        <div className="w-full flex justify-center h-10 overflow-hidden rounded-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="filled_black"
            size="medium"
            text="continue_with"
            shape="pill"
            width="100%"
          />
        </div>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="bg-gradient-to-r from-transparent via-white/10 to-transparent h-[1px] w-full" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="px-2 bg-[#0a0a0f] text-gray-500 font-bold tracking-widest">
              Or with email
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-xs font-semibold text-gray-400 uppercase tracking-wide ml-1"
            >
              Email address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="h-10 pl-9 bg-black/20 border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-cyan-500/50 focus:bg-black/40 focus:ring-1 focus:ring-cyan-500/20 rounded-lg transition-all"
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-[10px] pl-1 font-medium mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-gray-400 uppercase tracking-wide ml-1"
            >
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="h-10 pl-9 pr-9 bg-black/20 border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-cyan-500/50 focus:bg-black/40 focus:ring-1 focus:ring-cyan-500/20 rounded-lg transition-all"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 w-10 text-gray-500 hover:text-cyan-400 hover:bg-transparent transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-[10px] pl-1 font-medium mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked: any) => setRememberMe(checked as boolean)}
                className="w-4 h-4 border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 data-[state=checked]:text-black"
              />
              <label
                htmlFor="remember"
                className="text-xs text-gray-400 cursor-pointer select-none hover:text-gray-300 transition-colors"
              >
                Remember me
              </label>
            </div>
            <Link
              href={USER_ROUTES.FORGOT_PASSWORD}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-cyan-900/20 hover:shadow-cyan-500/20 border border-white/10 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="pt-2 text-center">
          <p className="text-gray-400 text-xs">
            Don't have an account?{" "}
            <Link
              href={`${USER_ROUTES.REGISTER}?redirect=${encodeURIComponent(redirectUrl)}`}
              className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 transition-all"
            >
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
