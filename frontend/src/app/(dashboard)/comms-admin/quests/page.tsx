"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Trophy, Plus, Users, Clock, Target, BookOpen, TrendingUp, Eye, CreditCard as Edit, Trash2, Play, Square, Search, Filter, Calendar, Coins, Award, MoreVertical } from 'lucide-react';
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

interface Quest {
  _id: string;
  title: string;
  description: string;
  bannerImage?: string;
  startDate: Date;
  endDate: Date;
  selectionMethod: 'fcfs' | 'random';
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
  isAIGenerated?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface QuestStats {
  totalQuests: number;
  activeQuests: number;
  endedQuests: number;
  totalParticipants: number;
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
          title: "Success",
          description: "Quest deleted successfully",
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
          title: "Success",
          description: "Quest started successfully",
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
          title: "Success",
          description: "Quest ended successfully",
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Quest Management
            </h1>
            <p className="text-gray-400 mt-2">Create and manage engaging quests for your community</p>
          </div>
          <Button
            onClick={() => router.push('/comms-admin/quests/create')}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Quest
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Quests</p>
                    <p className="text-2xl font-bold text-white">{stats.totalQuests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Active Quests</p>
                    <p className="text-2xl font-bold text-white">{stats.activeQuests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Participants</p>
                    <p className="text-2xl font-bold text-white">{stats.totalParticipants.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-orange-800 rounded-lg flex items-center justify-center">
                    <Square className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Ended Quests</p>
                    <p className="text-2xl font-bold text-white">{stats.endedQuests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search quests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchQuests()}
                  className="pl-10 bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <Button
                onClick={fetchQuests}
                variant="outline"
                className="border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
              >
                <Filter className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-black/60 backdrop-blur-xl border border-purple-800/30">
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
            >
              Active
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
            >
              Drafts
            </TabsTrigger>
            <TabsTrigger
              value="ended"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
            >
              Ended
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
            >
              Cancelled
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
            >
              All
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-black/60 backdrop-blur-xl border-purple-800/30 animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="h-6 bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-700 rounded"></div>
                        <div className="h-20 bg-gray-700 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : quests.length === 0 ? (
              <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
                <CardContent className="p-12 text-center">
                  <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Quests Found</h3>
                  <p className="text-gray-400 mb-6">
                    {activeTab === 'draft' ? 'No draft quests. Start creating your first quest!' :
                      activeTab === 'active' ? 'No active quests. Create and launch a quest to engage your community!' :
                        activeTab === 'ended' ? 'No completed quests yet.' :
                          'No quests found matching your criteria.'}
                  </p>
                  <Button
                    onClick={() => router.push('/comms-admin/quests/create')}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quest
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {quests.map((quest) => (
                  <Card key={quest._id} className="bg-black/60 backdrop-blur-xl border-purple-800/30 hover:border-purple-700/50 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Quest Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-white truncate">{quest.title}</h3>
                              {quest.isAIGenerated && (
                                <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                                  AI
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-2">{quest.description}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge className={`${getStatusColor(quest.status)} text-white`}>
                              {quest.status}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-600">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/comms-admin/quests/${quest._id}`)}
                                  className="text-white hover:bg-gray-700"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {quest.status === 'draft' && (
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/comms-admin/quests/edit/${quest._id}`)}
                                    className="text-white hover:bg-gray-700"
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
                                    className="text-green-400 hover:bg-gray-700"
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
                                    className="text-orange-400 hover:bg-gray-700"
                                  >
                                    <Square className="h-4 w-4 mr-2" />
                                    End Quest
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="bg-gray-600" />
                                <DropdownMenuItem
                                  onClick={() => setDeleteDialog({
                                    open: true,
                                    questId: quest._id,
                                    questTitle: quest.title
                                  })}
                                  className="text-red-400 hover:bg-gray-700"
                                  disabled={quest.status === 'active'}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Quest Stats */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(quest.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Users className="h-4 w-4" />
                            <span>{quest.totalParticipants} participants</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Target className="h-4 w-4" />
                            <span>{quest.participantLimit} winners</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            {getRewardTypeIcon(quest.rewardPool.rewardType)}
                            <span>{quest.rewardPool.amount} {quest.rewardPool.currency}</span>
                          </div>
                        </div>

                        {/* Progress for active quests */}
                        {quest.status === 'active' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Progress</span>
                              <span className="text-white font-medium">
                                {Math.min(quest.totalParticipants, quest.participantLimit)} / {quest.participantLimit}
                              </span>
                            </div>
                            <Progress
                              value={(quest.totalParticipants / quest.participantLimit) * 100}
                              className="h-2"
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
                            onClick={() => router.push(`/comms-admin/quests/${quest._id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          {quest.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border-green-600/50 text-green-400 hover:bg-green-950/30"
                              onClick={() => setStartDialog({
                                open: true,
                                questId: quest._id,
                                questTitle: quest.title
                              })}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start
                            </Button>
                          )}
                          {quest.status === 'ended' && !quest.winnersSelected && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border-yellow-600/50 text-yellow-400 hover:bg-yellow-950/30"
                              onClick={() => router.push(`/comms-admin/quests/${quest._id}/participants`)}
                            >
                              <Trophy className="h-4 w-4 mr-2" />
                              Select Winners
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
                  className="border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
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
                  className="border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialogs */}
        <ConfirmationDialog
          isOpen={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
          title="Delete Quest"
          description={`Are you sure you want to delete "${deleteDialog.questTitle}"? This action cannot be undone.`}
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
          description={`Are you sure you want to start "${startDialog.questTitle}"? Once started, participants can begin joining and completing tasks.`}
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
    </QuestAccessGuard>
  );
}