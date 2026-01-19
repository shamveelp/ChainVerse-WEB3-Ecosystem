"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Trophy, Calendar, Target, Coins, Award, Play, Square, CreditCard as Edit, Trash2, Crown, Clock, CheckCircle, AlertCircle, MoreVertical, Eye, UserX, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { communityAdminQuestApiService } from '@/services/quests/communityAdminQuestApiService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from 'next/image';

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
  tasks?: QuestTask[];
}

interface QuestTask {
  _id: string;
  title: string;
  description: string;
  taskType: string;
  isRequired: boolean;
  order: number;
  completedBy: number;
  config?: Record<string, unknown>;
}

interface SubmissionData {
  imageUrl?: string;
  twitterUrl?: string;
  text?: string;
  linkUrl?: string;
  communityName?: string;
  targetUsername?: string;
}

interface Submission {
  taskId: string | { _id: string };
  submittedAt: string | Date;
  submissionData?: SubmissionData;
}

interface Participant {
  _id: string;
  userId: {
    _id: string;
    username: string;
    name: string;
    profilePic: string;
    email: string;
  };
  status: string;
  joinedAt: Date;
  completedAt?: Date;
  totalTasksCompleted: number;
  isWinner: boolean;
  walletAddress?: string;
  submissions?: Submission[];
}

interface QuestStats {
  totalParticipants: number;
  totalSubmissions: number;
  completedParticipants: number;
  pendingReviews: number;
}

export default function QuestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const questId = params.id as string;

  const [quest, setQuest] = useState<Quest | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stats, setStats] = useState<QuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [participantsPage, setParticipantsPage] = useState(1);
  const [totalParticipantsPages, setTotalParticipantsPages] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (questId) {
      fetchQuestData();
    }
  }, [questId]);

  useEffect(() => {
    if (activeTab === "participants") {
      fetchParticipants();
    }
  }, [activeTab, participantsPage]);

  const fetchQuestData = async () => {
    setLoading(true);
    try {
      const [questResponse, statsResponse] = await Promise.all([
        communityAdminQuestApiService.getQuest(questId),
        communityAdminQuestApiService.getQuestStats(questId)
      ]);

      if (questResponse.success && questResponse.data) {
        setQuest(questResponse.data as Quest);
      } else {
        throw new Error(questResponse.error || "Failed to fetch quest");
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data as unknown as QuestStats);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch quest data";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      router.push('/comms-admin/quests');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await communityAdminQuestApiService.getQuestParticipants(questId, {
        page: participantsPage,
        limit: 10
      });

      if (response.success && response.data) {
        interface ParticipantsResponse {
          participants?: Participant[];
          items?: Participant[];
          pagination?: {
            pages: number;
          };
        }

        // ... inside fetchParticipants
        const data = response.data as unknown as ParticipantsResponse;
        setParticipants(data.participants || data.items || []);
        setTotalParticipantsPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch participants:", error);
    }
  };

  const handleStartQuest = async () => {
    try {
      const response = await communityAdminQuestApiService.startQuest(questId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Quest started successfully",
        });
        fetchQuestData();
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start quest",
      });
    }
  };

  const handleEndQuest = async () => {
    try {
      const response = await communityAdminQuestApiService.endQuest(questId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Quest ended successfully",
        });
        fetchQuestData();
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to end quest",
      });
    }
  };

  const handleSelectWinners = async () => {
    try {
      const response = await communityAdminQuestApiService.selectWinners(questId, quest?.selectionMethod);
      if (response.success) {
        toast({
          title: "Success",
          description: response.data?.message || "Winners selected successfully",
        });
        fetchQuestData();
        fetchParticipants();
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to select winners",
      });
    }
  };

  const viewParticipantDetails = async (participant: Participant) => {
    try {
      const response = await communityAdminQuestApiService.getParticipantDetails(questId, participant.userId._id);
      if (response.success && response.data) {
        setSelectedParticipant({ ...participant, ...response.data });
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch participant details",
      });
    }
  };

  const disqualifyParticipant = async (participantId: string, reason: string) => {
    try {
      const response = await communityAdminQuestApiService.disqualifyParticipant(questId, participantId, reason);
      if (response.success) {
        toast({
          title: "Success",
          description: "Participant disqualified successfully",
        });
        fetchParticipants();
        setSelectedParticipant(null);
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disqualify participant",
      });
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

  const getParticipantStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-600";
      case "winner": return "bg-purple-600";
      case "disqualified": return "bg-red-600";
      case "in_progress": return "bg-blue-600";
      default: return "bg-gray-600";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || !quest) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-700 rounded"></div>
            <div className="h-96 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/comms-admin/quests')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quests
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{quest.title}</h1>
              <Badge className={`${getStatusColor(quest.status)} text-white`}>
                {quest.status}
              </Badge>
              {quest.isAIGenerated && (
                <Badge variant="outline" className="border-blue-500 text-blue-400">
                  AI Generated
                </Badge>
              )}
            </div>
            <p className="text-gray-400 mt-1">{quest.description}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {quest.status === 'draft' && (
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/comms-admin/quests/edit/${questId}`)}
                className="border-gray-600 text-gray-400"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={handleStartQuest}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Quest
              </Button>
            </>
          )}
          {quest.status === 'active' && (
            <Button
              onClick={handleEndQuest}
              variant="outline"
              className="border-orange-600 text-orange-400"
            >
              <Square className="h-4 w-4 mr-2" />
              End Quest
            </Button>
          )}
          {quest.status === 'ended' && !quest.winnersSelected && (
            <Button
              onClick={handleSelectWinners}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              Select Winners
            </Button>
          )}
        </div>
      </div>

      {/* Quest Image */}
      {quest.bannerImage && (
        <div className="w-full h-64 rounded-lg overflow-hidden">
          <Image
            src={quest.bannerImage}
            alt={quest.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-black/60 backdrop-blur-xl border border-purple-800/30">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
          >
            Tasks
          </TabsTrigger>
          <TabsTrigger
            value="participants"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
          >
            Participants
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Quest Details */}
              <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
                <CardHeader>
                  <CardTitle>Quest Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      <div>
                        <p className="text-xs text-gray-400">Start Date</p>
                        <p className="text-sm font-medium text-white">{formatDate(quest.startDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-400" />
                      <div>
                        <p className="text-xs text-gray-400">End Date</p>
                        <p className="text-sm font-medium text-white">{formatDate(quest.endDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-400" />
                      <div>
                        <p className="text-xs text-gray-400">Selection Method</p>
                        <p className="text-sm font-medium text-white">
                          {quest.selectionMethod === 'fcfs' ? 'First Come First Serve' : 'Random Selection'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-purple-400" />
                      <div>
                        <p className="text-xs text-gray-400">Winner Limit</p>
                        <p className="text-sm font-medium text-white">{quest.participantLimit}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reward Pool */}
              <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-400" />
                    Reward Pool
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full flex items-center justify-center">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {quest.rewardPool.amount} {quest.rewardPool.currency}
                      </p>
                      <p className="text-gray-400">
                        {quest.rewardPool.rewardType === 'custom'
                          ? quest.rewardPool.customReward
                          : `${quest.rewardPool.rewardType.charAt(0).toUpperCase() + quest.rewardPool.rewardType.slice(1)} Reward`}
                      </p>
                      <p className="text-sm text-gray-500">
                        Per winner: {(quest.rewardPool.amount / quest.participantLimit).toFixed(2)} {quest.rewardPool.currency}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-6">
              <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
                <CardHeader>
                  <CardTitle>Quest Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Total Participants</span>
                        <span className="font-bold text-white">{stats.totalParticipants}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Completed Participants</span>
                        <span className="font-bold text-green-400">{stats.completedParticipants}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Total Submissions</span>
                        <span className="font-bold text-blue-400">{stats.totalSubmissions}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Pending Reviews</span>
                        <span className="font-bold text-yellow-400">{stats.pendingReviews}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Completion Rate</span>
                          <span className="text-white">
                            {stats.totalParticipants > 0 ? Math.round((stats.completedParticipants / stats.totalParticipants) * 100) : 0}%
                          </span>
                        </div>
                        <Progress
                          value={stats.totalParticipants > 0 ? (stats.completedParticipants / stats.totalParticipants) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {quest.status === 'active' && (
                <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
                  <CardHeader>
                    <CardTitle>Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Participants / Winners</span>
                        <span className="text-white">
                          {quest.totalParticipants} / {quest.participantLimit} winners
                        </span>
                      </div>
                      <Progress
                        value={Math.min((quest.totalParticipants / quest.participantLimit) * 100, 100)}
                        className="h-3"
                      />
                      <p className="text-xs text-gray-500">Unlimited users can participate</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <div className="space-y-4">
            {quest.tasks && quest.tasks.length > 0 ? (
              quest.tasks.map((task, index) => (
                <Card key={task._id} className="bg-black/60 backdrop-blur-xl border-purple-800/30">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="outline" className="text-purple-400 border-purple-600">
                            Task {task.order}
                          </Badge>
                          <Badge className={`${task.isRequired ? 'bg-red-600' : 'bg-blue-600'} text-white`}>
                            {task.isRequired ? 'Required' : 'Optional'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.taskType.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{task.title}</h3>
                        <p className="text-gray-300 mb-4">{task.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Completed by: {task.completedBy} participants</span>
                          {task.completedBy > 0 && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              <span>{Math.round((task.completedBy / quest.totalParticipants) * 100)}% completion rate</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
                <CardContent className="p-12 text-center">
                  <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Tasks Defined</h3>
                  <p className="text-gray-400">This quest doesn't have any tasks defined.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants">
          <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
            <CardHeader>
              <CardTitle>Quest Participants ({quest.totalParticipants})</CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length > 0 ? (
                <div className="space-y-4">
                  {participants.map((participant) => (
                    <div key={participant._id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Image
                          src={participant.userId.profilePic || '/default-avatar.png'}
                          alt={participant.userId.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-white">{participant.userId.name || participant.userId.username}</p>
                          <p className="text-sm text-gray-400">@{participant.userId.username}</p>
                          <p className="text-xs text-gray-500">
                            Joined: {formatDate(participant.joinedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Tasks Completed</p>
                          <p className="font-bold text-white">
                            {participant.totalTasksCompleted} / {quest.tasks?.length || 0}
                          </p>
                        </div>
                        <Badge className={`${getParticipantStatusColor(participant.status)} text-white`}>
                          {participant.status}
                        </Badge>
                        {participant.isWinner && (
                          <Crown className="h-5 w-5 text-yellow-400" />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-600">
                            <DropdownMenuItem
                              onClick={() => viewParticipantDetails(participant)}
                              className="text-white hover:bg-gray-700"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-600" />
                            <DropdownMenuItem
                              onClick={() => disqualifyParticipant(participant._id, "Manual disqualification")}
                              className="text-red-400 hover:bg-gray-700"
                              disabled={participant.status === 'disqualified'}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Disqualify
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalParticipantsPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setParticipantsPage(prev => Math.max(1, prev - 1))}
                        disabled={participantsPage === 1}
                        className="border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-4 text-gray-400">
                        Page {participantsPage} of {totalParticipantsPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setParticipantsPage(prev => Math.min(totalParticipantsPages, prev + 1))}
                        disabled={participantsPage === totalParticipantsPages}
                        className="border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No participants yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
              <CardHeader>
                <CardTitle>Participation Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quest.tasks?.map((task, index) => (
                    <div key={task._id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{task.title}</span>
                        <span className="text-white">
                          {task.completedBy} / {quest.totalParticipants} ({Math.round((task.completedBy / Math.max(quest.totalParticipants, 1)) * 100)}%)
                        </span>
                      </div>
                      <Progress value={(task.completedBy / Math.max(quest.totalParticipants, 1)) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
              <CardHeader>
                <CardTitle>Quest Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-2">
                      {stats ? Math.round((stats.completedParticipants / Math.max(stats.totalParticipants, 1)) * 100) : 0}%
                    </div>
                    <p className="text-gray-400">Overall Completion Rate</p>
                  </div>

                  {stats && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Sign-ups</span>
                        <span className="text-white font-medium">{stats.totalParticipants}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Completed</span>
                        <span className="text-green-400 font-medium">{stats.completedParticipants}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">In Progress</span>
                        <span className="text-blue-400 font-medium">
                          {stats.totalParticipants - stats.completedParticipants}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Pending Reviews</span>
                        <span className="text-yellow-400 font-medium">{stats.pendingReviews}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Participant Details Modal */}
      <Dialog open={!!selectedParticipant} onOpenChange={() => setSelectedParticipant(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Participant Details</DialogTitle>
            <DialogDescription className="text-gray-300">
              View participant progress and submission details
            </DialogDescription>
          </DialogHeader>
          {selectedParticipant && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Image
                  src={selectedParticipant.userId.profilePic || '/default-avatar.png'}
                  alt={selectedParticipant.userId.username}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedParticipant.userId.name || selectedParticipant.userId.username}
                  </h3>
                  <p className="text-gray-400">@{selectedParticipant.userId.username}</p>
                  <p className="text-sm text-gray-500">{selectedParticipant.userId.email}</p>
                  {selectedParticipant.walletAddress && (
                    <p className="text-xs text-gray-500 font-mono">{selectedParticipant.walletAddress}</p>
                  )}
                </div>
                <Badge className={`${getParticipantStatusColor(selectedParticipant.status)} text-white ml-auto`}>
                  {selectedParticipant.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Joined At:</span>
                  <p className="text-white">{formatDate(selectedParticipant.joinedAt)}</p>
                </div>
                {selectedParticipant.completedAt && (
                  <div>
                    <span className="text-gray-400">Completed At:</span>
                    <p className="text-white">{formatDate(selectedParticipant.completedAt)}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Tasks Completed:</span>
                  <p className="text-white">{selectedParticipant.totalTasksCompleted} / {quest.tasks?.length || 0}</p>
                </div>
                <div>
                  <span className="text-gray-400">Winner Status:</span>
                  <p className={selectedParticipant.isWinner ? "text-yellow-400" : "text-gray-400"}>
                    {selectedParticipant.isWinner ? "Winner" : "Not selected"}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-semibold text-white mb-3">Task Submissions</h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {quest.tasks?.map((task) => {
                      const submission = selectedParticipant.submissions?.find((s) => {
                        const sTaskId = typeof s.taskId === 'object' && s.taskId !== null && '_id' in s.taskId
                          ? (s.taskId as { _id: string })._id
                          : s.taskId;
                        return String(sTaskId) === String(task._id);
                      });

                      const submissionData = submission?.submissionData;

                      return (
                        <div key={task._id} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-gray-200">{task.title}</p>
                              <span className="text-xs text-gray-500 uppercase tracking-wider">{task.taskType.replace('_', ' ')}</span>
                            </div>
                            {submission ? (
                              <div className="flex flex-col items-end">
                                <Badge className="bg-green-600/20 text-green-400 border-green-600/30 mb-1">Completed</Badge>
                                <span className="text-[10px] text-gray-500">
                                  {new Date(submission.submittedAt as string).toLocaleDateString()}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-gray-500 border-gray-700">Pending</Badge>
                            )}
                          </div>

                          {submission && (
                            <div className="mt-2 text-sm bg-black/20 p-2 rounded">
                              <p className="text-xs text-gray-500 mb-1">Submission Details:</p>

                              {submissionData ? (
                                <>
                                  {submissionData.imageUrl && (
                                    <div className="relative group mt-1">
                                      <a href={submissionData.imageUrl} target="_blank" rel="noopener noreferrer" className="block">
                                        <Image src={submissionData.imageUrl} alt="Proof" className="w-full h-32 object-cover rounded border border-gray-700" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                                          <ExternalLink className="w-5 h-5 text-white" />
                                        </div>
                                      </a>
                                    </div>
                                  )}

                                  {submissionData.twitterUrl && (
                                    <a href={submissionData.twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-400 hover:text-blue-300 break-all mt-1">
                                      <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                                      {submissionData.twitterUrl}
                                    </a>
                                  )}

                                  {submissionData.text && (
                                    <p className="text-gray-300 mt-1 p-2 bg-gray-900/50 rounded">{submissionData.text}</p>
                                  )}

                                  {submissionData.linkUrl && (
                                    <a href={submissionData.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-400 hover:text-blue-300 truncate mt-1">
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      {submissionData.linkUrl}
                                    </a>
                                  )}

                                  {(task.taskType === 'join_community' || task.taskType === 'follow_user') && (
                                    <div className="text-gray-300 flex items-center mt-1">
                                      <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                                      <span>ID Verified: {submissionData.communityName || submissionData.targetUsername || 'Success'}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-gray-400 italic text-xs">
                                  Task marked as completed but no details provided.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedParticipant && confirm("Are you sure you want to disqualify this participant?")) {
                    disqualifyParticipant(selectedParticipant._id, "Verification failed");
                    setSelectedParticipant(null);
                  }
                }}
              >
                <UserX className="w-4 h-4 mr-2" />
                Disqualify
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedParticipant(null)}
                className="border-gray-600 text-gray-400"
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}