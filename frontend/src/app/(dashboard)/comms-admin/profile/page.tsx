"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, MapPin, Globe, Calendar, Upload, CreditCard as Edit3, Save, X, Activity, Users, TrendingUp, MessageSquare, Award, Settings, Crown, Sparkles, ExternalLink } from "lucide-react";
import { communityAdminProfileApiService } from "@/services/communityAdmin/communityAdminProfileApiService";
import { toast } from "sonner";

interface CommunityAdminProfile {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  location?: string;
  website?: string;
  profilePic?: string;
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
  };
}

export default function CommunityAdminProfile() {
  const [profile, setProfile] = useState<CommunityAdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: "",
    website: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

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
      } else {
        toast.error(response.error || "Failed to load profile");
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
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
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await communityAdminProfileApiService.updateProfile(formData);

      if (response.success && response.data) {
        setProfile(response.data);
        setEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        toast.error(response.error || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const response = await communityAdminProfileApiService.uploadProfilePicture(file);

      if (response.success && response.data) {
        setProfile(response.data);
        toast.success('Profile picture updated successfully!');
      } else {
        toast.error(response.error || 'Failed to upload profile picture');
      }
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-gray-600/50 hover:bg-gray-800/50"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="bg-black/40 backdrop-blur-xl border-gray-700/50 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-600/30 to-purple-600/30 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 to-transparent" />
            </div>
            
            <CardContent className="p-6 relative -mt-16">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Profile Picture */}
                <div className="relative">
                  <Avatar className="w-24 h-24 ring-4 ring-gray-800 shadow-lg shadow-blue-500/20">
                    <AvatarImage src={profile.profilePic} alt={profile.name} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-2xl font-bold">
                      {profile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 p-0"
                    size="sm"
                  >
                    {uploading ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3 text-white" />
                    )}
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Name and Role */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                    <Crown className="w-5 h-5 text-yellow-400" />
                  </div>
                  <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-500/30">
                    Community Administrator
                  </Badge>
                </div>

                {/* Community Info */}
                {profile.communityName && (
                  <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg">
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
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                    rows={3}
                  />
                )}

                {/* Profile Details */}
                <div className="w-full space-y-3 pt-4">
                  {editing ? (
                    <>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <Input
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Full name"
                          className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <Input
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="Location"
                          className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <Input
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="Website URL"
                          className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{profile.email}</span>
                      </div>
                      {profile.location && (
                        <div className="flex items-center gap-2 text-gray-300">
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
                            className="text-sm text-blue-400 hover:text-blue-300 truncate"
                          >
                            {profile.website}
                          </a>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Joined {formatDate(profile.joinDate)}</span>
                      </div>
                      {profile.lastLogin && (
                        <div className="flex items-center gap-2 text-gray-300">
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

        {/* Stats and Community Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Community Stats */}
          <Card className="bg-black/40 backdrop-blur-xl border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Community Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Users className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{profile.stats.totalMembers}</p>
                      <p className="text-sm text-blue-300">Total Members</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Activity className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{profile.stats.activeMembers}</p>
                      <p className="text-sm text-green-300">Active Members</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-lg border border-purple-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{profile.stats.totalPosts}</p>
                      <p className="text-sm text-purple-300">Total Posts</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Award className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{profile.stats.totalQuests}</p>
                      <p className="text-sm text-yellow-300">Total Quests</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-pink-900/50 to-pink-800/30 rounded-lg border border-pink-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Sparkles className="h-6 w-6 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{profile.stats.premiumMembers}</p>
                      <p className="text-sm text-pink-300">Premium Members</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 rounded-lg border border-indigo-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{profile.stats.engagementRate.toFixed(1)}%</p>
                      <p className="text-sm text-indigo-300">Engagement Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card className="bg-black/40 backdrop-blur-xl border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-400" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Account Status</p>
                  <p className="text-sm text-gray-400">Your administrator account status</p>
                </div>
                <Badge className={profile.isActive 
                  ? "bg-green-500/20 text-green-300 border-green-500/30" 
                  : "bg-red-500/20 text-red-300 border-red-500/30"
                }>
                  {profile.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Community Role</p>
                  <p className="text-sm text-gray-400">Your role in the community</p>
                </div>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  Administrator
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Member Since</p>
                  <p className="text-sm text-gray-400">When you joined ChainVerse</p>
                </div>
                <span className="text-white font-medium">
                  {formatDate(profile.joinDate)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}