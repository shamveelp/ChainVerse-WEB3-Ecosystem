// frontend/src/components/user/profile/edit-profile-modal.tsx
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { Edit2, Check, X, Loader2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/utils/cropImage";

export default function EditProfileModal() {
  const { profile, loading, usernameCheck, updateUserProfile, checkUsername, uploadProfileImage } = useProfile();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    profileImage: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [usernameTimeout, setUsernameTimeout] = useState<NodeJS.Timeout | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        username: profile.username || "",
        phone: profile.phone || "",
        profileImage: profile.profileImage || "",
      });
      setImagePreview(profile.profileImage || "");
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "username") {
      if (usernameTimeout) {
        clearTimeout(usernameTimeout);
      }

      const timeout = setTimeout(() => {
        checkUsername(value);
      }, 500);

      setUsernameTimeout(timeout);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = useCallback(async () => {
    if (!imageFile || !croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(imagePreview, croppedAreaPixels);
      const croppedFile = new File([croppedImage], imageFile.name, { type: imageFile.type });
      setImageFile(croppedFile);
      setImagePreview(URL.createObjectURL(croppedFile));
      setShowCropper(false);
    } catch (error) {
      console.error("Crop error:", error);
    }
  }, [imagePreview, croppedAreaPixels, imageFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let profileImageUrl = formData.profileImage;

    if (imageFile) {
      setUploadingImage(true);
      try {
        const result = await uploadProfileImage(imageFile);
        profileImageUrl = result.imageUrl;
      } catch (error) {
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    const success = await updateUserProfile({
      ...formData,
      profilePic: profileImageUrl,
    });

    if (success) {
      setOpen(false);
      setImageFile(null);
      setShowCropper(false);
    }
  };

  const getUsernameStatus = () => {
    if (!formData.username || formData.username.length < 3) {
      return { status: "neutral", message: "Username must be at least 3 characters" };
    }

    if (profile && formData.username === profile.username) {
      return { status: "current", message: "Current username" };
    }

    if (usernameCheck.checking) {
      return { status: "checking", message: "Checking availability..." };
    }

    if (usernameCheck.lastChecked === formData.username) {
      return usernameCheck.available
        ? { status: "available", message: "Username is available" }
        : { status: "taken", message: "Username is already taken" };
    }

    return { status: "neutral", message: "" };
  };

  const usernameStatus = getUsernameStatus();
  const isFormValid =
    formData.name.trim() &&
    formData.username.trim() &&
    formData.username.length >= 3 &&
    (usernameStatus.status === "available" || usernameStatus.status === "current");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-2 ring-blue-500/30">
                <AvatarImage src={imagePreview || "/placeholder.svg"} alt="Profile" />
                <AvatarFallback className="text-xl bg-slate-700 text-white">
                  {formData.name?.charAt(0)?.toUpperCase() || formData.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full p-0 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            {showCropper && (
              <div className="relative h-64 bg-slate-900 rounded-lg overflow-hidden">
                <Cropper
                  image={imagePreview}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  showGrid={true}
                  style={{
                    containerStyle: { height: "100%", width: "100%" },
                    mediaStyle: { height: "100%", width: "100%" },
                  }}
                />
                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCropper(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCrop}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    Crop Image
                  </Button>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              {showCropper ? "Adjust and crop your profile picture" : "Click the camera icon to change your profile picture"}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your full name"
                required
                className="bg-slate-800/50 text-white border-blue-800/30 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="username">Username *</Label>
              <div className="relative">
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  placeholder="Enter username"
                  className={cn(
                    "bg-slate-800/50 text-white border-blue-800/30 focus:ring-blue-500",
                    usernameStatus.status === "taken" && "border-red-500",
                    usernameStatus.status === "available" && "border-green-500",
                  )}
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus.status === "checking" && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {usernameStatus.status === "available" && <Check className="h-4 w-4 text-green-500" />}
                  {usernameStatus.status === "taken" && <X className="h-4 w-4 text-red-500" />}
                </div>
              </div>
              {usernameStatus.message && (
                <p
                  className={cn(
                    "text-xs mt-1",
                    usernameStatus.status === "taken" && "text-red-500",
                    usernameStatus.status === "available" && "text-green-500",
                    usernameStatus.status === "checking" && "text-muted-foreground",
                  )}
                >
                  {usernameStatus.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
                type="tel"
                className="bg-slate-800/50 text-white border-blue-800/30 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || loading || uploadingImage}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
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
  );
}