"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Trophy, Plus, Users, Clock, Target, TrendingUp, Eye, CreditCard as Edit, Trash2, Play, Square, Search, Filter, Calendar, Coins, Award, MoreVertical, Crown, DollarSign } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { communityAdminQuestApiService } from '@/services/quests/communityAdminQuestApiService';
import { QuestAccessGuard } from '@/components/comms-admin/QuestAccessGuard';
import { ConfirmationDialog } from '@/components/comms-admin/ConfirmationDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COMMUNITY_ADMIN_ROUTES } from "@/routes";
import Image from 'next/image';

interface Quest {
  _id: string;
  title: string;
  description: string;
  bannerImage?: string;
  startDate: Date;
  endDate: Date;
  selectionMethod: 'fcfs' | 'random' | 'leaderboard';
  participantLimit: number;
  rewardPool: {
    amount: number;
    currency: string;
    rewardType: string;
    customReward?: string;
  };
  status: 'draft' | 'active' | 'ended' | 'cancelled';
  totalParticipants: number;
  totalSubmissions: number;
  winnersSelected: boolean;
  rewardsDistributed: boolean;
  isAIGenerated?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface QuestStats {
  totalQuests: number;
  activeQuests: number;
  endedQuests: number;
  totalParticipants: number;
  totalRewardsDistributed: number;
}

export default function QuestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "active");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [stats, setStats] = useState<QuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Confirmation dialogs
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; questId: string; questTitle: string }>({
    open: false,
    questId: '',
    questTitle: ''
  });
  const [startDialog, setStartDialog] = useState<{ open: boolean; questId: string; questTitle: string }>({
    open: false,
    questId: '',
    questTitle: ''
  });
  const [endDialog, setEndDialog] = useState<{ open: boolean; questId: string; questTitle: string }>({
    open: false,
    questId: '',
    questTitle: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    fetchQuests();
    fetchStats();
  }, [activeTab, currentPage]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const fetchQuests = async () => {
    setLoading(true);
    try {
      const response = await communityAdminQuestApiService.getQuests({
        page: currentPage,
        limit: 6,
        status: activeTab === 'all' ? undefined : activeTab as any,
        search: searchTerm || undefined
      });

      if (response.success && response.data) {
        setQuests(response.data.quests || response.data.items || []);
        setTotalPages(response.data.pagination.pages);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error || "Failed to fetch quests",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch quests",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await communityAdminQuestApiService.getCommunityQuestStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else if (response.error) {
        console.error("Failed to fetch stats:", response.error);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    setActionLoading(true);
    try {
      const response = await communityAdminQuestApiService.deleteQuest(questId);
      if (response.success) {
        toast({
          title: "Success! 🗑️",
          description: response.message || "Quest deleted successfully",
        });
        fetchQuests();
        fetchStats();
      } else {
        throw new Error(response.error || "Failed to delete quest");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete quest",
      });
    } finally {
      setActionLoading(false);
      setDeleteDialog({ open: false, questId: '', questTitle: '' });
    }
  };

  const handleStartQuest = async (questId: string) => {
    setActionLoading(true);
    try {
      const response = await communityAdminQuestApiService.startQuest(questId);
      if (response.success) {
        toast({
          title: "Success! 🚀",
          description: response.message || "Quest started successfully",
        });
        fetchQuests();
        fetchStats();
      } else {
        throw new Error(response.error || "Failed to start quest");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to start quest",
      });
    } finally {
      setActionLoading(false);
      setStartDialog({ open: false, questId: '', questTitle: '' });
    }
  };

  const handleEndQuest = async (questId: string) => {
    setActionLoading(true);
    try {
      const response = await communityAdminQuestApiService.endQuest(questId);
      if (response.success) {
        toast({
          title: "Success! 🏁",
          description: response.message || "Quest ended successfully",
        });
        fetchQuests();
        fetchStats();
      } else {
        throw new Error(response.error || "Failed to end quest");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to end quest",
      });
    } finally {
      setActionLoading(false);
      setEndDialog({ open: false, questId: '', questTitle: '' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-600";
      case "ended": return "bg-gray-600";
      case "draft": return "bg-yellow-600";
      case "cancelled": return "bg-red-600";
      default: return "bg-gray-600";
    }
  };

  const getSelectionMethodBadge = (method: string) => {
    switch (method) {
      case 'fcfs':
        return <Badge variant="outline" className="text-blue-400 border-blue-500">First Come First Serve</Badge>;
      case 'random':
        return <Badge variant="outline" className="text-green-400 border-green-500">Random Selection</Badge>;
      case 'leaderboard':
        return <Badge variant="outline" className="text-white border-white">Leaderboard</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-400 border-gray-500">{method}</Badge>;
    }
  };

  const getRewardTypeIcon = (rewardType: string) => {
    switch (rewardType) {
      case "token": return <Coins className="h-4 w-4" />;
      case "nft": return <Award className="h-4 w-4" />;
      case "points": return <Target className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <QuestAccessGuard>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Quest Management
            </h1>
            <p className="text-slate-400 mt-2 font-light">Create and manage engaging quests for your community</p>
          </div>
          <Button
            onClick={() => router.push(COMMUNITY_ADMIN_ROUTES.QUESTS_CREATE)}
            className="bg-white text-black hover:bg-slate-200 shadow-none border border-white/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Quest
          </Button>
        </div>

        {/* Enhanced Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 shadow-lg hover:border-white/20 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Total Quests</p>
                    <p className="text-2xl font-bold text-white">{stats.totalQuests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 shadow-lg hover:border-white/20 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Active Quests</p>
                    <p className="text-2xl font-bold text-white">{stats.activeQuests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 shadow-lg hover:border-white/20 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Total Participants</p>
                    <p className="text-2xl font-bold text-white">{stats.totalParticipants.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 shadow-lg hover:border-white/20 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                    <Square className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Ended Quests</p>
                    <p className="text-2xl font-bold text-white">{stats.endedQuests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 shadow-lg hover:border-white/20 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Rewards Distributed</p>
                    <p className="text-2xl font-bold text-white">{stats.totalRewardsDistributed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        <Card className="bg-slate-900/50 backdrop-blur-xl border border-slate-800">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search quests by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchQuests()}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus-visible:ring-white focus-visible:border-white transition-all duration-300"
                />
              </div>
              <Button
                onClick={fetchQuests}
                variant="outline"
                className="border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <Filter className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 p-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl">
            {["active", "draft", "ended", "cancelled", "all"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="capitalize data-[state=active]:bg-white data-[state=active]:text-black rounded-lg transition-all duration-300"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="h-6 bg-slate-800 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-800 rounded w-full"></div>
                        <div className="h-20 bg-slate-800 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : quests.length === 0 ? (
              <Card className="bg-slate-900/50 backdrop-blur-xl border border-slate-800">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy className="h-10 w-10 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Quests Found</h3>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">
                    {activeTab === 'draft' ? 'No draft quests. Start creating your first quest!' :
                      activeTab === 'active' ? 'No active quests. Create and launch a quest to engage your community!' :
                        activeTab === 'ended' ? 'No completed quests yet.' :
                          'No quests found matching your criteria.'}
                  </p>
                  <Button
                    onClick={() => router.push(COMMUNITY_ADMIN_ROUTES.QUESTS_CREATE)}
                    className="bg-white text-black hover:bg-slate-200 shadow-none border border-white/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quest
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {quests.map((quest) => (
                  <Card key={quest._id} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-white/20 transition-all duration-300 group overflow-hidden">
                    {/* Banner Image with Gradient Overlay */}
                    <div className="relative h-48 overflow-hidden bg-slate-900">
                      {quest.bannerImage ? (
                        <>
                          <Image
                            src={quest.bannerImage}
                            alt={quest.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                          <Trophy className="h-20 w-20 text-white/20" />
                        </div>
                      )}

                      {/* Floating Status Badge */}
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <Badge className={`${getStatusColor(quest.status)} text-white shadow-lg backdrop-blur-sm flex-shrink-0`}>
                          {quest.status}
                        </Badge>
                        {quest.isAIGenerated && (
                          <Badge variant="outline" className="text-xs border-indigo-400/50 text-indigo-300 bg-indigo-950/80 backdrop-blur-sm flex-shrink-0 shadow-lg">
                            ✨ AI
                          </Badge>
                        )}
                      </div>

                      {/* Dropdown Menu */}
                      <div className="absolute top-4 left-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 bg-slate-900/80 backdrop-blur-sm text-slate-200 hover:text-white hover:bg-slate-800/90 border border-slate-700/50 shadow-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-slate-900 border-slate-700 text-slate-200">
                            <DropdownMenuItem
                              onClick={() => router.push(`${COMMUNITY_ADMIN_ROUTES.QUESTS}/${quest._id}`)}
                              className="text-slate-200 hover:bg-slate-800 cursor-pointer focus:bg-slate-800 focus:text-white"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {quest.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() => router.push(`${COMMUNITY_ADMIN_ROUTES.QUESTS_EDIT}/${quest._id}`)}
                                className="text-slate-200 hover:bg-slate-800 cursor-pointer focus:bg-slate-800 focus:text-white"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {quest.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() => setStartDialog({
                                  open: true,
                                  questId: quest._id,
                                  questTitle: quest.title
                                })}
                                className="text-emerald-400 hover:bg-emerald-500/10 cursor-pointer focus:bg-emerald-500/10 focus:text-emerald-300"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Start Quest
                              </DropdownMenuItem>
                            )}
                            {quest.status === 'active' && (
                              <DropdownMenuItem
                                onClick={() => setEndDialog({
                                  open: true,
                                  questId: quest._id,
                                  questTitle: quest.title
                                })}
                                className="text-amber-400 hover:bg-amber-500/10 cursor-pointer focus:bg-amber-500/10 focus:text-amber-300"
                              >
                                <Square className="h-4 w-4 mr-2" />
                                End Quest
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog({
                                open: true,
                                questId: quest._id,
                                questTitle: quest.title
                              })}
                              className="text-red-400 hover:bg-red-500/10 cursor-pointer focus:bg-red-500/10 focus:text-red-300"
                              disabled={quest.status === 'active'}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Reward Badge at Bottom */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 shadow-lg">
                          <div className="flex items-center gap-2 text-white">
                            {getRewardTypeIcon(quest.rewardPool.rewardType)}
                            <span className="font-semibold text-sm">{quest.rewardPool.amount} {quest.rewardPool.currency}</span>
                          </div>
                          <div className="ml-auto">
                            {getSelectionMethodBadge(quest.selectionMethod)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Quest Title & Description */}
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-white truncate group-hover:text-slate-300 transition-colors max-w-full">
                            {quest.title}
                          </h3>
                          <p className="text-slate-400 text-sm line-clamp-2 break-words leading-relaxed">
                            {quest.description}
                          </p>
                        </div>

                        {/* Quest Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2">
                            <Calendar className="h-4 w-4 text-violet-400 flex-shrink-0" />
                            <span className="text-xs truncate">{formatDate(quest.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2">
                            <Users className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                            <span className="text-xs truncate">{quest.totalParticipants} joined</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2">
                            <Target className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                            <span className="text-xs truncate">{quest.participantLimit} winners</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2">
                            <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
                            <span className="text-xs truncate">{formatDate(quest.endDate)}</span>
                          </div>
                        </div>

                        {/* Enhanced Status Indicators */}
                        {(quest.winnersSelected || quest.rewardsDistributed) && (
                          <div className="flex flex-wrap gap-2">
                            {quest.winnersSelected && (
                              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1.5">
                                <Crown className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-emerald-400 text-xs font-medium">Winners Selected</span>
                              </div>
                            )}
                            {quest.rewardsDistributed && (
                              <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-3 py-1.5">
                                <DollarSign className="h-3.5 w-3.5 text-indigo-400" />
                                <span className="text-indigo-400 text-xs font-medium">Rewards Sent</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Progress for active quests */}
                        {quest.status === 'active' && (
                          <div className="space-y-2 bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400 font-medium">Participants / Winners</span>
                              <span className="text-white font-semibold">
                                {quest.totalParticipants} / {quest.participantLimit} winners
                              </span>
                            </div>
                            <Progress
                              value={Math.min((quest.totalParticipants / quest.participantLimit) * 100, 100)}
                              className="h-2 bg-slate-700"
                            />
                            <p className="text-xs text-slate-500">Unlimited users can participate. Progress shows participants vs winner slots.</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20 hover:text-white transition-all"
                            onClick={() => router.push(`${COMMUNITY_ADMIN_ROUTES.QUESTS}/${quest._id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {quest.status === 'draft' && (
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
                              onClick={() => setStartDialog({
                                open: true,
                                questId: quest._id,
                                questTitle: quest.title
                              })}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Launch
                            </Button>
                          )}
                          {quest.status === 'ended' && !quest.winnersSelected && (
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white shadow-lg shadow-amber-500/20"
                              onClick={() => router.push(`${COMMUNITY_ADMIN_ROUTES.QUESTS}/${quest._id}/participants`)}
                            >
                              <Trophy className="h-4 w-4 mr-2" />
                              Pick Winners
                            </Button>
                          )}
                          {quest.status === 'ended' && quest.winnersSelected && !quest.rewardsDistributed && (
                            <Button
                              size="sm"
                              className="flex-1 bg-white text-black hover:bg-slate-200 border border-white/10"
                              onClick={() => router.push(`${COMMUNITY_ADMIN_ROUTES.QUESTS}/${quest._id}`)}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Distribute
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-white/10 text-slate-400 hover:bg-white/5"
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-white/10 text-slate-400 hover:bg-white/5"
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Enhanced Confirmation Dialogs */}
        <ConfirmationDialog
          isOpen={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
          title="Delete Quest"
          description={`Are you sure you want to delete "${deleteDialog.questTitle}"? This action cannot be undone and will permanently remove all quest data, participants, and submissions.`}
          confirmText="Delete Quest"
          cancelText="Cancel"
          onConfirm={() => handleDeleteQuest(deleteDialog.questId)}
          variant="destructive"
          loading={actionLoading}
        />

        <ConfirmationDialog
          isOpen={startDialog.open}
          onOpenChange={(open) => setStartDialog({ ...startDialog, open })}
          title="Start Quest"
          description={`Are you sure you want to start "${startDialog.questTitle}"? Once started, participants can begin joining and completing tasks. You cannot edit the quest after starting.`}
          confirmText="Start Quest"
          cancelText="Cancel"
          onConfirm={() => handleStartQuest(startDialog.questId)}
          variant="default"
          loading={actionLoading}
        />

        <ConfirmationDialog
          isOpen={endDialog.open}
          onOpenChange={(open) => setEndDialog({ ...endDialog, open })}
          title="End Quest"
          description={`Are you sure you want to end "${endDialog.questTitle}"? This will stop new participants from joining and allow you to select winners.`}
          confirmText="End Quest"
          cancelText="Cancel"
          onConfirm={() => handleEndQuest(endDialog.questId)}
          variant="default"
          loading={actionLoading}
        />
      </div>
    </QuestAccessGuard >
  );
}