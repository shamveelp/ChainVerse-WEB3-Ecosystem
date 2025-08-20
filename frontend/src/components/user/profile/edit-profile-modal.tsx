"use client"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useProfile } from "@/hooks/useProfile"
import { Edit2, Upload, Check, X, Loader2, AlertCircle, Camera } from "lucide-react"
import { cn } from "@/lib/utils"

export default function EditProfileModal() {
  const { profile, loading, usernameCheck, updateUserProfile, checkUsername, uploadProfileImage } = useProfile()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    profilePic: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [usernameTimeout, setUsernameTimeout] = useState<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        username: profile.username || "",
        phone: profile.phone || "",
        profilePic: profile.profilePic || "",
      })
      setImagePreview(profile.profilePic || "")
    }
  }, [profile])

  const handleUsernameChange = (value: string) => {
    setFormData(prev => ({ ...prev, username: value }))
    
    // Clear existing timeout
    if (usernameTimeout) {
      clearTimeout(usernameTimeout)
    }
    
    // Set new timeout for username check
    const timeout = setTimeout(() => {
      checkUsername(value)
    }, 500)
    
    setUsernameTimeout(timeout)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file")
      return
    }

    setImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let updatedData = { ...formData }
    
    try {
      // Upload image if changed
      if (imageFile) {
        setUploadingImage(true)
        const imageUrl = await uploadProfileImage(imageFile)
        updatedData.profilePic = imageUrl
      }
      
      const success = await updateUserProfile(updatedData)
      if (success) {
        setOpen(false)
        setImageFile(null)
      }
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setUploadingImage(false)
    }
  }

  const getUsernameValidationIcon = () => {
    if (usernameCheck.checking) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }
    
    if (usernameCheck.available === true) {
      return <Check className="h-4 w-4 text-green-500" />
    }
    
    if (usernameCheck.available === false) {
      return <X className="h-4 w-4 text-red-500" />
    }
    
    return null
  }

  const getUsernameValidationMessage = () => {
    if (usernameCheck.checking) {
      return "Checking availability..."
    }
    
    if (usernameCheck.available === true) {
      return "Username is available"
    }
    
    if (usernameCheck.available === false) {
      return "Username is not available"
    }
    
    return ""
  }

  const isFormValid = () => {
    return (
      formData.name.trim().length >= 2 &&
      formData.username.trim().length >= 3 &&
      (usernameCheck.available === true || formData.username === profile?.username)
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0">
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Edit Profile
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-gradient-to-r from-blue-500 to-purple-500">
                <AvatarImage src={imagePreview || profile?.profilePic} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl">
                  {profile?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-blue-500 hover:bg-blue-600"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground text-center">
              Click the camera icon to change your profile picture
            </p>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
              required
              minLength={2}
              className="focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Username
            </Label>
            <div className="relative">
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="Enter your username"
                required
                minLength={3}
                pattern="^[a-zA-Z0-9_]+$"
                title="Username can only contain letters, numbers, and underscores"
                className={cn(
                  "pr-10 focus:ring-2",
                  usernameCheck.available === true ? "focus:ring-green-500 border-green-500" :
                  usernameCheck.available === false ? "focus:ring-red-500 border-red-500" :
                  "focus:ring-blue-500"
                )}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getUsernameValidationIcon()}
              </div>
            </div>
            {getUsernameValidationMessage() && (
              <p className={cn(
                "text-xs",
                usernameCheck.available === true ? "text-green-600" :
                usernameCheck.available === false ? "text-red-600" :
                "text-blue-600"
              )}>
                {getUsernameValidationMessage()}
              </p>
            )}
          </div>

          {/* Email Field (Read Only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              value={profile?.email || ""}
              readOnly
              className="bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter your phone number"
              className="focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading || uploadingImage}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid() || loading || uploadingImage}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {loading || uploadingImage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadingImage ? "Uploading..." : "Saving..."}
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}