"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User, Mail, MapPin, Globe, Calendar, Upload, Edit3, Save, X, Activity,
  Users, TrendingUp, MessageSquare, Award, Crown, ExternalLink, Camera,
  Heart, MessageCircle, Loader2, Plus, List, Image as ImageIconLucide,
  Crop, RotateCcw, ZoomIn, ZoomOut, Move, Check
} from "lucide-react";
import { communityAdminProfileApiService } from "@/services/communityAdmin/communityAdminProfileApiService";
import { communityAdminPostApiService, type CommunityAdminPost } from "@/services/communityAdmin/communityAdminPostApiService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CreateCommunityAdminPost from "@/components/comms-admin/posts/CreateCommunityAdminPost";
import CommunityAdminPostCard from "@/components/comms-admin/posts/CommunityAdminPostCard";
import { ImageCropper } from "@/components/ui/img-cropper";
import Image from "next/image";

interface CommunityAdminProfile {
  _id: string;
  name: string;
  email: string;
  username: string;
  bio?: string;
  location?: string;
  website?: string;
  profilePic?: string;
  bannerImage?: string;
  communityId?: string;
  communityName?: string;
  communityLogo?: string;
  isActive: boolean;
  lastLogin?: Date;
  joinDate: Date;
  stats: {
    totalMembers: number;
    activeMembers: number;
    totalPosts: number;
    totalQuests: number;
    premiumMembers: number;
    engagementRate: number;
    myPostsCount: number;
    myLikesCount: number;
    myCommentsCount: number;
  };
}

export default function CommunityAdminProfile() {
  const [profile, setProfile] = useState<CommunityAdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Image cropping states
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [cropperImage, setCropperImage] = useState<string>('');
  const [cropperType, setCropperType] = useState<'profile' | 'banner'>('profile');

  // Posts state
  const [posts, setPosts] = useState<CommunityAdminPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const [postsCursor, setPostsCursor] = useState<string>();
  const [postsView, setPostsView] = useState<'all' | 'media' | 'likes'>('all');
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: "",
    website: ""
  });

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      loadPosts(true);
    }
  }, [profile, postsView]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await communityAdminProfileApiService.getProfile();

      if (response.success && response.data) {
        setProfile(response.data);
        setFormData({
          name: response.data.name || "",
          bio: response.data.bio || "",
          location: response.data.location || "",
          website: response.data.website || ""
        });
        setErrors({});
      } else {
        toast.error(response.error || "Failed to load profile");
      }
    } catch (error: unknown) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (reset = false) => {
    try {
      if (reset) {
        setPostsLoading(true);
        setPostsCursor(undefined);
      }

      const response = await communityAdminPostApiService.getAdminPosts(
        reset ? undefined : postsCursor,
        10,
        postsView
      );

      if (response.success && response.data) {
        if (reset) {
          setPosts(response.data.posts);
        } else {
          setPosts(prev => [...prev, ...response.data!.posts]);
        }
        setPostsHasMore(response.data.hasMore);
        setPostsCursor(response.data.nextCursor);
      } else {
        toast.error(response.error || "Failed to load posts");
      }
    } catch (error: unknown) {
      console.error("Error loading posts:", error);
      toast.error("Failed to load posts");
    } finally {
      if (reset) {
        setPostsLoading(false);
      }
    }
  };

  // Infinite scroll observer
  const lastPostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (postsLoading || !postsHasMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && postsHasMore) {
        loadPosts(false);
      }
    });

    if (lastPostRef.current) {
      observerRef.current.observe(lastPostRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [postsLoading, postsHasMore, posts.length]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Name must be less than 50 characters";
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = "Bio must be less than 500 characters";
    }

    if (formData.location && formData.location.length > 100) {
      newErrors.location = "Location must be less than 100 characters";
    }

    if (formData.website && formData.website.trim()) {
      const websiteRegex = /^https?:\/\/.+/;
      if (!websiteRegex.test(formData.website.trim())) {
        newErrors.website = "Website must be a valid URL starting with http:// or https://";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = () => {
    setEditing(true);
    setErrors({});
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        website: profile.website || ""
      });
    }
    setEditing(false);
    setErrors({});
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    try {
      setSaving(true);

      const response = await communityAdminProfileApiService.updateProfile(formData);

      if (response.success && response.data) {
        setProfile(response.data);
        setEditing(false);
        setErrors({});
        toast.success("Profile updated successfully!");
      } else {
        toast.error(response.error || "Failed to update profile");
      }
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Create object URL for cropper
    const imageUrl = URL.createObjectURL(file);
    setCropperImage(imageUrl);
    setCropperType(type);
    setShowImageCropper(true);

    // Clear the input
    event.target.value = '';
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    try {
      const file = new File([croppedImageBlob], `${cropperType}_image.jpg`, {
        type: 'image/jpeg',
      });

      if (cropperType === 'profile') {
        setUploading(true);
        const response = await communityAdminProfileApiService.uploadProfilePicture(file);

        if (response.success && response.data) {
          setProfile(response.data);
          toast.success('Profile picture updated successfully!');
        } else {
          toast.error(response.error || 'Failed to upload profile picture');
        }
      } else {
        setUploadingBanner(true);
        const response = await communityAdminProfileApiService.uploadBannerImage(file);

        if (response.success && response.data) {
          setProfile(response.data);
          toast.success('Banner image updated successfully!');
        } else {
          toast.error(response.error || 'Failed to upload banner image');
        }
      }
    } catch (error: unknown) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      setUploadingBanner(false);
      setShowImageCropper(false);

      // Clean up object URL
      if (cropperImage) {
        URL.revokeObjectURL(cropperImage);
        setCropperImage('');
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const onPostCreated = (newPost: CommunityAdminPost) => {
    setPosts(prev => [newPost, ...prev]);
    setProfile(prev => prev ? {
      ...prev,
      stats: {
        ...prev.stats,
        myPostsCount: prev.stats.myPostsCount + 1
      }
    } : prev);
    setShowCreatePost(false);
  };

  const onPostUpdated = (updatedPost: CommunityAdminPost) => {
    setPosts(prev => prev.map(post =>
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  const onPostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
    setProfile(prev => prev ? {
      ...prev,
      stats: {
        ...prev.stats,
        myPostsCount: Math.max(0, prev.stats.myPostsCount - 1)
      }
    } : prev);
  };

  const onPostLiked = (postId: string, isLiked: boolean, likesCount: number) => {
    setPosts(prev => prev.map(post =>
      post._id === postId
        ? { ...post, isLiked, likesCount }
        : post
    ));
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLastLogin = (date: Date | string) => {
    const now = new Date();
    const loginDate = new Date(date);
    const diffInHours = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return loginDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: loginDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-950 flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
          <div className="h-12 w-12 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin"></div>
          <p className="text-white text-lg font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <p className="text-white text-xl font-semibold">Failed to load profile</p>
          <Button onClick={fetchProfile} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Admin Profile
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Manage your community administrator profile
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!editing ? (
            <Button
              onClick={handleEdit}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-gray-600/50 hover:bg-gray-800/50 transition-all duration-300"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white transition-all duration-300 transform hover:scale-105 disabled:transform-none"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="bg-black/40 backdrop-blur-xl border-gray-700/50 overflow-hidden shadow-2xl shadow-blue-900/20">
            {/* Banner Image */}
            <div className="relative h-32 bg-gradient-to-r from-blue-600/30 to-purple-600/30 overflow-hidden group">
              {profile.bannerImage ? (
                <Image
                  src={profile.bannerImage}
                  alt="Banner"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-purple-900/70 to-pink-900/70" />
              )}

              {/* Banner upload button */}
              <Button
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="absolute top-2 right-2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 p-0 opacity-80 hover:opacity-100 transition-all duration-300 transform hover:scale-110"
                size="sm"
              >
                {uploadingBanner ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
              </Button>

              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'banner')}
                className="hidden"
              />
            </div>

            <CardContent className="p-6 relative -mt-16">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Profile Picture */}
                <div className="relative group">
                  <Avatar className="w-24 h-24 ring-4 ring-gray-800 shadow-xl shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105">
                    <AvatarImage src={profile.profilePic} alt={profile.name} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-2xl font-bold">
                      {profile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 backdrop-blur-sm border-2 border-gray-800 p-0 transition-all duration-300 transform hover:scale-110 disabled:scale-100"
                    size="sm"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-white" />
                    )}
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'profile')}
                    className="hidden"
                  />
                </div>

                {/* Name and Role */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                    <Crown className="w-5 h-5 text-yellow-400 animate-pulse" />
                  </div>
                  <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-500/30 px-3 py-1">
                    Community Administrator
                  </Badge>
                  <p className="text-gray-400 text-sm">@{profile.username}</p>
                </div>

                {/* Community Info */}
                {profile.communityName && (
                  <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 backdrop-blur-sm">
                    {profile.communityLogo && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={profile.communityLogo} alt={profile.communityName} />
                        <AvatarFallback>{profile.communityName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{profile.communityName}</p>
                      <p className="text-xs text-gray-400">Community</p>
                    </div>
                  </div>
                )}

                {/* Bio */}
                {!editing ? (
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {profile.bio || "No bio available"}
                  </p>
                ) : (
                  <div className="w-full">
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      className={cn(
                        "bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 transition-all duration-300 focus:border-blue-500/50",
                        errors.bio ? "border-red-500/50 focus:border-red-500" : ""
                      )}
                      rows={3}
                    />
                    {errors.bio && (
                      <p className="text-red-400 text-xs mt-1">{errors.bio}</p>
                    )}
                  </div>
                )}

                {/* Profile Details */}
                <div className="w-full space-y-3 pt-4">
                  {editing ? (
                    <>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <Input
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Full name"
                            className={cn(
                              "bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 transition-all duration-300 focus:border-blue-500/50",
                              errors.name ? "border-red-500/50 focus:border-red-500" : ""
                            )}
                          />
                        </div>
                        {errors.name && (
                          <p className="text-red-400 text-xs ml-6">{errors.name}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <Input
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            placeholder="Location"
                            className={cn(
                              "bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 transition-all duration-300 focus:border-blue-500/50",
                              errors.location ? "border-red-500/50 focus:border-red-500" : ""
                            )}
                          />
                        </div>
                        {errors.location && (
                          <p className="text-red-400 text-xs ml-6">{errors.location}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <Input
                            value={formData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            placeholder="Website URL (https://...)"
                            className={cn(
                              "bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 transition-all duration-300 focus:border-blue-500/50",
                              errors.website ? "border-red-500/50 focus:border-red-500" : ""
                            )}
                          />
                        </div>
                        {errors.website && (
                          <p className="text-red-400 text-xs ml-6">{errors.website}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{profile.email}</span>
                      </div>
                      {profile.location && (
                        <div className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{profile.location}</span>
                        </div>
                      )}
                      {profile.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <a
                            href={profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 truncate transition-colors duration-300"
                          >
                            {profile.website}
                          </a>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Joined {formatDate(profile.joinDate)}</span>
                      </div>
                      {profile.lastLogin && (
                        <div className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300">
                          <Activity className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">Last seen {formatLastLogin(profile.lastLogin)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Community Stats */}
          <Card className="bg-black/40 backdrop-blur-xl border-gray-700/50 shadow-2xl shadow-blue-900/10">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Community Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-lg border border-blue-500/30 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Users className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{profile.stats.totalMembers.toLocaleString()}</p>
                      <p className="text-sm text-blue-300">Total Members</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-lg border border-green-500/30 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Activity className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{profile.stats.activeMembers.toLocaleString()}</p>
                      <p className="text-sm text-green-300">Active Members</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-lg border border-purple-500/30 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{profile.stats.totalPosts.toLocaleString()}</p>
                      <p className="text-sm text-purple-300">Total Posts</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 rounded-lg border border-yellow-500/30 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Award className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{profile.stats.myPostsCount.toLocaleString()}</p>
                      <p className="text-sm text-yellow-300">My Posts</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-pink-900/50 to-pink-800/30 rounded-lg border border-pink-500/30 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Heart className="h-6 w-6 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{profile.stats.myLikesCount.toLocaleString()}</p>
                      <p className="text-sm text-pink-300">My Likes</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 rounded-lg border border-indigo-500/30 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <MessageCircle className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{profile.stats.myCommentsCount.toLocaleString()}</p>
                      <p className="text-sm text-indigo-300">My Comments</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts Section */}
          <Card className="bg-black/40 backdrop-blur-xl border-gray-700/50 shadow-2xl shadow-blue-900/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  My Posts
                </CardTitle>
                <Button
                  onClick={() => setShowCreatePost(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </div>

              {/* Posts Filter */}
              <div className="flex items-center gap-2 pt-4">
                <Button
                  onClick={() => setPostsView('all')}
                  variant={postsView === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "transition-all duration-300",
                    postsView === 'all'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white transform scale-105'
                      : 'border-blue-600/50 text-blue-400 hover:bg-blue-950/30'
                  )}
                >
                  <List className="w-4 h-4 mr-2" />
                  All Posts
                </Button>
                <Button
                  onClick={() => setPostsView('media')}
                  variant={postsView === 'media' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "transition-all duration-300",
                    postsView === 'media'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white transform scale-105'
                      : 'border-blue-600/50 text-blue-400 hover:bg-blue-950/30'
                  )}
                >
                  <ImageIconLucide className="w-4 h-4 mr-2" />
                  Media
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {postsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                    <p className="text-gray-400">Loading posts...</p>
                  </div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
                  <p className="text-gray-400 mb-4">Start sharing your thoughts with your community!</p>
                  <Button
                    onClick={() => setShowCreatePost(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Post
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post, index) => (
                    <div
                      key={post._id}
                      ref={index === posts.length - 1 ? lastPostRef : undefined}
                      className="transform transition-all duration-300 hover:scale-[1.01]"
                    >
                      <CommunityAdminPostCard
                        post={post}
                        onLikeToggle={onPostLiked}
                        onPostUpdate={onPostUpdated}
                        onPostDelete={onPostDeleted}
                      />
                    </div>
                  ))}

                  {postsHasMore && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
                        <p className="text-gray-400 text-sm">Loading more posts...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="sm:max-w-[600px] bg-black/90 backdrop-blur-xl border-gray-700/50">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Post</DialogTitle>
            <DialogDescription className="text-gray-400">
              Share your thoughts with your community members.
            </DialogDescription>
          </DialogHeader>
          <CreateCommunityAdminPost
            onPostCreated={onPostCreated}
            onCancel={() => setShowCreatePost(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Image Cropper Dialog */}
      <Dialog open={showImageCropper} onOpenChange={setShowImageCropper}>
        <DialogContent className="sm:max-w-[600px] bg-black/90 backdrop-blur-xl border-gray-700/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Crop className="h-5 w-5 text-blue-400" />
              Crop {cropperType === 'profile' ? 'Profile Picture' : 'Banner Image'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Adjust your image to fit perfectly. {cropperType === 'profile' ? 'Use a square crop for best results.' : 'Use a wide crop for best results.'}
            </DialogDescription>
          </DialogHeader>

          {cropperImage && (
            <ImageCropper
              imageSrc={cropperImage}
              onCropComplete={handleCropComplete}
              onCancel={() => {
                setShowImageCropper(false);
                URL.revokeObjectURL(cropperImage);
                setCropperImage('');
              }}
              aspectRatio={cropperType === 'profile' ? 1 : 16 / 9}
              cropType={cropperType}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}