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
import { Home, Upload, Plus, Trash2, Users, Sparkles, Mail, User, Wallet, FileText, Share2, Image, Loader2, CheckCircle, X, AlertCircle } from 'lucide-react'
import { setTempEmail, setTempApplicationData } from '@/redux/slices/communityAdminAuthSlice'
import { communityAdminApiService } from '@/services/communityAdminApiService'
import { toast } from '@/hooks/use-toast'
import { validateCommunityForm } from '@/validations/communityAdminValidation'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { useDebounce } from '@/hooks/useDebounce'

export default function CreateCommunityPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    communityName: '',
    communityUsername: '',
    ethWallet: '',
    description: '',
    category: '',
    whyChooseUs: '',
    communityRules: [''],
    socialHandlers: {
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
  // Effect for checking username availability
  useEffect(() => {
    if (debouncedUsername) {
      checkUsernameAvailability(debouncedUsername)
    }
  }, [debouncedUsername, checkUsernameAvailability])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const validation = validateCommunityForm(formData)
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
      let logoUrl = ''
      let bannerUrl = ''

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
        rules: formData.communityRules.filter(rule => rule.trim() !== ''),
        socialLinks: formData.socialHandlers,
        logo: logoUrl,
        banner: bannerUrl
      }

      const result = await communityAdminApiService.submitCommunityApplication(applicationData)
      
      if (result.success) {
        dispatch(setTempEmail(formData.email))
        dispatch(setTempApplicationData(applicationData))
        
        toast({
          title: "Success",
          description: "Community application submitted successfully!",
        })
        
        router.push('/comms-admin/set-password')
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit application",
          variant: "destructive"
        })
      }
    } catch (error: any) {
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
    setFormData({
      ...formData,
      communityRules: [...formData.communityRules, '']
    })
  }

  const removeRule = (index: number) => {
    const newRules = formData.communityRules.filter((_, i) => i !== index)
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

  const handleFileUpload = (file: File, type: 'logo' | 'banner') => {
    const maxSize = type === 'logo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024
    
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: `File size too large. Max ${type === 'logo' ? '2MB' : '5MB'} allowed.`,
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
    
    setFormData({
      ...formData,
      [type]: file
    })
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
          onClick={() => router.push('/')}
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
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 pr-10 ${errors.email ? 'border-red-500' : emailAvailable === true ? 'border-green-500' : emailAvailable === false ? 'border-red-500' : ''}`}
                    placeholder="Enter your email address"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getEmailValidationIcon()}
                  </div>
                </div>
                {errors.email && <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.email}</p>}
                {emailAvailable === false && <p className="text-red-400 text-sm flex items-center gap-1"><X className="h-4 w-4" />Email already exists</p>}
                {emailAvailable === true && <p className="text-green-400 text-sm flex items-center gap-1"><CheckCircle className="h-4 w-4" />Email is available</p>}
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
                    onChange={(e) => setFormData({...formData, communityName: e.target.value})}
                    className={`bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 ${errors.communityName ? 'border-red-500' : ''}`}
                    placeholder="Enter community name"
                    required
                  />
                  {errors.communityName && <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.communityName}</p>}
                </div>
                <div>
                  <Label htmlFor="communityUsername" className="text-orange-400 font-medium">Community Username *</Label>
                  <div className="relative">
                    <Input
                      id="communityUsername"
                      value={formData.communityUsername}
                      onChange={(e) => setFormData({...formData, communityUsername: e.target.value})}
                      className={`bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 pr-10 ${errors.communityUsername ? 'border-red-500' : usernameAvailable === true ? 'border-green-500' : usernameAvailable === false ? 'border-red-500' : ''}`}
                      placeholder="@username"
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getUsernameValidationIcon()}
                    </div>
                  </div>
                  {errors.communityUsername && <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.communityUsername}</p>}
                  {usernameAvailable === false && <p className="text-red-400 text-sm flex items-center gap-1"><X className="h-4 w-4" />Username already taken</p>}
                  {usernameAvailable === true && <p className="text-green-400 text-sm flex items-center gap-1"><CheckCircle className="h-4 w-4" />Username is available</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="description" className="text-orange-400 font-medium">Community Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                  <Label htmlFor="ethWallet" className="text-orange-400 font-medium">ETH Wallet Address *</Label>
                  <Input
                    id="ethWallet"
                    value={formData.ethWallet}
                    onChange={(e) => setFormData({...formData, ethWallet: e.target.value})}
                    className={`bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 ${errors.ethWallet ? 'border-red-500' : ''}`}
                    placeholder="0x..."
                    required
                  />
                  {errors.ethWallet && <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.ethWallet}</p>}
                </div>
                <div>
                  <Label className="text-orange-400 font-medium">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
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
                  {errors.category && <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.category}</p>}
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
                  onChange={(e) => setFormData({...formData, whyChooseUs: e.target.value})}
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
                  <Label className="text-orange-400 font-medium">Community Rules</Label>
                  <Button
                    type="button"
                    onClick={addRule}
                    variant="outline"
                    size="sm"
                    className="border-orange-500/30 text-orange-400 hover:bg-orange-950/30"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Rule
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.communityRules.map((rule, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={rule}
                        onChange={(e) => updateRule(index, e.target.value)}
                        className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                        placeholder={`Rule ${index + 1}`}
                      />
                      {formData.communityRules.length > 1 && (
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
                  value={formData.socialHandlers.twitter}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialHandlers: {...formData.socialHandlers, twitter: e.target.value}
                  })}
                  className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                  placeholder="Twitter/X handle"
                />
                <Input
                  value={formData.socialHandlers.discord}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialHandlers: {...formData.socialHandlers, discord: e.target.value}
                  })}
                  className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                  placeholder="Discord server"
                />
                <Input
                  value={formData.socialHandlers.telegram}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialHandlers: {...formData.socialHandlers, telegram: e.target.value}
                  })}
                  className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                  placeholder="Telegram group"
                />
                <Input
                  value={formData.socialHandlers.website}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialHandlers: {...formData.socialHandlers, website: e.target.value}
                  })}
                  className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                  placeholder="Website URL"
                />
              </div>
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
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">
                      {formData.logo ? formData.logo.name : 'Upload Logo'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">PNG, JPG or GIF (max 2MB)</p>
                    <input 
                      id="logo-input"
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-orange-400 font-medium">Community Banner</Label>
                  <div 
                    className="border-2 border-dashed border-red-800/30 rounded-lg p-8 text-center hover:border-orange-500/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('banner-input')?.click()}
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">
                      {formData.banner ? formData.banner.name : 'Upload Banner'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">PNG, JPG or GIF (max 5MB)</p>
                    <input 
                      id="banner-input"
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'banner')}
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
    </div>
  )
}