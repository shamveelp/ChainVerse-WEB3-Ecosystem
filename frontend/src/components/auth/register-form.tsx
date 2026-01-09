"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, User, Mail, Lock, Bitcoin, Loader2, Wand2, CheckCircle, XCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    } catch (err) {
      const error = err as { response: { data: { error: string } } }
      console.error("Registration error:", err)
      toast({
        title: "Registration Failed",
        description: error.response?.data?.error || "Failed to register. Please try again.",
        variant: "destructive",
      })
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      await googleLogin(credentialResponse.credential, formData.referralCode)
    }
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
      return <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
    }
    if (usernameAvailable === true) {
      return <CheckCircle className="h-3 w-3 text-green-500" />
    }
    if (usernameAvailable === false) {
      return <XCircle className="h-3 w-3 text-red-500" />
    }
    return null
  }

  return (
    <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/50">
      <div className="space-y-1 mb-4 text-center lg:text-left">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Join ChainVerse
        </h2>
        <p className="text-xs text-gray-400">
          Your gateway to trading and social networking
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
            text="signup_with"
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
              Or email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Row 1: Name & Username */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-semibold text-gray-400 uppercase tracking-wide ml-1">
                Full Name
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="h-9 pl-9 bg-black/20 border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-cyan-500/50 focus:bg-black/40 focus:ring-1 focus:ring-cyan-500/20 rounded-lg transition-all"
                />
              </div>
              {errors.name && <p className="text-red-400 text-[10px] pl-1 font-medium">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="username" className="text-xs font-semibold text-gray-400 uppercase tracking-wide ml-1">
                Username
              </label>
              <div className="relative flex gap-1">
                <div className="relative flex-1 group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className="h-9 pl-9 pr-6 bg-black/20 border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-cyan-500/50 focus:bg-black/40 focus:ring-1 focus:ring-cyan-500/20 rounded-lg transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {getUsernameStatusIcon()}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateUsername}
                  disabled={isGeneratingUsername}
                  className="h-9 w-9 bg-white/5 border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/30 text-cyan-400 rounded-lg transition-all shrink-0"
                  title="Generate"
                >
                  {isGeneratingUsername ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
              {errors.username && <p className="text-red-400 text-[10px] pl-1 font-medium">{errors.username}</p>}
              {usernameAvailable === false && (
                <p className="text-red-400 text-[10px] pl-1 font-medium">Taken</p>
              )}
              {usernameAvailable === true && (
                <p className="text-green-400 text-[10px] pl-1 font-medium">Available</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-semibold text-gray-400 uppercase tracking-wide ml-1">
              Email
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="h-9 pl-9 bg-black/20 border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-cyan-500/50 focus:bg-black/40 focus:ring-1 focus:ring-cyan-500/20 rounded-lg transition-all"
              />
            </div>
            {errors.email && <p className="text-red-400 text-[10px] pl-1 font-medium">{errors.email}</p>}
          </div>

          {/* Row 2: Passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-semibold text-gray-400 uppercase tracking-wide ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="******"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="h-9 pl-9 pr-9 bg-black/20 border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-cyan-500/50 focus:bg-black/40 focus:ring-1 focus:ring-cyan-500/20 rounded-lg transition-all"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9 text-gray-500 hover:text-cyan-400 hover:bg-transparent transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
              {errors.password && <p className="text-red-400 text-[10px] pl-1 font-medium">{errors.password}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-400 uppercase tracking-wide ml-1">
                Confirm
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="******"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className="h-9 pl-9 pr-9 bg-black/20 border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-cyan-500/50 focus:bg-black/40 focus:ring-1 focus:ring-cyan-500/20 rounded-lg transition-all"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9 text-gray-500 hover:text-cyan-400 hover:bg-transparent transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-[10px] pl-1 font-medium">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="referralCode" className="text-xs font-semibold text-gray-400 uppercase tracking-wide ml-1">
              Referral Code <span className="text-gray-600 font-normal normal-case">(Optional)</span>
            </label>
            <div className="relative group">
              <Bitcoin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              <Input
                id="referralCode"
                type="text"
                placeholder="Code"
                value={formData.referralCode}
                onChange={(e) => handleInputChange("referralCode", e.target.value.toUpperCase())}
                maxLength={8}
                className="h-9 pl-9 bg-black/20 border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-cyan-500/50 focus:bg-black/40 focus:ring-1 focus:ring-cyan-500/20 rounded-lg transition-all"
              />
            </div>
            {errors.referralCode && <p className="text-red-400 text-[10px] pl-1 font-medium">{errors.referralCode}</p>}
            {formData.referralCode && formData.referralCode.length === 8 && (
              <p className="text-cyan-400 text-[10px] pl-1 animate-pulse">Earn 100 bonus points!</p>
            )}
          </div>

          <div className="flex items-start space-x-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={() => setAgreeTerms(!agreeTerms)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0"
            />
            <label htmlFor="terms" className="text-xs text-gray-400 leading-snug">
              I agree to{" "}
              <Link href={COMMON_ROUTES.TERMS} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Terms
              </Link>{" "}
              &{" "}
              <Link href={COMMON_ROUTES.PRIVACY} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Privacy
              </Link>
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading || usernameAvailable !== true || !agreeTerms}
            className="w-full h-10 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-sm font-bold shadow-lg shadow-cyan-900/20 hover:shadow-cyan-500/20 border border-white/10 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform group mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Bitcoin className="mr-2 h-4 w-4" />
                Create Account
                <ArrowRight className="ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </>
            )}
          </Button>
        </form>

        <div className="text-center pt-1">
          <p className="text-gray-400 text-xs">
            Already have an account?{" "}
            <Link
              href={`${USER_ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectUrl)}`}
              className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 transition-all"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

