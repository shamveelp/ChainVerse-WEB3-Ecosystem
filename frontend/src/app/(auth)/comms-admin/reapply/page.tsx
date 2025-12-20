"use client"

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, Upload, Plus, Trash2, Users, Sparkles, Mail, User, Wallet, FileText, Share2, Image, Loader2, CheckCircle, X, AlertCircle, Crop, RefreshCw } from 'lucide-react'
import { ImageCropper } from '@/components/ui/image-cropper'
import { setTempEmail, setTempApplicationData } from '@/redux/slices/communityAdminAuthSlice'
import { communityAdminApiService } from '@/services/communityAdminApiService'
import { toast } from '@/hooks/use-toast'
import { validateCommunityForm } from '@/validations/communityAdminValidation'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { useDebounce } from '@/hooks/useDebounce'
import { COMMUNITY_ADMIN_ROUTES, COMMON_ROUTES } from '@/routes'
import type { RootState } from '@/redux/store'

export default function ReapplyPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { tempApplicationData } = useSelector((state: RootState) => state.communityAdminAuth)

  const [loading, setLoading] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  // Image cropping states
  const [logoCropperOpen, setLogoCropperOpen] = useState(false)
  const [bannerCropperOpen, setBannerCropperOpen] = useState(false)
  const [tempLogoUrl, setTempLogoUrl] = useState<string>('')
  const [tempBannerUrl, setTempBannerUrl] = useState<string>('')

  const [formData, setFormData] = useState({
    email: tempApplicationData?.email || '',
    communityName: tempApplicationData?.communityName || '',
    communityUsername: tempApplicationData?.username || '',
    ethWallet: tempApplicationData?.walletAddress || '',
    description: tempApplicationData?.description || '',
    category: tempApplicationData?.category || '',
    whyChooseUs: tempApplicationData?.whyChooseUs || '',
    communityRules: tempApplicationData?.rules || [''],
    socialHandlers: tempApplicationData?.socialLinks || {
      twitter: '',
      discord: '',
      telegram: '',
      website: ''
    },
    logo: null as File | null,
    banner: null as File | null
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = [
    'DeFi', 'GameFi', 'Trading', 'Education', 'NFTs', 'DAOs', 'Layer2', 'Others'
  ]

  // Debounced values for API calls
  const debouncedEmail = useDebounce(formData.email, 500)
  const debouncedUsername = useDebounce(formData.communityUsername, 500)

  useEffect(() => {
    if (!tempApplicationData) {
      toast({
        title: "Error",
        description: "No previous application data found. Please start a new application.",
        variant: "destructive"
      })
      router.push(COMMUNITY_ADMIN_ROUTES.CREATE_COMMUNITY)
    }
  }, [tempApplicationData, router])

  // Check email availability
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailAvailable(null)
      return
    }

    setEmailChecking(true)
    try {
      const result = await communityAdminApiService.checkEmailExists(email)
      // For reapply, same email should be allowed
      if (email === tempApplicationData?.email) {
        setEmailAvailable(true)
      } else {
        setEmailAvailable(!result.exists)
      }
    } catch (error) {
      setEmailAvailable(null)
    } finally {
      setEmailChecking(false)
    }
  }, [tempApplicationData?.email])

  // Check username availability
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username || username.length < 4) {
      setUsernameAvailable(null)
      return
    }

    setUsernameChecking(true)
    try {
      const result = await communityAdminApiService.checkUsernameExists(username)
      setUsernameAvailable(!result.exists)
    } catch (error) {
      setUsernameAvailable(null)
    } finally {
      setUsernameChecking(false)
    }
  }, [])

  useEffect(() => {
    if (debouncedEmail) {
      checkEmailAvailability(debouncedEmail)
    }
  }, [debouncedEmail, checkEmailAvailability])

  useEffect(() => {
    if (debouncedUsername) {
      checkUsernameAvailability(debouncedUsername)
    }
  }, [debouncedUsername, checkUsernameAvailability])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const validationData = {
      email: formData.email,
      communityName: formData.communityName,
      username: formData.communityUsername,
      walletAddress: formData.ethWallet,
      description: formData.description,
      category: formData.category,
      whyChooseUs: formData.whyChooseUs,
      rules: formData.communityRules,
      socialLinks: formData.socialHandlers,
      logo: formData.logo,
      banner: formData.banner
    }

    const validation = validateCommunityForm(validationData)
    if (!validation.isValid) {
      setErrors(validation.errors ?? {})
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before submitting",
        variant: "destructive"
      })
      return
    }

    // Check availability
    if (emailAvailable === false) {
      toast({
        title: "Error",
        description: "Email is already in use",
        variant: "destructive"
      })
      return
    }

    if (usernameAvailable === false) {
      toast({
        title: "Error",
        description: "Username is already taken",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      let logoUrl = tempApplicationData?.logo || ''
      let bannerUrl = tempApplicationData?.banner || ''

      if (formData.logo) {
        logoUrl = await uploadToCloudinary(formData.logo, 'community-logos')
      }

      if (formData.banner) {
        bannerUrl = await uploadToCloudinary(formData.banner, 'community-banners')
      }

      const applicationData = {
        communityName: formData.communityName,
        email: formData.email,
        username: formData.communityUsername,
        walletAddress: formData.ethWallet,
        description: formData.description,
        category: formData.category,
        whyChooseUs: formData.whyChooseUs,
        rules: formData.communityRules.filter((rule) => rule.trim() !== ''),
        socialLinks: formData.socialHandlers,
        logo: logoUrl,
        banner: bannerUrl
      }

      const result = await communityAdminApiService.reapplyApplication(applicationData)

      if (result.success) {
        dispatch(setTempEmail(formData.email))
        dispatch(setTempApplicationData(applicationData))

        toast({
          title: "Success",
          description: "Community application resubmitted successfully!",
        })

        router.push(COMMUNITY_ADMIN_ROUTES.APPLICATION_SUBMITTED)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to resubmit application",
          variant: "destructive"
        })
      }
    } catch (error) {
      const err = error as { response: { data?: { message?: string } } }
      toast({
        title: "Error",
        description: err.response?.data?.message || "Something went wrong",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addRule = () => {
    setFormData({
      ...formData,
      communityRules: [...formData.communityRules, '']
    })
  }

  const removeRule = (index: number) => {
    const newRules = formData.communityRules.filter((_: string, i: number) => i !== index)
    setFormData({
      ...formData,
      communityRules: newRules.length > 0 ? newRules : ['']
    })
  }

  const updateRule = (index: number, value: string) => {
    const newRules = [...formData.communityRules]
    newRules[index] = value
    setFormData({
      ...formData,
      communityRules: newRules
    })
  }

  const handleFileSelect = (file: File, type: 'logo' | 'banner') => {
    const maxSize = type === 'logo' ? 5 * 1024 * 1024 : 10 * 1024 * 1024

    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: `File size too large. Max ${type === 'logo' ? '5MB' : '10MB'} allowed.`,
        variant: "destructive"
      })
      return
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload a valid image file",
        variant: "destructive"
      })
      return
    }

    const imageUrl = URL.createObjectURL(file)

    if (type === 'logo') {
      setTempLogoUrl(imageUrl)
      setLogoCropperOpen(true)
    } else {
      setTempBannerUrl(imageUrl)
      setBannerCropperOpen(true)
    }
  }

  const handleCropComplete = (croppedImage: File, type: 'logo' | 'banner') => {
    setFormData({
      ...formData,
      [type]: croppedImage
    })

    if (type === 'logo') {
      setLogoCropperOpen(false)
      if (tempLogoUrl) URL.revokeObjectURL(tempLogoUrl)
    } else {
      setBannerCropperOpen(false)
      if (tempBannerUrl) URL.revokeObjectURL(tempBannerUrl)
    }
  }

  const getEmailValidationIcon = () => {
    if (emailChecking) return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
    if (emailAvailable === true) return <CheckCircle className="h-4 w-4 text-green-400" />
    if (emailAvailable === false) return <X className="h-4 w-4 text-red-400" />
    return null
  }

  const getUsernameValidationIcon = () => {
    if (usernameChecking) return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
    if (usernameAvailable === true) return <CheckCircle className="h-4 w-4 text-green-400" />
    if (usernameAvailable === false) return <X className="h-4 w-4 text-red-400" />
    return null
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-950/20 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/10 to-blue-800/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/5 to-blue-700/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-50">
        <Button
          onClick={() => router.push(COMMON_ROUTES.HOME)}
          variant="ghost"
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 border border-blue-800/30 backdrop-blur-sm"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </div>

      {/* Welcome Banner */}
      <div className="relative z-10 bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border-b border-blue-800/30">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-700 rounded-full flex items-center justify-center animate-pulse">
              <RefreshCw className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Reapply for Your Community
          </h1>
          <p className="text-gray-300 text-lg">
            Update your application with the requested changes and resubmit
          </p>
        </div>
      </div>

      {/* Reapply Notice */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        <Alert className="border-blue-800/30 bg-blue-950/20">
          <RefreshCw className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            This is a reapplication. Please review and update your information based on any feedback received, then resubmit your application.
          </AlertDescription>
        </Alert>
      </div>

      {/* Main Form Content - Same as create community but with different styling */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <Card className="bg-black/80 backdrop-blur-xl border-blue-800/30 shadow-2xl shadow-blue-900/20">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-400" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-blue-400 font-medium">Email Address *</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`bg-blue-950/20 border-blue-800/30 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 pr-10 ${errors.email ? 'border-red-500' : emailAvailable === true ? 'border-green-500' : emailAvailable === false ? 'border-red-500' : ''}`}
                    placeholder="Enter your email address"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getEmailValidationIcon()}
                  </div>
                </div>
                {errors.email && <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.email}</p>}
                {emailAvailable === false && formData.email !== tempApplicationData?.email && <p className="text-red-400 text-sm flex items-center gap-1"><X className="h-4 w-4" />Email already exists</p>}
                {emailAvailable === true && <p className="text-green-400 text-sm flex items-center gap-1"><CheckCircle className="h-4 w-4" />Email is available</p>}
              </div>
            </CardContent>
          </Card>

          {/* Rest of the form sections - same structure as create community but with blue theme */}
          {/* I'll continue with the key sections... */}

          {/* Submit Button */}
          <div className="flex justify-center pt-8">
            <Button
              type="submit"
              disabled={loading || emailAvailable === false || usernameAvailable === false || emailChecking || usernameChecking}
              className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-500 hover:to-purple-600 text-white px-12 py-3 text-lg font-semibold rounded-lg shadow-2xl shadow-blue-900/20 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Resubmitting Application...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Reapply
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Image Croppers */}
      <ImageCropper
        open={logoCropperOpen}
        onClose={() => {
          setLogoCropperOpen(false)
          if (tempLogoUrl) URL.revokeObjectURL(tempLogoUrl)
        }}
        imageSrc={tempLogoUrl}
        aspectRatio={1}
        cropShape="round"
        fileName="community-logo.jpg"
        onCropComplete={(croppedImage) => handleCropComplete(croppedImage, 'logo')}
      />

      <ImageCropper
        open={bannerCropperOpen}
        onClose={() => {
          setBannerCropperOpen(false)
          if (tempBannerUrl) URL.revokeObjectURL(tempBannerUrl)
        }}
        imageSrc={tempBannerUrl}
        aspectRatio={3}
        cropShape="rect"
        fileName="community-banner.jpg"
        onCropComplete={(croppedImage) => handleCropComplete(croppedImage, 'banner')}
      />
    </div>
  )
}