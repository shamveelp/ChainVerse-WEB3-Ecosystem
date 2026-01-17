"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, UploadCloud, RefreshCw, Crop } from "lucide-react"
import { toast } from "sonner"
import { communityAdminApiService } from "@/services/communityAdminApiService"
import {
  type CommunityDetails,
  type CommunitySocialLinks,
  type CommunitySettings,
} from "@/types/comms-admin/community-admin.types"
import { ImageCropper } from "@/components/ui/image-cropper"

interface FormState {
  communityName: string
  username: string
  email: string
  walletAddress: string
  description: string
  category: string
  rules: string[]
  socialLinks: CommunitySocialLinks
  settings: CommunitySettings
  logo?: string
  banner?: string
}

const defaultSettings: CommunitySettings = {
  allowChainCast: false,
  allowGroupChat: true,
  allowPosts: true,
  allowQuests: false,
}

const defaultSocialLinks: CommunitySocialLinks = {
  twitter: "",
  discord: "",
  telegram: "",
  website: "",
}

export default function CommunitySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formState, setFormState] = useState<FormState>({
    communityName: "",
    username: "",
    email: "",
    walletAddress: "",
    description: "",
    category: "",
    rules: [""],
    socialLinks: defaultSocialLinks,
    settings: defaultSettings,
  })
  const [logoPreview, setLogoPreview] = useState<string | undefined>()
  const [bannerPreview, setBannerPreview] = useState<string | undefined>()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)

  // Image cropping states
  const [logoCropperOpen, setLogoCropperOpen] = useState(false)
  const [bannerCropperOpen, setBannerCropperOpen] = useState(false)
  const [tempLogoUrl, setTempLogoUrl] = useState<string>('')
  const [tempBannerUrl, setTempBannerUrl] = useState<string>('')

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true)
        const response = await communityAdminApiService.getCommunityDetails()

        if (!response.success || !(response.data as any)?.community) {
          throw new Error(response.error || "Failed to fetch community details")
        }

        const data: CommunityDetails = (response.data as any).community as CommunityDetails

        // Add cache-busting to prevent browser caching of images
        const cacheBuster = `?t=${Date.now()}`
        const logoUrl = data.logo ? `${data.logo}${cacheBuster}` : undefined
        const bannerUrl = data.banner ? `${data.banner}${cacheBuster}` : undefined

        setFormState({
          communityName: data.communityName || "",
          username: data.username || "",
          email: data.email || "",
          walletAddress: data.walletAddress || "",
          description: data.description || "",
          category: data.category || "",
          rules: data.rules?.length ? data.rules : [""],
          socialLinks: {
            ...defaultSocialLinks,
            ...data.socialLinks,
          },
          settings: {
            ...defaultSettings,
            ...data.settings,
          },
          logo: data.logo,
          banner: data.banner,
        })
        setLogoPreview(logoUrl)
        setBannerPreview(bannerUrl)
      } catch (error: any) {
        console.error("Failed to load community details:", error)
        toast.error("Unable to load community settings", {
          description: error.message || "Please try again later",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [])

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (tempLogoUrl) URL.revokeObjectURL(tempLogoUrl)
      if (tempBannerUrl) URL.revokeObjectURL(tempBannerUrl)
    }
  }, [tempLogoUrl, tempBannerUrl])

  // Clean up blob URLs when preview changes
  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview)
      }
    }
  }, [logoPreview])

  useEffect(() => {
    return () => {
      if (bannerPreview && bannerPreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreview)
      }
    }
  }, [bannerPreview])

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSocialLinkChange = (field: keyof CommunitySocialLinks, value: string) => {
    setFormState((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [field]: value,
      },
    }))
  }

  const handleSettingToggle = (field: keyof CommunitySettings, value: boolean) => {
    setFormState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }))
  }

  const handleRuleChange = (index: number, value: string) => {
    setFormState((prev) => {
      const rules = [...prev.rules]
      rules[index] = value
      return { ...prev, rules }
    })
  }

  const addRule = () => {
    setFormState((prev) => ({
      ...prev,
      rules: [...prev.rules, ""],
    }))
  }

  const removeRule = (index: number) => {
    setFormState((prev) => {
      const rules = prev.rules.filter((_, i) => i !== index)
      return {
        ...prev,
        rules: rules.length ? rules : [""],
      }
    })
  }

  const handleFileSelect = (file: File, type: 'logo' | 'banner') => {
    const maxSize = type === 'logo' ? 5 * 1024 * 1024 : 10 * 1024 * 1024

    if (file.size > maxSize) {
      toast.error(`File size too large. Max ${type === 'logo' ? '5MB' : '10MB'} allowed.`)
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload a valid image file")
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
    // Create preview URL for the cropped image
    const previewUrl = URL.createObjectURL(croppedImage)

    if (type === 'logo') {
      setLogoFile(croppedImage)
      setLogoPreview(previewUrl)
      setLogoCropperOpen(false)
      if (tempLogoUrl) URL.revokeObjectURL(tempLogoUrl)
      setTempLogoUrl('')
    } else {
      setBannerFile(croppedImage)
      setBannerPreview(previewUrl)
      setBannerCropperOpen(false)
      if (tempBannerUrl) URL.revokeObjectURL(tempBannerUrl)
      setTempBannerUrl('')
    }
  }

  const removeImage = (type: 'logo' | 'banner') => {
    if (type === 'logo') {
      setLogoFile(null)
      setLogoPreview(undefined)
      setFormState(prev => ({ ...prev, logo: undefined }))
    } else {
      setBannerFile(null)
      setBannerPreview(undefined)
      setFormState(prev => ({ ...prev, banner: undefined }))
    }
  }

  // Wrapper for input change events
  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file, type)
    }
    // Reset value so same file can be selected again
    event.target.value = ''
  }

  const validateForm = () => {
    if (!formState.communityName.trim()) {
      toast.error("Community name is required")
      return false
    }
    if (!formState.username.trim()) {
      toast.error("Username is required")
      return false
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(formState.walletAddress.trim())) {
      toast.error("Please provide a valid wallet address")
      return false
    }
    if (formState.description.trim().length < 50) {
      toast.error("Description should be at least 50 characters")
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      setSaving(true)
      const formData = new FormData()

      formData.append("communityName", formState.communityName.trim())
      formData.append("username", formState.username.trim())
      formData.append("walletAddress", formState.walletAddress.trim())
      formData.append("description", formState.description.trim())
      formData.append("category", formState.category.trim())
      formData.append(
        "rules",
        JSON.stringify(formState.rules.filter((rule) => rule.trim().length > 0))
      )
      formData.append("socialLinks", JSON.stringify(formState.socialLinks))
      formData.append("settings", JSON.stringify(formState.settings))

      // Handle Logo
      if (logoFile) {
        formData.append("logo", logoFile)
      } else if (!logoPreview) {
        // Explicitly remove logo if no file and no preview
        formData.append("logo", "")
      }

      // Handle Banner
      if (bannerFile) {
        formData.append("banner", bannerFile)
      } else if (!bannerPreview) {
        // Explicitly remove banner if no file and no preview
        formData.append("banner", "")
      }

      const response = await communityAdminApiService.updateCommunity(formData)

      if (!response.success || !(response.data as any)?.community) {
        throw new Error(response.error || "Failed to update community settings")
      }

      const updatedCommunity: CommunityDetails = (response.data as any).community as CommunityDetails

      // Clean up any existing blob URLs before setting new ones
      if (logoPreview && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview)
      }
      if (bannerPreview && bannerPreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreview)
      }

      // Add cache-busting timestamp to prevent browser caching
      const cacheBuster = `?t=${Date.now()}`
      const logoUrl = updatedCommunity.logo ? `${updatedCommunity.logo}${cacheBuster}` : undefined
      const bannerUrl = updatedCommunity.banner ? `${updatedCommunity.banner}${cacheBuster}` : undefined

      setFormState((prev) => ({
        ...prev,
        communityName: updatedCommunity.communityName,
        username: updatedCommunity.username,
        walletAddress: updatedCommunity.walletAddress,
        description: updatedCommunity.description,
        category: updatedCommunity.category,
        rules: updatedCommunity.rules?.length ? updatedCommunity.rules : [""],
        socialLinks: {
          ...defaultSocialLinks,
          ...updatedCommunity.socialLinks,
        },
        settings: {
          ...defaultSettings,
          ...updatedCommunity.settings,
        },
        logo: updatedCommunity.logo,
        banner: updatedCommunity.banner,
      }))

      setLogoPreview(logoUrl)
      setBannerPreview(bannerUrl)
      setLogoFile(null)
      setBannerFile(null)

      toast.success("Community settings updated successfully")
    } catch (error: any) {
      console.error("Failed to update community:", error)
      toast.error("Update failed", {
        description: error.message || "Please try again later",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto" />
          <p className="text-gray-300">Loading community settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Community Settings</h1>
          <p className="text-gray-400 mt-1">Manage how your community looks and behaves.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none border-gray-600 text-gray-200 hover:bg-gray-800"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-black/40 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Community Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Community Name</Label>
                <Input
                  value={formState.communityName}
                  onChange={(e) => handleInputChange("communityName", e.target.value)}
                  placeholder="Enter community name"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Username</Label>
                <Input
                  value={formState.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  placeholder="@username"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Contact Email</Label>
                <Input value={formState.email} disabled className="bg-gray-900 border-gray-700 text-gray-400" />
              </div>
              <div>
                <Label className="text-gray-300">Wallet Address</Label>
                <Input
                  value={formState.walletAddress}
                  onChange={(e) => handleInputChange("walletAddress", e.target.value)}
                  placeholder="0x..."
                  className="bg-gray-900 border-gray-700 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Category</Label>
              <Input
                value={formState.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                placeholder="e.g. Gaming, DeFi, NFT"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={formState.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={5}
                placeholder="Describe your community..."
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">Logo</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-20 w-20 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Community logo" className="h-full w-full object-cover" />
                  ) : (
                    <Badge className="bg-blue-500/20 text-blue-300">No Logo</Badge>
                  )}
                </div>
                {logoPreview ? (
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-200 flex-1"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      Change
                      <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, 'logo')} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10 flex-1"
                      onClick={() => removeImage('logo')}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="border-gray-600 text-gray-200 w-full" onClick={() => document.getElementById('logo-upload')?.click()}>
                    <Crop className="h-4 w-4 mr-2" />
                    Upload & Crop
                    <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, 'logo')} />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Banner</Label>
              <div className="mt-2 space-y-3">
                <div className="h-28 rounded-lg bg-gray-900 border border-gray-700 overflow-hidden relative">
                  {bannerPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bannerPreview} alt="Community banner" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Badge className="bg-purple-500/20 text-purple-300">No Banner</Badge>
                    </div>
                  )}
                </div>
                {bannerPreview ? (
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-200 flex-1"
                      onClick={() => document.getElementById('banner-upload')?.click()}
                    >
                      Change
                      <input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, 'banner')} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10 flex-1"
                      onClick={() => removeImage('banner')}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="border-gray-600 text-gray-200 w-full" onClick={() => document.getElementById('banner-upload')?.click()}>
                    <Crop className="h-4 w-4 mr-2" />
                    Upload & Crop
                    <input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, 'banner')} />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black/40 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Community Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formState.rules.map((rule, index) => (
              <div key={`rule-${index}`} className="flex items-center gap-3">
                <Input
                  value={rule}
                  onChange={(e) => handleRuleChange(index, e.target.value)}
                  placeholder={`Rule ${index + 1}`}
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <Button
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  onClick={() => removeRule(index)}
                  disabled={formState.rules.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button onClick={addRule} variant="outline" className="border-gray-600 text-gray-200">
              Add Rule
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["twitter", "discord", "telegram", "website"] as (keyof CommunitySocialLinks)[]).map((platform) => (
              <div key={String(platform)}>
                <Label className="text-gray-300 capitalize">{String(platform)}</Label>
                <Input
                  value={formState.socialLinks[platform] || ""}
                  onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                  placeholder={`Enter ${String(platform)} link`}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Community Features</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              { label: "ChainCast Events", field: "allowChainCast", description: "Enable live audio/video events" },
              { label: "Group Chat", field: "allowGroupChat", description: "Allow members to chat together" },
              { label: "Community Posts", field: "allowPosts", description: "Allow members to publish posts" },
              { label: "Quests & Tasks", field: "allowQuests", description: "Run quests for your members" },
            ] as { label: string; field: keyof CommunitySettings; description: string }[]
          ).map((setting) => (
            <div
              key={setting.field}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-800 bg-gray-900/40"
            >
              <div>
                <p className="text-white font-medium">{setting.label}</p>
                <p className="text-gray-400 text-sm">{setting.description}</p>
              </div>
              <Switch
                checked={formState.settings[setting.field]}
                onCheckedChange={(checked) => handleSettingToggle(setting.field, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

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
