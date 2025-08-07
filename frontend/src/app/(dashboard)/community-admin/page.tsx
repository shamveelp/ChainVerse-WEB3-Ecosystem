"use client"
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Settings, BarChart3, MessageSquare, Crown, LogOut, Bell, Calendar } from 'lucide-react'
import { useCommunityAdminAuthActions } from '@/lib/communityAdminAuthActions'
import { CommunityAdminProtectedRoute } from '@/redirects/communityAdminRedirects'
import type { RootState } from '@/redux/store'

export default function CommunityAdminDashboard() {
  const { logout } = useCommunityAdminAuthActions()
  const { communityAdmin } = useSelector((state: RootState) => state.communityAdminAuth)
  const [stats, setStats] = useState({
    totalMembers: 1247,
    activeMembers: 892,
    totalPosts: 3456,
    engagement: 78
  })

  const handleLogout = async () => {
    await logout()
  }

  return (
    <CommunityAdminProtectedRoute>
      <div className="min-h-screen bg-black">
        {/* Header */}
        <header className="bg-gradient-to-r from-red-900/30 to-red-800/30 backdrop-blur-sm border-b border-red-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Community Dashboard</h1>
                  <p className="text-gray-400">Welcome back, {communityAdmin?.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" className="text-gray-400 hover:text-white">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button 
                  onClick={handleLogout}
                  variant="ghost" 
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-red-950/50 to-red-900/30 border-red-800/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-400 text-sm font-medium">Total Members</p>
                    <p className="text-3xl font-bold text-white">{stats.totalMembers.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-950/50 to-orange-900/30 border-orange-800/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-400 text-sm font-medium">Active Members</p>
                    <p className="text-3xl font-bold text-white">{stats.activeMembers.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 border-blue-800/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 text-sm font-medium">Total Posts</p>
                    <p className="text-3xl font-bold text-white">{stats.totalPosts.toLocaleString()}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-950/50 to-green-900/30 border-green-800/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 text-sm font-medium">Engagement Rate</p>
                    <p className="text-3xl font-bold text-white">{stats.engagement}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="bg-black/80 backdrop-blur-xl border-red-800/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-red-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start bg-red-950/30 hover:bg-red-900/40 text-white border-red-800/30">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Members
                </Button>
                <Button className="w-full justify-start bg-red-950/30 hover:bg-red-900/40 text-white border-red-800/30">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Moderate Posts
                </Button>
                <Button className="w-full justify-start bg-red-950/30 hover:bg-red-900/40 text-white border-red-800/30">
                  <Settings className="h-4 w-4 mr-2" />
                  Community Settings
                </Button>
                <Button className="w-full justify-start bg-red-950/30 hover:bg-red-900/40 text-white border-red-800/30">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/80 backdrop-blur-xl border-red-800/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-red-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-950/20 rounded-lg">
                  <div>
                    <p className="text-white text-sm">New member joined</p>
                    <p className="text-gray-400 text-xs">2 minutes ago</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">+1</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-950/20 rounded-lg">
                  <div>
                    <p className="text-white text-sm">Post reported</p>
                    <p className="text-gray-400 text-xs">15 minutes ago</p>
                  </div>
                  <Badge className="bg-red-500/20 text-red-400">Action needed</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-950/20 rounded-lg">
                  <div>
                    <p className="text-white text-sm">Community milestone reached</p>
                    <p className="text-gray-400 text-xs">1 hour ago</p>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400">1K members</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Community Info */}
          <Card className="bg-black/80 backdrop-blur-xl border-red-800/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Crown className="h-5 w-5 text-red-400" />
                Community Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-red-400 font-medium">Admin Email</Label>
                  <p className="text-white">{communityAdmin?.email}</p>
                </div>
                <div>
                  <Label className="text-red-400 font-medium">Community ID</Label>
                  <p className="text-white font-mono">{communityAdmin?.communityId || 'Not assigned'}</p>
                </div>
                <div>
                  <Label className="text-red-400 font-medium">Status</Label>
                  <Badge className="bg-green-500/20 text-green-400 ml-2">
                    {communityAdmin?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-red-400 font-medium">Last Login</Label>
                  <p className="text-white">
                    {communityAdmin?.lastLogin 
                      ? new Date(communityAdmin.lastLogin).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-red-400 font-medium">Role</Label>
                  <Badge className="bg-red-500/20 text-red-400 ml-2">Community Admin</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </CommunityAdminProtectedRoute>
  )
}
