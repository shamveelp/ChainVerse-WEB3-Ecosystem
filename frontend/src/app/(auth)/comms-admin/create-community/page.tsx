"use client"

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Upload, Plus, Trash2, Users, Sparkles, Mail, User, Wallet, FileText, Share2, Image, Loader2, CheckCircle, X, AlertCircle, Crop } from 'lucide-react'
import { ImageCropper } from '@/components/ui/image-cropper'
import { setTempEmail, setTempApplicationData } from '@/redux/slices/communityAdminAuthSlice'
import { communityAdminApiService } from '@/services/communityAdminApiService'
import { toast } from '@/hooks/use-toast'
import { validateCommunityForm } from '@/validations/communityAdminValidation'
import { useDebounce } from '@/hooks/useDebounce'
import { COMMUNITY_ADMIN_ROUTES, COMMON_ROUTES } from '@/routes'

export default function CreateCommunityPage() {
  const router = useRouter()
  const dispatch = useDispatch()
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

  // Image preview states
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('')
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string>('')

  const [formData, setFormData] = useState({
    email: '',
    communityName: '',
    username: '',
    walletAddress: '',
    description: '',
    category: '',
    whyChooseUs: '',
    rules: [''],
    socialLinks: {
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
  const debouncedUsername = useDebounce(formData.username, 500)

  // Clear specific field error when user types
  const clearFieldError = (fieldName: string) => {
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  // Handle input changes with error clearing
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    clearFieldError(field)
  }

  // Check email availability
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailAvailable(null)
      return
    }

    setEmailChecking(true)
    try {
      const result = await communityAdminApiService.checkEmailExists(email)
      setEmailAvailable(!result.exists)
      if (result.exists) {
        setErrors(prev => ({ ...prev, email: 'Email is already in use' }))
      } else {
        clearFieldError('email')
      }
    } catch (error) {
      setEmailAvailable(null)
    } finally {
      setEmailChecking(false)
    }
  }, [])

  // Check username availability
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username || username.length < 4) {
      setUsernameAvailable(null)
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameAvailable(false)
      setErrors(prev => ({ ...prev, username: 'Username can only contain letters, numbers, and underscores' }))
      return
    }

    setUsernameChecking(true)
    try {
      const result = await communityAdminApiService.checkUsernameExists(username)
      setUsernameAvailable(!result.exists)
      if (result.exists) {
        setErrors(prev => ({ ...prev, username: 'Username is already taken' }))
      } else {
        clearFieldError('username')
      }
    } catch (error) {
      setUsernameAvailable(null)
    } finally {
      setUsernameChecking(false)
    }
  }, [])

  useEffect(() => {
    if (debouncedEmail) {
      checkEmailAvailability(debouncedEmail)
    } else {
      setEmailAvailable(null)
      setEmailChecking(false)
    }
  }, [debouncedEmail, checkEmailAvailability])

  useEffect(() => {
    if (debouncedUsername) {
      checkUsernameAvailability(debouncedUsername)
    } else {
      setUsernameAvailable(null)
      setUsernameChecking(false)
    }
  }, [debouncedUsername, checkUsernameAvailability])

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
      if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl)
      if (tempLogoUrl) URL.revokeObjectURL(tempLogoUrl)
      if (tempBannerUrl) URL.revokeObjectURL(tempBannerUrl)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Clear previous errors
      setErrors({})

      // Validate form
      const validation = validateCommunityForm(formData)
      if (!validation.isValid) {
        setErrors(validation.errors || {})
        toast({
          title: "Validation Error",
          description: "Please fix the form errors before submitting",
          variant: "destructive"
        })
        return
      }

      // Check availability one more time before submission
      if (emailAvailable === false) {
        setErrors(prev => ({ ...prev, email: 'Email is already in use' }))
        toast({
          title: "Error",
          description: "Email is already in use",
          variant: "destructive"
        })
        return
      }

      if (usernameAvailable === false) {
        setErrors(prev => ({ ...prev, username: 'Username is already taken' }))
        toast({
          title: "Error",
          description: "Username is already taken",
          variant: "destructive"
        })
        return
      }

      // Wait for any ongoing checks to complete
      if (emailChecking || usernameChecking) {
        toast({
          title: "Please wait",
          description: "Validating your information...",
          variant: "default"
        })
        return
      }

      const applicationData = {
        communityName: formData.communityName.trim(),
        email: formData.email.trim().toLowerCase(),
        username: formData.username.trim(),
        walletAddress: formData.walletAddress.trim(),
        description: formData.description.trim(),
        category: formData.category,
        whyChooseUs: formData.whyChooseUs.trim(),
        rules: formData.rules.filter(rule => rule.trim() !== '').map(rule => rule.trim()),
        socialLinks: {
          twitter: formData.socialLinks.twitter.trim(),
          discord: formData.socialLinks.discord.trim(),
          telegram: formData.socialLinks.telegram.trim(),
          website: formData.socialLinks.website.trim()
        },
        logo: formData.logo,
        banner: formData.banner
      }

      

      const result = await communityAdminApiService.submitCommunityApplication(applicationData as any)

      if (result.success) {
        dispatch(setTempEmail(formData.email))
        
        // Store only serializable data in Redux (excluding File objects)
        const serializableData = {
          communityName: applicationData.communityName,
          email: applicationData.email,
          username: applicationData.username,
          walletAddress: applicationData.walletAddress,
          description: applicationData.description,
          category: applicationData.category,
          whyChooseUs: applicationData.whyChooseUs,
          rules: applicationData.rules,
          socialLinks: applicationData.socialLinks,
          logoFileName: formData.logo?.name,
          bannerFileName: formData.banner?.name
        }
        dispatch(setTempApplicationData(serializableData))

        toast({
          title: "Success",
          description: "Community application submitted successfully!",
        })

        router.push(COMMUNITY_ADMIN_ROUTES.SET_PASSWORD)
      } else {
        console.error('Application submission error:', result.error)
        toast({
          title: "Error",
          description: result.error || "Failed to submit application",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Application submission error:', error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addRule = () => {
    if (formData.rules.length < 10) {
      setFormData({
        ...formData,
        rules: [...formData.rules, '']
      })
    }
  }

  const removeRule = (index: number) => {
    const newRules = formData.rules.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      rules: newRules.length > 0 ? newRules : ['']
    })
  }

  const updateRule = (index: number, value: string) => {
    const newRules = [...formData.rules]
    newRules[index] = value
    setFormData({
      ...formData,
      rules: newRules
    })
    clearFieldError('rules')
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

    // Create preview URL for the cropped image
    const previewUrl = URL.createObjectURL(croppedImage)

    if (type === 'logo') {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
      setLogoPreviewUrl(previewUrl)
      setLogoCropperOpen(false)
      if (tempLogoUrl) URL.revokeObjectURL(tempLogoUrl)
      setTempLogoUrl('')
    } else {
      if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl)
      setBannerPreviewUrl(previewUrl)
      setBannerCropperOpen(false)
      if (tempBannerUrl) URL.revokeObjectURL(tempBannerUrl)
      setTempBannerUrl('')
    }
  }

  const removeImage = (type: 'logo' | 'banner') => {
    if (type === 'logo') {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
      setLogoPreviewUrl('')
      setFormData({...formData, logo: null})
    } else {
      if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl)
      setBannerPreviewUrl('')
      setFormData({...formData, banner: null})
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
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-orange-600/10 to-red-800/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-red-500/5 to-orange-700/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-50">
        <Button
          onClick={() => router.push(COMMON_ROUTES.HOME)}
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-800/30 backdrop-blur-sm"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </div>

      {/* Welcome Banner */}
      <div className="relative z-10 bg-gradient-to-r from-red-900/30 to-orange-900/30 backdrop-blur-sm border-b border-red-800/30">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-red-700 rounded-full flex items-center justify-center animate-pulse">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-2">
            Create Your Community
          </h1>
          <p className="text-gray-300 text-lg">
            Build something amazing together - fill out all the details below
          </p>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <Card className="bg-black/80 backdrop-blur-xl border-red-800/30 shadow-2xl shadow-red-900/20">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                <Mail className="h-5 w-5 text-orange-400" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-orange-400 font-medium">Email Address *</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 pr-10 ${errors.email ? 'border-red-500' : emailAvailable === true ? 'border-green-500' : emailAvailable === false ? 'border-red-500' : ''}`}
                    placeholder="Enter your email address"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getEmailValidationIcon()}
                  </div>
                </div>
                {errors.email && <p className="text-red-400 text-sm flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" />{errors.email}</p>}        
                {emailAvailable === true && !errors.email && <p className="text-green-400 text-sm flex items-center gap-1 mt-1"><CheckCircle className="h-4 w-4" />Email is available</p>}
              </div>
            </CardContent>
          </Card>

          {/* Community Details Section */}
          <Card className="bg-black/80 backdrop-blur-xl border-red-800/30 shadow-2xl shadow-red-900/20">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                <User className="h-5 w-5 text-orange-400" />
                Community Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="communityName" className="text-orange-400 font-medium">Community Name *</Label>
                  <Input
                    id="communityName"
                    value={formData.communityName}
                    onChange={(e) => handleInputChange('communityName', e.target.value)}
                    className={`bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 ${errors.communityName ? 'border-red-500' : ''}`}
                    placeholder="Enter community name"
                    required
                  />
                  {errors.communityName && <p className="text-red-400 text-sm flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" />{errors.communityName}</p>}
                </div>
                <div>
                  <Label htmlFor="username" className="text-orange-400 font-medium">Community Username *</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 pr-10 ${errors.username ? 'border-red-500' : usernameAvailable === true ? 'border-green-500' : usernameAvailable === false ? 'border-red-500' : ''}`}
                      placeholder="@username"
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getUsernameValidationIcon()}
                    </div>
                  </div>
                  {errors.username && <p className="text-red-400 text-sm flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" />{errors.username}</p>}

                  {usernameAvailable === true && !errors.username && <p className="text-green-400 text-sm flex items-center gap-1 mt-1"><CheckCircle className="h-4 w-4" />Username is available</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="description" className="text-orange-400 font-medium">Community Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 min-h-[120px] ${errors.description ? 'border-red-500' : ''}`}
                  placeholder="Describe your community... (minimum 50 characters)"
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description && <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.description}</p>}
                  <p className="text-gray-400 text-sm ml-auto">{formData.description.length}/500</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Information Section */}
          <Card className="bg-black/80 backdrop-blur-xl border-red-800/30 shadow-2xl shadow-red-900/20">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                <Wallet className="h-5 w-5 text-orange-400" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="walletAddress" className="text-orange-400 font-medium">ETH Wallet Address *</Label>
                  <Input
                    id="walletAddress"
                    value={formData.walletAddress}
                    onChange={(e) => handleInputChange('walletAddress', e.target.value)}
                    className={`bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 ${errors.walletAddress ? 'border-red-500' : ''}`}
                    placeholder="0x..."
                    required
                  />
                  {errors.walletAddress && <p className="text-red-400 text-sm flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" />{errors.walletAddress}</p>}
                </div>
                <div>
                  <Label className="text-orange-400 font-medium">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      setFormData({...formData, category: value})
                      clearFieldError('category')
                    }}
                  >
                    <SelectTrigger className={`bg-red-950/20 border-red-800/30 text-white focus:border-orange-500 focus:ring-orange-500/20 ${errors.category ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-red-800/30">
                      {categories.map((category) => (
                        <SelectItem key={category} value={category} className="text-white hover:bg-red-950/30">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-red-400 text-sm flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" />{errors.category}</p>}

                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Content Section */}
          <Card className="bg-black/80 backdrop-blur-xl border-red-800/30 shadow-2xl shadow-red-900/20">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                <FileText className="h-5 w-5 text-orange-400" />
                Community Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="whyChooseUs" className="text-orange-400 font-medium">Why did you choose us? *</Label>
                <Textarea
                  id="whyChooseUs"
                  value={formData.whyChooseUs}
                  onChange={(e) => handleInputChange('whyChooseUs', e.target.value)}
                  className={`bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 min-h-[120px] ${errors.whyChooseUs ? 'border-red-500' : ''}`}
                  placeholder="Tell us why you chose our platform... (minimum 30 characters)"
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.whyChooseUs && <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.whyChooseUs}</p>}
                  <p className="text-gray-400 text-sm ml-auto">{formData.whyChooseUs.length}/300</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-orange-400 font-medium">Community Rules *</Label>
                  <Button
                    type="button"
                    onClick={addRule}
                    variant="outline"
                    size="sm"
                    disabled={formData.rules.length >= 10}
                    className="border-orange-500/30 text-orange-400 hover:bg-orange-950/30 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Rule
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.rules.map((rule, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={rule}
                        onChange={(e) => updateRule(index, e.target.value)}
                        className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"       
                        placeholder={`Rule ${index + 1}`}
                      />
                      {formData.rules.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeRule(index)}
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.rules && <p className="text-red-400 text-sm flex items-center gap-1 mt-2"><AlertCircle className="h-4 w-4" />{errors.rules}</p>}        
              </div>
            </CardContent>
          </Card>

          {/* Social Media Section */}
          <Card className="bg-black/80 backdrop-blur-xl border-red-800/30 shadow-2xl shadow-red-900/20">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                <Share2 className="h-5 w-5 text-orange-400" />
                Social Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  value={formData.socialLinks.twitter}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: {...formData.socialLinks, twitter: e.target.value}
                  })}
                  className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                  placeholder="Twitter/X handle"
                />
                <Input
                  value={formData.socialLinks.discord}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: {...formData.socialLinks, discord: e.target.value}
                  })}
                  className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                  placeholder="Discord server"
                />
                <Input
                  value={formData.socialLinks.telegram}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: {...formData.socialLinks, telegram: e.target.value}
                  })}
                  className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                  placeholder="Telegram group"
                />
                <Input
                  value={formData.socialLinks.website}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      socialLinks: {...formData.socialLinks, website: e.target.value}
                    })
                    clearFieldError('website')
                  }}
                  className={`bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 ${errors.website ? 'border-red-500' : ''}`}
                  placeholder="Website URL"
                />
              </div>
              {errors.website && <p className="text-red-400 text-sm flex items-center gap-1 mt-2"><AlertCircle className="h-4 w-4" />{errors.website}</p>}      
            </CardContent>
          </Card>

          {/* Images Section */}
          <Card className="bg-black/80 backdrop-blur-xl border-red-800/30 shadow-2xl shadow-red-900/20">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                <Image className="h-5 w-5 text-orange-400" />
                Logo & Banner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-orange-400 font-medium">Community Logo</Label>
                  <div
                    className="border-2 border-dashed border-red-800/30 rounded-lg p-8 text-center hover:border-orange-500/50 transition-colors cursor-pointer" 
                    onClick={() => document.getElementById('logo-input')?.click()}
                  >
                    {logoPreviewUrl ? (
                      <div className="space-y-3">
                        <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-800">
                          <img
                            src={logoPreviewUrl}
                            alt="Logo preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-green-400 font-medium">Logo uploaded</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeImage('logo')
                            }}
                            className="mt-2 border-red-500/30 text-red-400 hover:bg-red-950/30"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">Upload Logo</p>
                        <p className="text-sm text-gray-500 mt-1">PNG, JPG or GIF (max 5MB)</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 border-orange-500/30 text-orange-400 hover:bg-orange-950/30"
                        >
                          <Crop className="h-4 w-4 mr-1" />
                          Choose & Crop
                        </Button>
                      </>
                    )}
                    <input
                      id="logo-input"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'logo')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-orange-400 font-medium">Community Banner</Label>
                  <div
                    className="border-2 border-dashed border-red-800/30 rounded-lg p-8 text-center hover:border-orange-500/50 transition-colors cursor-pointer" 
                    onClick={() => document.getElementById('banner-input')?.click()}
                  >
                    {bannerPreviewUrl ? (
                      <div className="space-y-3">
                        <div className="w-full h-24 mx-auto rounded-lg overflow-hidden bg-gray-800">
                          <img
                            src={bannerPreviewUrl}
                            alt="Banner preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-green-400 font-medium">Banner uploaded</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeImage('banner')
                            }}
                            className="mt-2 border-red-500/30 text-red-400 hover:bg-red-950/30"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">Upload Banner</p>
                        <p className="text-sm text-gray-500 mt-1">PNG, JPG or GIF (max 10MB)</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 border-orange-500/30 text-orange-400 hover:bg-orange-950/30"
                        >
                          <Crop className="h-4 w-4 mr-1" />
                          Choose & Crop
                        </Button>
                      </>
                    )}
                    <input
                      id="banner-input"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'banner')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center pt-8">
            <Button
              type="submit"
              disabled={loading || emailAvailable === false || usernameAvailable === false || emailChecking || usernameChecking}
              className="bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 text-white px-12 py-3 text-lg font-semibold rounded-lg shadow-2xl shadow-orange-900/20 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Community...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Community
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
          if (tempLogoUrl) {
            URL.revokeObjectURL(tempLogoUrl)
            setTempLogoUrl('')
          }
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
          if (tempBannerUrl) {
            URL.revokeObjectURL(tempBannerUrl)
            setTempBannerUrl('')
          }
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