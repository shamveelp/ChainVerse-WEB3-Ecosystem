"use client"

import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Calendar, Shield, CreditCard as Edit2, Save, X, Upload, Link, Twitter, Globe, Users, Trophy, Crown, Activity } from 'lucide-react'
import type { RootState } from '@/redux/store'

export default function ProfilePage() {
  const { communityAdmin } = useSelector((state: RootState) => state.communityAdminAuth)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: communityAdmin?.name || '',
    email: communityAdmin?.email || '',
    bio: 'Passionate about building Web3 communities and fostering blockchain education.',
    website: 'https://mycommunity.com',
    twitter: '@mycommunity',
    location: 'Global',
  })

  const handleSave = () => {
    // Handle profile update API call
    setIsEditing(false)
  }

  const handleCancel = () => {
    setProfileData({
      name: communityAdmin?.name || '',
      email: communityAdmin?.email || '',
      bio: 'Passionate about building Web3 communities and fostering blockchain education.',
      website: 'https://mycommunity.com',
      twitter: '@mycommunity',
      location: 'Global',
    })
    setIsEditing(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const mockStats = {
    membersManaged: 1247,
    questsCreated: 28,
    postsPublished: 156,
    communityRating: 4.8
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-gray-400 mt-2">Manage your community admin profile</p>
        </div>
        {!isEditing ? (
          <Button 
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button 
              onClick={handleCancel}
              variant="outline"
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-gradient-to-r from-red-600 to-red-800 text-white text-2xl font-bold">
                    {profileData.name ? getInitials(profileData.name) : 'CA'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button 
                    size="sm"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Name and Role */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white">{profileData.name}</h3>
                <div className="flex items-center justify-center gap-2">
                  <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                    <Shield className="h-3 w-3 mr-1" />
                    Community Admin
                  </Badge>
                </div>
                <p className="text-sm text-gray-400">{profileData.location}</p>
              </div>

              {/* Quick Stats */}
              <div className="w-full space-y-3 mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Members
                  </span>
                  <span className="font-semibold text-white">{mockStats.membersManaged.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Quests
                  </span>
                  <span className="font-semibold text-white">{mockStats.questsCreated}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Posts
                  </span>
                  <span className="font-semibold text-white">{mockStats.postsPublished}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Rating
                  </span>
                  <span className="font-semibold text-yellow-400">{mockStats.communityRating}/5.0</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2 bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-red-400" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-red-400 font-medium">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  disabled={!isEditing}
                  className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20 disabled:opacity-50"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-red-400 font-medium">Email Address</Label>
                <Input
                  id="email"
                  value={profileData.email}
                  disabled={true} // Email should not be editable
                  className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20 disabled:opacity-50"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website" className="text-red-400 font-medium">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-400/60" />
                  <Input
                    id="website"
                    value={profileData.website}
                    onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                    disabled={!isEditing}
                    className="pl-10 bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20 disabled:opacity-50"
                    placeholder="https://your-community.com"
                  />
                </div>
              </div>

              {/* Twitter */}
              <div className="space-y-2">
                <Label htmlFor="twitter" className="text-red-400 font-medium">Twitter/X Handle</Label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-400/60" />
                  <Input
                    id="twitter"
                    value={profileData.twitter}
                    onChange={(e) => setProfileData({...profileData, twitter: e.target.value})}
                    disabled={!isEditing}
                    className="pl-10 bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20 disabled:opacity-50"
                    placeholder="@username"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-red-400 font-medium">Biography</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                disabled={!isEditing}
                className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20 disabled:opacity-50 min-h-[100px] resize-none"
                placeholder="Tell your community about yourself..."
              />
              <div className="text-right">
                <span className="text-xs text-gray-400">{profileData.bio.length}/500</span>
              </div>
            </div>

            <Separator className="bg-red-800/30" />

            {/* Account Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-red-400" />
                  <span className="text-gray-400">Email Verified</span>
                  <Badge variant="outline" className="border-green-500/30 text-green-400">
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-red-400" />
                  <span className="text-gray-400">Member Since</span>
                  <span className="text-white">December 2024</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-400" />
                  <span className="text-gray-400">Admin Status</span>
                  <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-400" />
                  <span className="text-gray-400">Last Login</span>
                  <span className="text-white">Just now</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}