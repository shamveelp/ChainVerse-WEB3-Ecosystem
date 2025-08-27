"use client"
import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, User, Mail, Lock, Bitcoin, Loader2, Wand2 } from "lucide-react"
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
import { validateRegisterForm } from "@/validations/auth"
import { register, checkUsername, generateUsername } from "@/services/authApiService"

interface RegisterData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<RegisterData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [errors, setErrors] = useState<Partial<RegisterData>>({})
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const router = useRouter()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const { googleLogin } = useAuthActions()
  const { loading } = useSelector((state: RootState) => state.userAuth)
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/'

  const handleInputChange = async (field: keyof RegisterData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }

    if (field === 'username' && value.length > 3) {
      setIsCheckingUsername(true)
      try {
        const result = await checkUsername(value)
        if (result.success) {
          setUsernameAvailable(result.available)
        } else {
          setUsernameAvailable(false)
        }
      } catch (err) {
        setUsernameAvailable(false)
      } finally {
        setIsCheckingUsername(false)
      }
    }
  }

  const handleGenerateUsername = async () => {
    try {
      const result = await generateUsername()
      if (result.success) {
        setFormData((prev) => ({ ...prev, username: result.username }))
        setUsernameAvailable(true)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate username",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate username",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateRegisterForm(formData, agreeTerms)
    
    if (Object.keys(validationErrors).length > 0 || !usernameAvailable) {
      setErrors(validationErrors)
      if (!agreeTerms) {
        toast({
          title: "Terms Required",
          description: "You must agree to the Terms and Conditions",
          variant: "destructive",
        })
      }
      if (!usernameAvailable) {
        setErrors((prev) => ({ ...prev, username: "Username is not available" }))
      }
      return
    }

    dispatch(setLoading(true))

    try {
      const result = await register(formData.username, formData.email, formData.password)
      if (result.success) {
        dispatch(
          setTempUserData({
            username: formData.username,
            email: formData.email,
            password: formData.password,
          })
        )
        dispatch(setTempEmail(formData.email))

        toast({
          title: "OTP Sent",
          description: "Check your email for the verification code",
          className: "bg-green-600 text-white border-none",
        })

        router.push(`/user/verify-otp?redirect=${encodeURIComponent(redirectUrl)}`)
      } else {
        throw new Error(result.error)
      }
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message || "Failed to register",
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
      // } else {
      //   toast({
      //     title: "Google Login Error",
      //     description: result.error || "Google login failed",
      //     variant: "destructive",
      //   })
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
            <label htmlFor="username" className="text-sm font-medium text-gray-200">
              Username
            </label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Your Username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="bg-gray-800/50 border border-blue-500/30 text-white h-12 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGenerateUsername}
                disabled={isCheckingUsername}
                className="h-12 w-12"
              >
                <Wand2 className="h-5 w-5" />
              </Button>
            </div>
            {errors.username && <p className="text-red-400 text-sm">{errors.username}</p>}
            {usernameAvailable === false && <p className="text-red-400 text-sm">Username not available</p>}
            {usernameAvailable === true && <p className="text-green-400 text-sm">Username available</p>}
            {isCheckingUsername && <p className="text-yellow-400 text-sm">Checking availability...</p>}
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
            disabled={loading || !usernameAvailable}
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
            <Link href={`/user/login?redirect=${encodeURIComponent(redirectUrl)}`} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}