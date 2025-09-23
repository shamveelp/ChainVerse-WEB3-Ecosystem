"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch } from "react-redux"
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { GoogleLogin } from "@react-oauth/google"
import API from "@/lib/api-client"
import { login as reduxLogin } from "@/redux/slices/userAuthSlice"
import { useAuthActions } from "@/lib/auth-actions"
import { useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { setLoading } from "@/redux/slices/userAuthSlice"
import { validateLoginForm } from "@/validations/auth"
import { USER_ROUTES, COMMON_ROUTES } from "@/routes"

interface LoginData {
  email: string
  password: string
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
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
        title: "Login Successful",
        description: "Welcome back to ChainVerse!",
      })

      router.push(redirectUrl)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Invalid email or password"
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      const result = await googleLogin(credentialResponse.credential)
      // if (result.success) {
      //   router.push(redirectUrl)
      // }
    }
  }

  const handleGoogleError = () => {
    toast({
      title: "Google Login Error",
      description: "Google login failed. Please try again.",
      variant: "destructive",
    })
  }

  return (
    <Card className="bg-gray-950/90 backdrop-blur-2xl border border-blue-600/30 shadow-2xl shadow-blue-600/20 rounded-2xl overflow-hidden">
      <CardHeader className="text-center pb-4 bg-gradient-to-b from-blue-900/20 to-transparent">
        <CardTitle className="text-4xl font-bold text-white tracking-tight">Sign In to ChainVerse</CardTitle>
        <p className="text-gray-300 text-sm mt-2 font-medium">Access your trading and social hub</p>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="w-full flex justify-center">
          <GoogleLogin 
            onSuccess={handleGoogleSuccess} 
            onError={handleGoogleError}
            theme="filled_black"
            size="large"
            text="signin_with"
            shape="pill"
          />
        </div>

        <div className="relative">
          <Separator className="bg-blue-600/30" />
          <div className="absolute inset-0 flex justify-center items-center">
            <span className="bg-gray-950 px-4 text-sm text-gray-300">or sign in with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-200">
              Email
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="bg-gray-900/50 border border-blue-600/30 text-white h-12 pl-10 rounded-xl focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 hover:border-blue-500/50"
              />
            </div>
            {errors.email && <p className="text-red-400 text-sm animate-pulse">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-gray-200">
                Password
              </label>
              <Link 
                href={USER_ROUTES.FORGOT_PASSWORD} 
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="bg-gray-900/50 border border-blue-600/30 text-white h-12 pl-10 pr-12 rounded-xl focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 hover:border-blue-500/50"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
            {errors.password && <p className="text-red-400 text-sm animate-pulse">{errors.password}</p>}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 rounded-xl font-semibold shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-gray-300 text-sm">
            Don&apos;t have an account?{" "}
            <Link 
              href={`${USER_ROUTES.REGISTER}?redirect=${encodeURIComponent(redirectUrl)}`} 
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}