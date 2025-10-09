"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Plus, Users, Clock, Star, Target, BookOpen, Award, TrendingUp, Eye, CirclePlay as PlayCircle, CircleCheck as CheckCircle, CreditCard as Edit } from 'lucide-react'

const mockQuests = [
  {
    id: 1,
    title: "DeFi Fundamentals",
    description: "Learn the basics of decentralized finance",
    category: "Education",
    difficulty: "Beginner", 
    estimatedTime: "2 hours",
    rewards: "100 XP + NFT Badge",
    participants: 89,
    completionRate: 76,
    status: "active",
    createdDate: "Dec 15, 2024"
  },
  {
    id: 2,
    title: "NFT Creation Challenge",
    description: "Create and mint your first NFT",
    category: "Creative",
    difficulty: "Intermediate",
    estimatedTime: "3 hours", 
    rewards: "150 XP + Premium Badge",
    participants: 45,
    completionRate: 62,
    status: "active",
    createdDate: "Dec 10, 2024"
  },
  {
    id: 3,
    title: "DAO Governance Workshop",
    description: "Participate in decentralized governance",
    category: "Governance",
    difficulty: "Advanced",
    estimatedTime: "4 hours",
    rewards: "200 XP + Leader Badge",
    participants: 23,
    completionRate: 45,
    status: "draft",
    createdDate: "Dec 20, 2024"
  },
]

const mockQuestStats = {
  totalQuests: 28,
  activeQuests: 15,
  totalParticipants: 1247,
  avgCompletionRate: 68
}

export default function QuestsPage() {
  const [activeTab, setActiveTab] = useState("active")

  const activeQuests = mockQuests.filter(quest => quest.status === "active")
  const draftQuests = mockQuests.filter(quest => quest.status === "draft")

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-600"
      case "Intermediate": return "bg-yellow-600"
      case "Advanced": return "bg-red-600"
      default: return "bg-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            Quest Management
          </h1>
          <p className="text-gray-400 mt-2">Create and manage learning quests for your community</p>
        </div>
        <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create Quest
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Quests</p>
                <p className="text-2xl font-bold text-white">{mockQuestStats.totalQuests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                <PlayCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Quests</p>
                <p className="text-2xl font-bold text-white">{mockQuestStats.activeQuests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Participants</p>
                <p className="text-2xl font-bold text-white">{mockQuestStats.totalParticipants.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-orange-800 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Avg. Completion</p>
                <p className="text-2xl font-bold text-white">{mockQuestStats.avgCompletionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-black/60 backdrop-blur-xl border border-red-800/30">
          <TabsTrigger 
            value="active" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white"
          >
            Active Quests
          </TabsTrigger>
          <TabsTrigger 
            value="drafts"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white"
          >
            Drafts
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white"
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Active Quests */}
        <TabsContent value="active" className="space-y-4">
          {activeQuests.length === 0 ? (
            <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
              <CardContent className="p-12 text-center">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Active Quests</h3>
                <p className="text-gray-400 mb-6">Create your first quest to engage your community with learning challenges</p>
                <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quest
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeQuests.map((quest) => (
                <Card key={quest.id} className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-700/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Quest Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-white">{quest.title}</h3>
                          <p className="text-gray-400">{quest.description}</p>
                        </div>
                        <Badge className={`${getDifficultyColor(quest.difficulty)} text-white`}>
                          {quest.difficulty}
                        </Badge>
                      </div>

                      {/* Quest Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>{quest.estimatedTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <BookOpen className="h-4 w-4" />
                          <span>{quest.category}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Users className="h-4 w-4" />
                          <span>{quest.participants} participants</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Award className="h-4 w-4" />
                          <span>{quest.rewards}</span>
                        </div>
                      </div>

                      {/* Completion Rate */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Completion Rate</span>
                          <span className="text-white font-medium">{quest.completionRate}%</span>
                        </div>
                        <Progress 
                          value={quest.completionRate} 
                          className="h-2"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1 border-red-600/50 text-red-400 hover:bg-red-950/30">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 border-red-600/50 text-red-400 hover:bg-red-950/30">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Draft Quests */}
        <TabsContent value="drafts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {draftQuests.map((quest) => (
              <Card key={quest.id} className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-700/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">{quest.title}</h3>
                        <p className="text-gray-400">{quest.description}</p>
                      </div>
                      <Badge variant="outline" className="border-gray-600 text-gray-400">
                        Draft
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>{quest.estimatedTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <BookOpen className="h-4 w-4" />
                        <span>{quest.category}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 border-red-600/50 text-red-400 hover:bg-red-950/30">
                        <Edit className="h-4 w-4 mr-2" />
                        Continue Editing
                      </Button>
                      <Button size="sm" className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Publish
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Quest Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">DeFi Fundamentals</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full">
                        <div className="w-20 h-2 bg-gradient-to-r from-green-600 to-green-700 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-400">76%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">NFT Creation Challenge</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full">
                        <div className="w-16 h-2 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-400">62%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">DAO Governance Workshop</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full">
                        <div className="w-12 h-2 bg-gradient-to-r from-red-600 to-red-700 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-400">45%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Participation Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-400">Participation trends chart would go here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}