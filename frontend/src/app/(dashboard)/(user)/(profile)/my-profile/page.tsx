"use client"
import { useEffect } from "react"
import { Label } from "@/components/ui/label"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import EditProfileModal from "@/components/user/profile/edit-profile-modal"
import { useProfile } from "@/hooks/useProfile"
import { Phone, Mail, Calendar, Trophy, Users, Target, Flame } from "lucide-react"
import { format } from "date-fns"

export default function MyProfilePage() {
  const { profile, loading, error, fetchProfile } = useProfile()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

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
          <div className="text-muted-foreground mb-4">
            <Users className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No profile found</h3>
          <p className="text-muted-foreground mb-4">Please create your profile to get started.</p>
          <EditProfileModal />
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.profilePic || "/placeholder.svg"} alt={profile.name} />
              <AvatarFallback className="text-2xl">{profile.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                <Badge variant="secondary">@{profile.username}</Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {profile.phone}
                  </div>
                )}
                {profile.createdAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {format(new Date(profile.createdAt), "MMM yyyy")}
                  </div>
                )}
              </div>
            </div>

            <EditProfileModal />
          </div>
        </CardContent>
      </Card>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold">{profile.stats?.achievements || 0}</div>
            <div className="text-sm text-muted-foreground">Achievements</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{profile.stats?.completedGoals || 0}</div>
            <div className="text-sm text-muted-foreground">Goals Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">{profile.stats?.currentStreak || 0}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
              <p className="text-sm">{profile.name || "Not provided"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Username</Label>
              <p className="text-sm">@{profile.username}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-sm">{profile.email || "Not provided"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
              <p className="text-sm">{profile.phone || "Not provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <Skeleton className="h-8 w-8 mx-auto mb-2" />
              <Skeleton className="h-8 w-16 mx-auto mb-1" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
