"use client"
import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import EditProfileModal from "@/components/user/profile/edit-profile-modal"
import { useProfile } from "@/hooks/useProfile"
import { MapPin, Globe, Phone, Mail, Calendar, Twitter, Linkedin, Github, Key, Trophy, Users, Target, Flame } from "lucide-react"
import { format } from "date-fns"

export default function MyProfilePage() {
  const { profile, loading, error, fetchProfile } = useProfile()

  useEffect(() => {
    if (!profile && !loading) {
      fetchProfile()
    }
  }, [profile, loading, fetchProfile])

  if (loading) {
    return <ProfileSkeleton />
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <Mail className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Failed to load profile</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchProfile} variant="outline">
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Profile not found</h3>
          <p className="text-muted-foreground">Unable to load your profile information.</p>
        </Card>
      </div>
    )
  }

  const joinDate = format(new Date(profile.createdAt), "MMMM yyyy")
  const lastCheckIn = profile.dailyCheckin.lastCheckIn 
    ? format(new Date(profile.dailyCheckin.lastCheckIn), "MMM dd, yyyy")
    : "Never"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          My Profile
        </h1>
        <div className="flex space-x-3">
          <EditProfileModal />
          <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50 bg-transparent">
            <Key className="h-4 w-4 mr-2" />
            Change Password
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden shadow-lg">
        <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        <CardContent className="relative pt-0">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6 -mt-16">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-background shadow-xl ring-4 ring-white/50">
                <AvatarImage src={profile.profilePic} alt={profile.name} />
                <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {profile.dailyCheckin.streak > 0 && (
                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1 shadow-lg">
                  <Flame className="h-3 w-3" />
                  <span>{profile.dailyCheckin.streak}</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
                <p className="text-lg text-muted-foreground">@{profile.username}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  Verified Member
                </Badge>
                {profile.dailyCheckin.streak > 7 && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                    Streak Master
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10"></div>
          <CardContent className="p-6 text-center relative z-10">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-8 w-8 text-blue-600 mb-1" />
            </div>
            <div className="text-3xl font-bold text-blue-600">{profile.totalPoints.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/10"></div>
          <CardContent className="p-6 text-center relative z-10">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-8 w-8 text-green-600 mb-1" />
            </div>
            <div className="text-3xl font-bold text-green-600">{profile.followersCount}</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/10"></div>
          <CardContent className="p-6 text-center relative z-10">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-8 w-8 text-purple-600 mb-1" />
            </div>
            <div className="text-3xl font-bold text-purple-600">{profile.followingCount}</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/10"></div>
          <CardContent className="p-6 text-center relative z-10">
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-8 w-8 text-orange-600 mb-1" />
            </div>
            <div className="text-3xl font-bold text-orange-600">{profile.dailyCheckin.streak}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Mail className="h-5 w-5 text-blue-500" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{profile.email}</span>
            </div>
            
            {profile.phone && (
              <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{profile.phone}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Joined {joinDate}</span>
            </div>
          </CardContent>
        </Card>

        {/* Activity Information */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              <span>Activity Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center space-x-3">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Current Streak</span>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                {profile.dailyCheckin.streak} days
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Last Check-in</span>
              </div>
              <span className="text-sm text-muted-foreground">{lastCheckIn}</span>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center space-x-3">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Points Earned</span>
              </div>
              <span className="text-sm font-semibold text-blue-600">{profile.totalPoints.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32" />
        <div className="flex space-x-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      {/* Profile Card Skeleton */}
      <Card className="overflow-hidden">
        <Skeleton className="h-32 w-full" />
        <CardContent className="relative pt-0">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6 -mt-16">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-32" />
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-28" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6 text-center">
            <Skeleton className="h-8 w-8 mx-auto mb-2" />
            <Skeleton className="h-8 w-16 mx-auto mb-1" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </Card>
        ))}
      </div>

      {/* Details Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}