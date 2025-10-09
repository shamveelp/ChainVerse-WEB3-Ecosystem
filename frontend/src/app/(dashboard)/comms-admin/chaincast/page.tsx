"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChartBar as BarChart3, Play, Plus, Clock, Users, Eye, TrendingUp, Settings } from 'lucide-react'

const mockChainCasts = [
  {
    id: 1,
    title: "Weekly DeFi Update",
    description: "Latest trends and developments in decentralized finance",
    scheduledDate: "Dec 25, 2024",
    scheduledTime: "3:00 PM UTC",
    status: "scheduled",
    estimatedViewers: 250,
    duration: "30 min"
  },
  {
    id: 2, 
    title: "Year-End Community Highlights",
    description: "Celebrating our community's achievements in 2024",
    scheduledDate: "Dec 31, 2024",
    scheduledTime: "8:00 PM UTC",
    status: "scheduled",
    estimatedViewers: 500,
    duration: "45 min"
  },
  {
    id: 3,
    title: "NFT Market Analysis",
    description: "Deep dive into current NFT market trends and opportunities",
    scheduledDate: "Dec 22, 2024",
    scheduledTime: "2:00 PM UTC", 
    status: "completed",
    actualViewers: 180,
    duration: "35 min"
  },
]

export default function ChainCastPage() {
  const [activeTab, setActiveTab] = useState("upcoming")

  const upcomingCasts = mockChainCasts.filter(cast => cast.status === "scheduled")
  const completedCasts = mockChainCasts.filter(cast => cast.status === "completed")

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            ChainCast Studio
          </h1>
          <p className="text-gray-400 mt-2">Create and manage live streams for your community</p>
        </div>
        <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Schedule ChainCast
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total ChainCasts</p>
                <p className="text-2xl font-bold text-white">24</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Viewers</p>
                <p className="text-2xl font-bold text-white">5.2k</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Avg. Duration</p>
                <p className="text-2xl font-bold text-white">32min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-orange-800 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Engagement</p>
                <p className="text-2xl font-bold text-white">87%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-red-800/30">
        <Button
          variant={activeTab === "upcoming" ? "default" : "ghost"}
          onClick={() => setActiveTab("upcoming")}
          className={activeTab === "upcoming" 
            ? "bg-gradient-to-r from-red-600 to-red-700 text-white" 
            : "text-gray-400 hover:text-white hover:bg-red-950/30"
          }
        >
          Upcoming ChainCasts
        </Button>
        <Button
          variant={activeTab === "completed" ? "default" : "ghost"}
          onClick={() => setActiveTab("completed")}
          className={activeTab === "completed" 
            ? "bg-gradient-to-r from-red-600 to-red-700 text-white" 
            : "text-gray-400 hover:text-white hover:bg-red-950/30"
          }
        >
          Past ChainCasts
        </Button>
        <Button
          variant={activeTab === "analytics" ? "default" : "ghost"}
          onClick={() => setActiveTab("analytics")}
          className={activeTab === "analytics" 
            ? "bg-gradient-to-r from-red-600 to-red-700 text-white" 
            : "text-gray-400 hover:text-white hover:bg-red-950/30"
          }
        >
          Analytics
        </Button>
      </div>

      {/* Upcoming ChainCasts */}
      {activeTab === "upcoming" && (
        <div className="space-y-4">
          {upcomingCasts.length === 0 ? (
            <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Upcoming ChainCasts</h3>
                <p className="text-gray-400 mb-6">Schedule your first ChainCast to engage with your community live</p>
                <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule ChainCast
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcomingCasts.map((cast) => (
              <Card key={cast.id} className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-700/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-white">{cast.title}</h3>
                        <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                          {cast.status}
                        </Badge>
                      </div>
                      <p className="text-gray-400">{cast.description}</p>
                      <div className="flex items-center gap-6 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{cast.scheduledDate} at {cast.scheduledTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{cast.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{cast.estimatedViewers} expected viewers</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="border-red-600/50 text-red-400 hover:bg-red-950/30">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white">
                        <Play className="h-4 w-4 mr-2" />
                        Go Live
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Past ChainCasts */}
      {activeTab === "completed" && (
        <div className="space-y-4">
          {completedCasts.map((cast) => (
            <Card key={cast.id} className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-700/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-white">{cast.title}</h3>
                      <Badge variant="outline" className="border-gray-600 text-gray-400">
                        {cast.status}
                      </Badge>
                    </div>
                    <p className="text-gray-400">{cast.description}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{cast.scheduledDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{cast.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>{cast.actualViewers} viewers</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-red-600/50 text-red-400 hover:bg-red-950/30">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                    <Button variant="outline" size="sm" className="border-red-600/50 text-red-400 hover:bg-red-950/30">
                      <Play className="h-4 w-4 mr-2" />
                      Replay
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Viewer Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-400">Engagement chart would go here</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Popular Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">DeFi Updates</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-700 rounded-full">
                      <div className="w-20 h-2 bg-gradient-to-r from-red-600 to-red-700 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-400">85%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">NFT Analysis</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-700 rounded-full">
                      <div className="w-16 h-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-400">72%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Community Q&A</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-700 rounded-full">
                      <div className="w-14 h-2 bg-gradient-to-r from-green-600 to-green-700 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-400">65%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}