"use client"
import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, User, Mail, Lock, Bitcoin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { GoogleLogin } from "@react-oauth/google"
import { useAuthActions } from "@/lib/auth-actions"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/redux/store"
import { setTempEmail, setTempUserData, setLoading } from "@/redux/slices/userAuthSlice"
import API from "@/lib/api-client"

interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [errors, setErrors] = useState<Partial<RegisterData>>({})
  const router = useRouter()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const { googleLogin } = useAuthActions()
  const { loading } = useSelector((state: RootState) => state.userAuth)

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const passwordValidation = (password: string): boolean => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return regex.test(password)
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterData> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    } else if (!passwordValidation(formData.password)) {
      newErrors.password =
        "Password must include uppercase, lowercase, number, and special character"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (!agreeTerms) {
      toast({
        title: "Terms Required",
        description: "You must agree to the Terms and Conditions",
        variant: "destructive",
      })
      return false
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    dispatch(setLoading(true))

    try {
      await API.post("/api/user/request-otp", { email: formData.email })

      dispatch(
        setTempUserData({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      )
      dispatch(setTempEmail(formData.email))

      toast({
        title: "OTP Sent",
        description: "Check your email for the verification code",
        className: "bg-green-600 text-white border-none",
      })

      router.push("/user/verify-otp")
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.response?.data?.error || "Failed to send OTP",
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
    <Card className="bg-gray-900/80 backdrop-blur-xl border border-blue-500/20 shadow-xl shadow-blue-500/10">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-3xl font-bold text-white">Join CryptoVerse</CardTitle>
        <p className="text-gray-400 text-sm mt-2">Securely create your trading account</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="w-full flex justify-center">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        </div>

        <div className="relative">
          <Separator className="bg-gray-700" />
          <div className="absolute inset-0 flex justify-center">
            <span className="bg-gray-900 px-4 text-sm text-gray-400">or register with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-200">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-gray-800/50 border border-blue-500/30 text-white h-12 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-200">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
              <Input
                id="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="bg-gray-800/50 border border-blue-500/30 text-white h-12 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-200">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="bg-gray-800/50 border border-blue-500/30 text-white h-12 pl-10 pr-12 rounded-lg focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
            {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-200">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className="bg-gray-800/50 border border-blue-500/30 text-white h-12 pl-10 pr-12 rounded-lg focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword}</p>}
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={() => setAgreeTerms(!agreeTerms)}
              className="h-4 w-4 rounded accent-blue-600 border-blue-500/30"
            />
            <label htmlFor="terms" className="text-gray-300">
              I agree to the{" "}
              <a href="#terms" className="text-blue-400 hover:text-blue-300 transition-colors">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
                Privacy Policy
              </a>
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white h-12 rounded-lg font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <Bitcoin className="mr-2 h-5 w-5" />
                JOIN NOW
              </>
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <Link href="/user/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}



