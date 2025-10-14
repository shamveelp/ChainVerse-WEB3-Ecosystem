"use client"

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, TrendingUp, Crown, MessageSquare, Trophy, Activity, Plus, ChevronRight, Sparkles, Calendar, Star, ChartBar as BarChart3 } from 'lucide-react'
import type { RootState } from '@/redux/store'
import { COMMUNITY_ADMIN_ROUTES } from '@/routes'
import { useRouter } from 'next/navigation'
import { communityAdminProfileApiService } from '@/services/communityAdmin/communityAdminProfileApiService'
import { toast } from 'sonner'

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalPosts: number;
  totalQuests: number;
  premiumMembers: number;
  engagementRate: number;
}

interface CommunityAdminProfile {
  name: string;
  stats: DashboardStats;
}

// Mock data for areas not yet implemented
const mockRecentActivity = [
  { id: 1, user: "Alice", action: "joined the community", time: "2 minutes ago" },
  { id: 2, user: "Bob", action: "completed Quest: Web3 Basics", time: "5 minutes ago" },
  { id: 3, user: "Carol", action: "created a new post", time: "12 minutes ago" },
  { id: 4, user: "David", action: "upgraded to Premium", time: "18 minutes ago" },
  { id: 5, user: "Eve", action: "started Quest: DeFi Deep Dive", time: "25 minutes ago" },
]

const mockUpcomingEvents = [
  { id: 1, title: "Weekly AMA Session", date: "Tomorrow", time: "3:00 PM" },
  { id: 2, title: "DeFi Workshop", date: "Dec 28", time: "2:00 PM" },
  { id: 3, title: "Year-End Community Celebration", date: "Dec 31", time: "8:00 PM" },
]

export default function CommunityAdminDashboard() {
  const router = useRouter()
  const { communityAdmin } = useSelector((state: RootState) => state.communityAdminAuth)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [profile, setProfile] = useState<CommunityAdminProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await communityAdminProfileApiService.getProfile()
      
      if (response.success && response.data) {
        setProfile(response.data)
      } else {
        toast.error(response.error || 'Failed to fetch profile')
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to fetch profile data')
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const stats = profile?.stats || {
    totalMembers: 0,
    activeMembers: 0,
    totalPosts: 0,
    totalQuests: 0,
    premiumMembers: 0,
    engagementRate: 0
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-red-800/20 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-red-800/20 rounded w-1/2"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-black/60 backdrop-blur-xl border-red-800/30">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-red-800/20 rounded w-2/3"></div>
                  <div className="h-8 bg-red-800/20 rounded w-1/2"></div>
                  <div className="h-3 bg-red-800/20 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            {getGreeting()}, {profile?.name?.split(' ')[0] || communityAdmin?.name?.split(' ')[0] || 'Admin'}! 👋
          </h1>
          <p className="text-gray-400 text-lg mt-2">
            Here's what's happening in your community today
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="text-lg font-semibold text-white">
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-700/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Members</CardTitle>
            <Users className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalMembers.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
              <TrendingUp className="h-3 w-3" />
              Community growing
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-700/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Members</CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeMembers.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
              <TrendingUp className="h-3 w-3" />
              {stats.totalMembers > 0 ? `${((stats.activeMembers / stats.totalMembers) * 100).toFixed(1)}% active` : '0% active'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-700/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalPosts.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-blue-400 mt-1">
              <TrendingUp className="h-3 w-3" />
              Content growing
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-700/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Premium Members</CardTitle>
            <Crown className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.premiumMembers}</div>
            <div className="flex items-center gap-1 text-xs text-yellow-400 mt-1">
              <TrendingUp className="h-3 w-3" />
              {stats.totalMembers > 0 ? `${((stats.premiumMembers / stats.totalMembers) * 100).toFixed(1)}% premium` : '0% premium'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-400" />
                Recent Activity
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                onClick={() => router.push(COMMUNITY_ADMIN_ROUTES.MEMBERS)}
              >
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-950/20 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-r from-red-600 to-red-800 text-white text-xs">
                      {activity.user[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium text-white">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-red-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => router.push(COMMUNITY_ADMIN_ROUTES.FEED)}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white justify-start gap-3"
            >
              <MessageSquare className="h-4 w-4" />
              View Community Feed
            </Button>
            <Button
              onClick={() => router.push(COMMUNITY_ADMIN_ROUTES.MEMBERS)}
              variant="outline"
              className="w-full border-red-600/50 text-red-400 hover:bg-red-950/30 justify-start gap-3"
            >
              <Users className="h-4 w-4" />
              Manage Members
            </Button>
            <Button
              onClick={() => router.push(COMMUNITY_ADMIN_ROUTES.PROFILE)}
              variant="outline"
              className="w-full border-red-600/50 text-red-400 hover:bg-red-950/30 justify-start gap-3"
            >
              <Badge className="h-4 w-4" />
              Edit Profile
            </Button>
            <Button
              onClick={() => router.push(COMMUNITY_ADMIN_ROUTES.SETTINGS)}
              variant="outline"
              className="w-full border-red-600/50 text-red-400 hover:bg-red-950/30 justify-start gap-3"
            >
              <Badge className="h-4 w-4" />
              Community Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-400" />
                Upcoming Events
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockUpcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-red-950/20 transition-colors">
                  <div>
                    <h4 className="font-medium text-white">{event.title}</h4>
                    <p className="text-sm text-gray-400">{event.date} at {event.time}</p>
                  </div>
                  <Badge variant="outline" className="border-red-600/50 text-red-400">
                    Scheduled
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Community Health */}
        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-red-400" />
              Community Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Engagement Rate</span>
                <span className="text-sm font-medium text-green-400">{stats.engagementRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-600 to-green-500 h-2 rounded-full" style={{width: `${Math.min(stats.engagementRate, 100)}%`}}></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Active Members</span>
                <span className="text-sm font-medium text-blue-400">{stats.totalMembers > 0 ? ((stats.activeMembers / stats.totalMembers) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 h-2 rounded-full" style={{width: `${stats.totalMembers > 0 ? (stats.activeMembers / stats.totalMembers) * 100 : 0}%`}}></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Premium Members</span>
                <span className="text-sm font-medium text-yellow-400">{stats.totalMembers > 0 ? ((stats.premiumMembers / stats.totalMembers) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 h-2 rounded-full" style={{width: `${stats.totalMembers > 0 ? (stats.premiumMembers / stats.totalMembers) * 100 : 0}%`}}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}