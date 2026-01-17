"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Edit, Upload, Check, X } from "lucide-react";
import { RootState } from "@/redux/store";
import { setProfile } from "@/redux/slices/userProfileSlice";
import { userApiService } from "@/services/userApiServices";

export default function EditProfileModal() {
  const dispatch = useDispatch();
  const { profile } = useSelector((state: RootState) => state.userProfile);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    username: profile?.username || "",
    phone: profile?.phone || "",
  });
  const [usernameCheck, setUsernameCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({
    checking: false,
    available: null,
    message: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Reset username check when username changes
    if (field === "username") {
      setUsernameCheck({
        checking: false,
        available: null,
        message: "",
      });
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim() || username === profile?.username) {
      setUsernameCheck({
        checking: false,
        available: null,
        message: "",
      });
      return;
    }

    setUsernameCheck(prev => ({ ...prev, checking: true }));

    try {
      const result = await userApiService.checkUsernameAvailability(username);
      setUsernameCheck({
        checking: false,
        available: result.available ?? null,
        message: result.available ? "Username is available" : "Username is already taken",
      });
    } catch (error) {
      setUsernameCheck({
        checking: false,
        available: false,
        message: "Error checking username",
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsUploadingImage(true);

    try {
      const result = await userApiService.uploadProfileImage(file);

      if (result.success && result.data) {
        dispatch(setProfile({ ...profile!, profilePic: result.data.profilePic }));
        toast.success("Profile image updated successfully");
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (usernameCheck.available === false) {
      toast.error("Please choose an available username");
      return;
    }

    setIsLoading(true);

    try {
      const result = await userApiService.updateProfile({
        name: formData.name.trim(),
        username: formData.username.trim(),
        phone: formData.phone.trim(),
      });

      if (result.success && result.data) {
        dispatch(setProfile({ ...profile!, ...formData }));
        toast.success("Profile updated successfully");
        setIsOpen(false);
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-slate-800/50 border-blue-800/30 text-blue-300 hover:bg-slate-700/50"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-blue-800/30">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24 ring-2 ring-blue-500/30">
              <AvatarImage
                src={profile?.profilePic || "/placeholder.svg"}
                alt={profile?.name || "Profile"}
              />
              <AvatarFallback className="text-2xl bg-slate-700 text-white">
                {profile?.name?.charAt(0)?.toUpperCase() ||
                  profile?.username?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex items-center space-x-2">
              <input
                type="file"
                id="profile-image"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Label
                htmlFor="profile-image"
                className="cursor-pointer"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingImage}
                  className="bg-slate-800/50 border-blue-800/30 text-blue-300 hover:bg-slate-700/50"
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploadingImage ? "Uploading..." : "Change Photo"}
                  </span>
                </Button>
              </Label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your full name"
                className="bg-slate-800 border-blue-800/30 text-white"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  onBlur={(e) => checkUsernameAvailability(e.target.value)}
                  placeholder="Enter username"
                  className="bg-slate-800 border-blue-800/30 text-white pr-10"
                />
                {usernameCheck.checking && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                  </div>
                )}
                {!usernameCheck.checking && usernameCheck.available === true && (
                  <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
                {!usernameCheck.checking && usernameCheck.available === false && (
                  <X className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                )}
              </div>
              {usernameCheck.message && (
                <p className={`text-xs ${usernameCheck.available ? 'text-green-400' : 'text-red-400'}`}>
                  {usernameCheck.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
                className="bg-slate-800 border-blue-800/30 text-white"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="bg-slate-800/50 border-blue-800/30 text-blue-300 hover:bg-slate-700/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || usernameCheck.available === false}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}