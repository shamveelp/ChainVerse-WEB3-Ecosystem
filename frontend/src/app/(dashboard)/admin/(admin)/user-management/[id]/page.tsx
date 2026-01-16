"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, User, Mail, Phone, Calendar, Shield, Zap, Activity, Ban, UserCheck, Loader2, Users, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { getUserById, toggleUserBan } from "@/services/adminApiService"
import { getUserReferrals, getUserPointsHistory, getUserCheckInHistory, getUserStats } from "@/services/userDetailsApiService"
import { useToast } from "@/hooks/use-toast"

import { useCallback } from 'react';
import { AxiosError } from 'axios';

interface IUser {
  _id: string
  username?: string
  name: string
  email: string
  phone?: string
  googleId?: string | null
  refferalCode?: string
  refferedBy?: {
    _id: string
    username?: string
    name: string
    email: string
  } | null
  profilePic?: string
  role?: 'user'
  totalPoints?: number
  isBlocked?: boolean
  isBanned?: boolean
  isActive?: boolean
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

interface ReferralData {
  _id: string
  referred: {
    _id: string
    username?: string
    name: string
    email: string
    createdAt: string
  }
  pointsAwarded: number
  createdAt: string
}

interface PointsHistoryData {
  _id: string
  type: string
  points: number
  description: string
  createdAt: string
}

interface CheckInHistoryData {
  _id: string
  checkInDate: Date
  pointsAwarded: number
  streakCount: number
  createdAt: Date
}

interface UserStatsData {
  totalPoints?: number;
  referralCount?: number;
  questCount?: number;
  // Add other stats as needed
}

export default function UserDetails() {
  const [user, setUser] = useState<IUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Referrals state
  const [referrals, setReferrals] = useState<ReferralData[]>([])
  const [referralsLoading, setReferralsLoading] = useState(false)
  const [referralsPage, setReferralsPage] = useState(1)
  const [referralsTotal, setReferralsTotal] = useState(0)
  const [referralsTotalPages, setReferralsTotalPages] = useState(1)

  // Points history state
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryData[]>([])
  const [pointsLoading, setPointsLoading] = useState(false)
  const [pointsPage, setPointsPage] = useState(1)
  const [pointsTotal, setPointsTotal] = useState(0)
  const [pointsTotalPages, setPointsTotalPages] = useState(1)

  // Check-in history state
  const [checkInHistory, setCheckInHistory] = useState<CheckInHistoryData[]>([])
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkInPage, setCheckInPage] = useState(1)
  const [checkInTotal, setCheckInTotal] = useState(0)
  const [checkInTotalPages, setCheckInTotalPages] = useState(1)

  // User stats
  const [userStats, setUserStats] = useState<UserStatsData>({})

  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const userId = params.id as string

  const fetchUserDetails = useCallback(async () => {
    setLoading(true)
    try {
      const userData = await getUserById(userId)
      setUser(userData)

      const statsData = await getUserStats(userId)
      if (statsData.success) {
        setUserStats(statsData.data)
      }

      setError(null)
    } catch (err) {
      console.error("Error fetching user:", err)
      const axiosError = err as AxiosError<{ message: string }>;
      const errMessage = axiosError.response?.data?.message || "Failed to fetch user details"
      setError(errMessage)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const fetchReferrals = useCallback(async () => {
    setReferralsLoading(true)
    try {
      const result = await getUserReferrals(userId, referralsPage, 10)
      if (result.success) {
        setReferrals(result.data)
        setReferralsTotal(result.total)
        setReferralsTotalPages(result.totalPages)
      } else {
        throw new Error(result.error || "Failed to fetch referrals")
      }
    } catch (error) {
      console.error("Error fetching referrals:", error)
      toast({
        title: "Error",
        description: "Failed to fetch referrals",
        variant: "destructive"
      })
    } finally {
      setReferralsLoading(false)
    }
  }, [userId, referralsPage, toast])

  const fetchPointsHistory = useCallback(async () => {
    setPointsLoading(true)
    try {
      const result = await getUserPointsHistory(userId, pointsPage, 10)
      if (result.success) {
        setPointsHistory(result.data)
        setPointsTotal(result.total)
        setPointsTotalPages(result.totalPages)
      } else {
        throw new Error(result.error || "Failed to fetch points history")
      }
    } catch (error) {
      console.error("Error fetching points history:", error)
      toast({
        title: "Error",
        description: "Failed to fetch points history",
        variant: "destructive"
      })
    } finally {
      setPointsLoading(false)
    }
  }, [userId, pointsPage, toast])

  const fetchCheckInHistory = useCallback(async () => {
    setCheckInLoading(true)
    try {
      const result = await getUserCheckInHistory(userId, checkInPage, 10)
      if (result.success) {
        setCheckInHistory(result.data)
        setCheckInTotal(result.total)
        setCheckInTotalPages(result.totalPages)
      } else {
        throw new Error(result.error || "Failed to fetch check-in history")
      }
    } catch (error) {
      console.error("Error fetching check-in history:", error)
      toast({
        title: "Error",
        description: "Failed to fetch check-in history",
        variant: "destructive"
      })
    } finally {
      setCheckInLoading(false)
    }
  }, [userId, checkInPage, toast])

  useEffect(() => {
    if (userId) {
      fetchUserDetails()
      fetchReferrals()
      fetchPointsHistory()
      fetchCheckInHistory()
    }
  }, [userId, fetchUserDetails, fetchReferrals, fetchPointsHistory, fetchCheckInHistory])

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
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const errMessage = axiosError.response?.data?.message || "Failed to update user status"
      toast({
        title: "Action Failed",
        description: errMessage,
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getPointsTypeColor = (type: string) => {
    switch (type) {
      case 'daily_checkin': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'referral_bonus': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'quest_reward': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'bonus': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'deduction': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
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
            User Profile: {user.name}
          </h1>
          <p className="text-slate-400">Comprehensive user account management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* User Profile Summary */}
        <Card className="lg:col-span-3 bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
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
          <CardContent className="p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
                <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Overview</TabsTrigger>
                <TabsTrigger value="referrals" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Referrals</TabsTrigger>
                <TabsTrigger value="points" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Points History</TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-slate-300">{user.email}</p>
                          {user.isEmailVerified && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs mt-1">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <p className="text-slate-300">{user.phone}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-slate-300">{new Date(user.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-slate-500">{new Date(user.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Account Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg">
                        <User className="h-4 w-4 text-slate-400" />
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300">Status:</span>
                          {user.isBanned ? (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Banned</Badge>
                          ) : user.isBlocked ? (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Blocked</Badge>
                          ) : (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                          )}
                        </div>
                      </div>

                      {user.isGoogleUser && (
                        <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg">
                          <Shield className="h-4 w-4 text-blue-400" />
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            Google Account
                          </Badge>
                        </div>
                      )}

                      {user.refferalCode && (
                        <div className="p-3 bg-slate-800/30 rounded-lg">
                          <p className="text-slate-400 text-sm mb-1">Referral Code</p>
                          <p className="text-slate-300 font-mono text-lg">{user.refferalCode}</p>
                        </div>
                      )}

                      {user.refferedBy && (
                        <div className="p-3 bg-slate-800/30 rounded-lg">
                          <p className="text-slate-400 text-sm mb-1">Referred By</p>
                          <p className="text-slate-300">{user.refferedBy.name}</p>
                          <p className="text-slate-400 text-sm">@{user.refferedBy.username || 'no-username'}</p>
                          <p className="text-slate-500 text-xs">{user.refferedBy.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="referrals" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Referred Users</h3>
                  <Button
                    onClick={fetchReferrals}
                    variant="outline"
                    size="sm"
                    className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {referralsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                  </div>
                ) : referrals.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p>No referrals found</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {referrals.map((referral) => (
                        <div key={referral._id} className="p-4 bg-slate-800/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{referral.referred.name}</p>
                              <p className="text-slate-400 text-sm">@{referral.referred.username || 'no-username'}</p>
                              <p className="text-slate-500 text-xs">{referral.referred.email}</p>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                +{referral.pointsAwarded} points
                              </Badge>
                              <p className="text-slate-400 text-xs mt-1">
                                {new Date(referral.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {referralsTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-4">
                        <div className="text-sm text-slate-400">
                          Page {referralsPage} of {referralsTotalPages}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setReferralsPage(referralsPage - 1)}
                            disabled={referralsPage === 1}
                            size="sm"
                            className="bg-slate-800/50 border-slate-600/50"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setReferralsPage(referralsPage + 1)}
                            disabled={referralsPage === referralsTotalPages}
                            size="sm"
                            className="bg-slate-800/50 border-slate-600/50"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="points" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Points History</h3>
                  <Button
                    onClick={fetchPointsHistory}
                    variant="outline"
                    size="sm"
                    className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {pointsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                  </div>
                ) : pointsHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Zap className="h-8 w-8 mx-auto mb-2" />
                    <p>No points history found</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {pointsHistory.map((entry) => (
                        <div key={entry._id} className="p-4 bg-slate-800/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getPointsTypeColor(entry.type)}>
                                  {entry.type.replace('_', ' ')}
                                </Badge>
                                <span className={`font-bold ${entry.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {entry.points > 0 ? '+' : ''}{entry.points}
                                </span>
                              </div>
                              <p className="text-slate-300 text-sm">{entry.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-400 text-xs">
                                {new Date(entry.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-slate-500 text-xs">
                                {new Date(entry.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {pointsTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-4">
                        <div className="text-sm text-slate-400">
                          Page {pointsPage} of {pointsTotalPages}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setPointsPage(pointsPage - 1)}
                            disabled={pointsPage === 1}
                            size="sm"
                            className="bg-slate-800/50 border-slate-600/50"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setPointsPage(pointsPage + 1)}
                            disabled={pointsPage === pointsTotalPages}
                            size="sm"
                            className="bg-slate-800/50 border-slate-600/50"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="activity" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Activity Overview</h3>
                  <Button
                    onClick={fetchCheckInHistory}
                    variant="outline"
                    size="sm"
                    className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-cyan-400" />
                      <span className="text-slate-400">Daily Check-in Streak</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{user.dailyCheckin?.streak || 0} days</p>
                  </div>

                  <div className="p-4 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-green-400" />
                      <span className="text-slate-400">Total Referrals</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{referralsTotal}</p>
                  </div>

                  <div className="p-4 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span className="text-slate-400">Followers</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{user.followersCount || 0}</p>
                  </div>

                  <div className="p-4 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span className="text-slate-400">Following</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{user.followingCount || 0}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Check-in History</h3>
                  {checkInLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                    </div>
                  ) : checkInHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Activity className="h-8 w-8 mx-auto mb-2" />
                      <p>No check-in history found</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {checkInHistory.map((checkIn) => (
                          <div key={checkIn._id} className="p-4 bg-slate-800/30 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium">Check-in</p>
                                <p className="text-slate-300 text-sm">Streak: {checkIn.streakCount}</p>
                                <p className="text-slate-300 text-sm">Points: +{checkIn.pointsAwarded}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-slate-400 text-xs">
                                  {new Date(checkIn.checkInDate).toLocaleDateString()}
                                </p>
                                <p className="text-slate-500 text-xs">
                                  {new Date(checkIn.checkInDate).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {checkInTotalPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                          <div className="text-sm text-slate-400">
                            Page {checkInPage} of {checkInTotalPages}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setCheckInPage(checkInPage - 1)}
                              disabled={checkInPage === 1}
                              size="sm"
                              className="bg-slate-800/50 border-slate-600/50"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setCheckInPage(checkInPage + 1)}
                              disabled={checkInPage === checkInTotalPages}
                              size="sm"
                              className="bg-slate-800/50 border-slate-600/50"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Side Stats and Actions */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Web3 Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-slate-400">Total Points</span>
                </div>
                <span className="text-white font-bold text-lg">{user.totalPoints || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span className="text-slate-400">Max Streak</span>
                </div>
                <span className="text-white font-bold text-lg">{user.dailyCheckin?.streak || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Role</span>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {user.role || 'user'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleToggleBan}
                disabled={actionLoading}
                className={`w-full ${user.isBanned
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}