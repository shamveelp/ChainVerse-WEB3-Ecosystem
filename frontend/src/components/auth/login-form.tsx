"use client"
import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { Mail, Lock, Eye, EyeOff, Wallet, Loader2 } from "lucide-react"
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
import { setLoading } from "@/redux/slices/userAuthSlice" // Import setLoading

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

  const handleInputChange = (field: keyof LoginData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginData> = {}
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({}) // Clear previous errors

    if (!validateForm()) {
      return
    }

    dispatch(setLoading(true))

    try {
      // Call API directly like your friend's code
      const response = await API.post("/api/user/login", {
        email: formData.email,
        password: formData.password,
      })

      // Dispatch user data to redux
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

      router.push("/")
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || "Login failed"
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
      await googleLogin(credentialResponse.credential)
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
    <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-gray-200">Sign In</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Google Sign-in */}
        <div className="w-full flex justify-center">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        </div>

        {/* Wallet Connect */}

        <div className="relative">
          <Separator className="bg-slate-700" />
          <div className="absolute inset-0 flex justify-center">
            <span className="bg-slate-800 px-3 text-sm text-gray-400">or sign in with email</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white h-12 pl-10"
              />
            </div>
            {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Password
              </label>
              <Link href="/user/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white h-12 pl-10 pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/user/register" className="text-blue-400 hover:text-blue-300 font-medium">
              Create account
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
