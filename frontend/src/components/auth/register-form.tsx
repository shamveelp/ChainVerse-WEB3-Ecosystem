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
  const redirectUrl = searchParams.get('redirect') || '/'

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
        setFormData((prev) => ({ ...prev, username: result.username }))
        setUsernameAvailable(true)
        toast({
          title: "Username Generated",
          description: `Generated username: ${result.username}`,
          className: "bg-green-600 text-white border-none",
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
      console.log("Submitting registration with data:", {
        username: formData.username,
        email: formData.email,
        name: formData.name,
        referralCode: formData.referralCode
      });
      
      const result = await register(
        formData.username,
        formData.email,
        formData.password,
        formData.name,
        formData.referralCode
      )
      
      if (result.success) {
        // Store temp data for OTP verification - include name and referralCode
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
          className: "bg-green-600 text-white border-none",
        })

        router.push(`/user/verify-otp?redirect=${encodeURIComponent(redirectUrl)}`)
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
    // Implementation for Google OAuth can be added here
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
    <Card className="bg-gray-900/80 backdrop-blur-xl border border-blue-500/20 shadow-xl shadow-blue-500/10">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-3xl font-bold text-white">Join ChainVerse</CardTitle>
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
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-gray-800/50 border border-blue-500/30 text-white h-12 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
          </div>

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
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="bg-gray-800/50 border border-blue-500/30 text-white h-12 pl-10 pr-10 rounded-lg focus:ring-2 focus:ring-blue-500/50 transition-all"
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
                className="h-12 w-12 bg-gray-800/50 border-blue-500/30 hover:bg-gray-700/50"
                title="Generate random username"
              >
                {isGeneratingUsername ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.username && <p className="text-red-400 text-sm">{errors.username}</p>}
            {usernameAvailable === false && (
              <p className="text-red-400 text-sm">Username not available</p>
            )}
            {usernameAvailable === true && (
              <p className="text-green-400 text-sm">Username available</p>
            )}
            {isCheckingUsername && (
              <p className="text-yellow-400 text-sm">Checking availability...</p>
            )}
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
                placeholder="Enter your email address"
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
                placeholder="Create a strong password"
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
                placeholder="Confirm your password"
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

          <div className="space-y-2">
            <label htmlFor="referralCode" className="text-sm font-medium text-gray-200">
              Referral Code <span className="text-gray-500">(Optional)</span>
            </label>
            <div className="relative">
              <Bitcoin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
              <Input
                id="referralCode"
                type="text"
                placeholder="Enter referral code (Optional)"
                value={formData.referralCode}
                onChange={(e) => handleInputChange("referralCode", e.target.value.toUpperCase())}
                maxLength={8}
                className="bg-gray-800/50 border border-blue-500/30 text-white h-12 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            {errors.referralCode && <p className="text-red-400 text-sm">{errors.referralCode}</p>}
            {formData.referralCode && formData.referralCode.length === 8 && (
              <p className="text-blue-400 text-sm">Get 100 bonus points if this referral code is valid!</p>
            )}
          </div>

          <div className="flex items-start space-x-2 text-sm">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={() => setAgreeTerms(!agreeTerms)}
              className="h-4 w-4 rounded accent-blue-600 border-blue-500/30 mt-0.5"
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
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white h-12 rounded-lg font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <Bitcoin className="mr-2 h-5 w-5" />
                JOIN CHAINVERSE
              </>
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <Link 
              href={`/user/login?redirect=${encodeURIComponent(redirectUrl)}`} 
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