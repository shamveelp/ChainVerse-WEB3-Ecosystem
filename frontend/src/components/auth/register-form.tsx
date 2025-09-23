
"use client"
import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, User, Mail, Lock, Bitcoin, Loader2, Wand2, CheckCircle, XCircle } from "lucide-react"
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
import { USER_ROUTES, COMMON_ROUTES } from "@/routes"

interface RegisterData {
  username: string
  name: string
  email: string
  password: string
  confirmPassword: string
  referralCode?: string
}

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<RegisterData>({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  })
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [errors, setErrors] = useState<Partial<RegisterData>>({})
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isGeneratingUsername, setIsGeneratingUsername] = useState(false)
  const router = useRouter()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const { googleLogin } = useAuthActions()
  const { loading } = useSelector((state: RootState) => state.userAuth)
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || COMMON_ROUTES.HOME

  // Check for referral code in URL
  useEffect(() => {
    const refCode = searchParams.get('ref')
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode.toUpperCase() }))
    }
  }, [searchParams])

  const handleInputChange = async (field: keyof RegisterData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }

    // Check username availability
    if (field === 'username' && value.length >= 4) {
      setIsCheckingUsername(true)
      setUsernameAvailable(null)

      try {
        const result = await checkUsername(value)
        if (result.success) {
          setUsernameAvailable(result.available)
        } else {
          setUsernameAvailable(false)
        }
      } catch (err) {
        console.error("Username check error:", err)
        setUsernameAvailable(false)
      } finally {
        setIsCheckingUsername(false)
      }
    } else if (field === 'username' && value.length < 4) {
      setUsernameAvailable(null)
    }
  }

  const handleGenerateUsername = async () => {
    setIsGeneratingUsername(true)
    try {
      const result = await generateUsername()
      if (result.success) {
        setFormData((prev: any) => ({ ...prev, username: result.username }))
        setUsernameAvailable(true)
        toast({
          title: "Username Generated",
          description: `Generated username: ${result.username}`,
          className: "bg-gradient-to-r from-green-500 to-teal-500 text-white border-none",
        })
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
    } finally {
      setIsGeneratingUsername(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const validationErrors = validateRegisterForm(formData, agreeTerms)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    if (!agreeTerms) {
      toast({
        title: "Terms Required",
        description: "You must agree to the Terms and Conditions",
        variant: "destructive",
      })
      return
    }

    if (usernameAvailable !== true) {
      setErrors((prev) => ({ ...prev, username: "Username is not available or not checked" }))
      return
    }

    dispatch(setLoading(true))

    try {
      const result = await register(
        formData.username,
        formData.email,
        formData.password,
        formData.name,
        formData.referralCode
      )

      if (result.success) {
        dispatch(setTempUserData({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          name: formData.name,
          referralCode: formData.referralCode,
        }))
        dispatch(setTempEmail(formData.email))

        toast({
          title: "OTP Sent",
          description: "Check your email for the verification code",
          className: "bg-gradient-to-r from-green-500 to-teal-500 text-white border-none",
        })

        router.push(`${USER_ROUTES.VERIFY_OTP}?redirect=${encodeURIComponent(redirectUrl)}`)
      } else {
        throw new Error(result.error)
      }
    } catch (err: any) {
      console.error("Registration error:", err)
      toast({
        title: "Registration Failed",
        description: err.message || "Failed to register. Please try again.",
        variant: "destructive",
      })
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    // Implementation for Google OAuth
  }

  const handleGoogleError = () => {
    toast({
      title: "Google Login Error",
      description: "Google login failed. Please try again.",
      variant: "destructive",
    })
  }

  const getUsernameStatusIcon = () => {
    if (isCheckingUsername) {
      return <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
    }
    if (usernameAvailable === true) {
      return <CheckCircle className="h-4 w-4 text-green-400" />
    }
    if (usernameAvailable === false) {
      return <XCircle className="h-4 w-4 text-red-400" />
    }
    return null
  }

  return (
    <Card className="bg-gray-950/90 backdrop-blur-2xl border border-blue-600/30 shadow-2xl shadow-blue-600/20 rounded-2xl overflow-hidden">
      <CardHeader className="text-center pb-4 bg-gradient-to-b from-blue-900/20 to-transparent">
        <CardTitle className="text-4xl font-bold text-white tracking-tight">Join ChainVerse</CardTitle>
        <p className="text-gray-300 text-sm mt-2 font-medium">Your gateway to trading and social networking</p>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="w-full flex justify-center">
          <GoogleLogin 
            onSuccess={handleGoogleSuccess} 
            onError={handleGoogleError}
            theme="filled_black"
            size="large"
            text="signup_with"
            shape="pill"
          />
        </div>

        <div className="relative">
          <Separator className="bg-blue-600/30" />
          <div className="absolute inset-0 flex justify-center items-center">
            <span className="bg-gray-950 px-4 text-sm text-gray-300">or join with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-200">
              Full Name
            </label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-gray-900/50 border border-blue-600/30 text-white h-12 pl-10 rounded-xl focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 hover:border-blue-500/50"
              />
            </div>
            {errors.name && <p className="text-red-400 text-sm animate-pulse">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-gray-200">
              Username
            </label>
            <div className="relative flex gap-2">
              <div className="relative flex-1 group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a unique username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="bg-gray-900/50 border border-blue-600/30 text-white h-12 pl-10 pr-10 rounded-xl focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 hover:border-blue-500/50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {getUsernameStatusIcon()}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGenerateUsername}
                disabled={isGeneratingUsername}
                className="h-12 w-12 bg-gray-900/50 border-blue-600/30 hover:bg-blue-600/20 hover:border-blue-500/50 rounded-xl transition-all duration-300"
                title="Generate random username"
              >
                {isGeneratingUsername ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                ) : (
                  <Wand2 className="h-4 w-4 text-blue-400" />
                )}
              </Button>
            </div>
            {errors.username && <p className="text-red-400 text-sm animate-pulse">{errors.username}</p>}
            {usernameAvailable === false && (
              <p className="text-red-400 text-sm animate-pulse">Username not available</p>
            )}
            {usernameAvailable === true && (
              <p className="text-green-400 text-sm animate-pulse">Username available</p>
            )}
            {isCheckingUsername && (
              <p className="text-yellow-400 text-sm animate-pulse">Checking availability...</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-200">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="bg-gray-900/50 border border-blue-600/30 text-white h-12 pl-10 rounded-xl focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 hover:border-blue-500/50"
              />
            </div>
            {errors.email && <p className="text-red-400 text-sm animate-pulse">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-200">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
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

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-200">
              Confirm Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className="bg-gray-900/50 border border-blue-600/30 text-white h-12 pl-10 pr-12 rounded-xl focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 hover:border-blue-500/50"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-300 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-sm animate-pulse">{errors.confirmPassword}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="referralCode" className="text-sm font-medium text-gray-200">
              Referral Code <span className="text-gray-500">(Optional)</span>
            </label>
            <div className="relative group">
              <Bitcoin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <Input
                id="referralCode"
                type="text"
                placeholder="Enter referral code (Optional)"
                value={formData.referralCode}
                onChange={(e) => handleInputChange("referralCode", e.target.value.toUpperCase())}
                maxLength={8}
                className="bg-gray-900/50 border border-blue-600/30 text-white h-12 pl-10 rounded-xl focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 hover:border-blue-500/50"
              />
            </div>
            {errors.referralCode && <p className="text-red-400 text-sm animate-pulse">{errors.referralCode}</p>}
            {formData.referralCode && formData.referralCode.length === 8 && (
              <p className="text-blue-400 text-sm animate-pulse">Earn 100 bonus points with a valid referral code!</p>
            )}
          </div>

          <div className="flex items-start space-x-2 text-sm">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={() => setAgreeTerms(!agreeTerms)}
              className="h-4 w-4 rounded accent-blue-600 border-blue-600/30 mt-0.5 transition-colors"
            />
            <label htmlFor="terms" className="text-gray-300 leading-relaxed">
              I agree to the{" "}
              <a href="#terms" className="text-blue-400 hover:text-blue-300 transition-colors underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#privacy" className="text-blue-400 hover:text-blue-300 transition-colors underline">
                Privacy Policy
              </a>
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading || usernameAvailable !== true || !agreeTerms}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 rounded-xl font-semibold shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <Bitcoin className="mr-2 h-5 w-5" />
                Join ChainVerse
              </>
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-gray-300 text-sm">
            Already have an account?{" "}
            <Link
              href={`${USER_ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectUrl)}`}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}