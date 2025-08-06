"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Mail, Phone, Calendar, Shield, Zap, Activity, Ban, UserCheck, Loader2 } from 'lucide-react'
import { getUserById, toggleUserBan, toggleUserBlock } from "@/services/adminApiService"
import { useToast } from "@/hooks/use-toast"

interface IUser {
  _id: string
  username?: string
  name: string
  email: string
  phone?: string
  googleId?: string | null
  refferalCode?: string
  refferedBy?: string | null
  profilePic?: string
  role?: 'user'
  totalPoints?: number
  isBlocked?: boolean
  isBanned?: boolean
  isEmailVerified?: boolean
  isGoogleUser?: boolean
  dailyCheckin?: {
    lastCheckIn: Date
    streak: number
  }
  followersCount?: number
  followingCount?: number
  createdAt: Date
  updatedAt: Date
}

export default function UserDetails() {
  const [user, setUser] = useState<IUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const userId = params.id as string

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserById(userId)
        setUser(userData)
        setError(null)
      } catch (err: any) {
        console.error("Error fetching user:", err)
        setError(err.response?.data?.message || "Failed to fetch user details")
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUser()
    }
  }, [userId])

  const handleToggleBan = async () => {
    if (!user) return
    
    setActionLoading(true)
    try {
      const updatedUser = await toggleUserBan(user._id, !user.isBanned)
      setUser(updatedUser)
      toast({
        title: !user.isBanned ? "User Banned" : "User Unbanned",
        description: `${user.name} has been ${!user.isBanned ? 'banned' : 'unbanned'} successfully`,
        className: !user.isBanned ? "bg-red-900/90 border-red-500/50 text-red-100" : "bg-green-900/90 border-green-500/50 text-green-100"
      })
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.response?.data?.message || "Failed to update user status",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleBlock = async () => {
    if (!user) return
    
    setActionLoading(true)
    try {
      const updatedUser = await toggleUserBlock(user._id, !user.isBlocked)
      setUser(updatedUser)
      toast({
        title: user.isBlocked ? "User Unblocked" : "User Blocked",
        description: `${user.name} has been ${user.isBlocked ? 'unblocked' : 'blocked'} successfully`,
        className: user.isBlocked ? "bg-green-900/90 border-green-500/50 text-green-100" : "bg-yellow-900/90 border-yellow-500/50 text-yellow-100"
      })
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.response?.data?.message || "Failed to update user status",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
          <span className="text-slate-400">Loading user details...</span>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="text-center py-12 space-y-4">
        <Shield className="h-12 w-12 text-red-400 mx-auto" />
        <p className="text-red-400">{error || "User not found"}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-cyan-400/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent">
            User Details
          </h1>
          <p className="text-slate-400">Manage user account and permissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <Card className="lg:col-span-2 bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-600 flex items-center justify-center text-slate-900 font-bold text-lg">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl">{user.name || 'Unknown User'}</h2>
                <p className="text-slate-400 text-sm">@{user.username || 'no-username'}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Email</span>
                </div>
                <p className="text-white">{user.email}</p>
                {user.isEmailVerified && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              
              {user.phone && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">Phone</span>
                  </div>
                  <p className="text-white">{user.phone}</p>
                </div>
              )}
            </div>

            {/* Account Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Joined</span>
                </div>
                <p className="text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Role</span>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {user.role}
                </Badge>
              </div>
            </div>

            {/* Referral Information */}
            {user.refferalCode && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">Referral Code</span>
                </div>
                <p className="text-white font-mono">{user.refferalCode}</p>
                {user.refferedBy && (
                  <p className="text-slate-400 text-sm">Referred by: {user.refferedBy}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats and Actions */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                User Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-slate-400">Total Points</span>
                </div>
                <span className="text-white font-semibold">{user.totalPoints || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span className="text-slate-400">Daily Streak</span>
                </div>
                <span className="text-white font-semibold">{user.dailyCheckin?.streak || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Followers</span>
                <span className="text-white font-semibold">{user.followersCount || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Following</span>
                <span className="text-white font-semibold">{user.followingCount || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                {user.isBanned ? (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 w-fit">
                    Banned
                  </Badge>
                ) : user.isBlocked ? (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 w-fit">
                    Blocked
                  </Badge>
                ) : (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 w-fit">
                    Active
                  </Badge>
                )}
                
                {user.isGoogleUser && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 w-fit">
                    Google User
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleToggleBan}
                disabled={actionLoading}
                className={`w-full ${
                  user.isBanned
                    ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                }`}
                variant="outline"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : user.isBanned ? (
                  <UserCheck className="h-4 w-4 mr-2" />
                ) : (
                  <Ban className="h-4 w-4 mr-2" />
                )}
                {user.isBanned ? 'Unban User' : 'Ban User'}
              </Button>
              
              {/* <Button
                onClick={handleToggleBlock}
                disabled={actionLoading}
                className={`w-full ${
                  user.isBlocked
                    ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30'
                }`}
                variant="outline"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                {user.isBlocked ? 'Unblock User' : 'Block User'}
              </Button> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
