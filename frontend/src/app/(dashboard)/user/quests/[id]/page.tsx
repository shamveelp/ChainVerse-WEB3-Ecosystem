"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, Trophy, Calendar, Target, Clock, Coins, Award, CircleCheck as CheckCircle, Upload, Link, Image as ImageIcon, Twitter, Wallet, Crown, Star, TrendingUp, Copy, ExternalLink, Loader as Loader2, CircleAlert as AlertCircle, Info } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { userQuestApiService } from '@/services/quests/userQuestApiService';
import Navbar from '@/components/home/navbar';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface Quest {
  _id: string;
  title: string;
  description: string;
  bannerImage?: string;
  startDate: Date;
  endDate: Date;
  selectionMethod: string;
  participantLimit: number;
  rewardPool: {
    amount: number;
    currency: string;
    rewardType: string;
    customReward?: string;
  };
  status: string;
  totalParticipants: number;
  winnersSelected: boolean;
  isAIGenerated?: boolean;
  createdAt: Date;
  community?: {
    communityName: string;
    logo: string;
    username: string;
  };
  tasks?: QuestTask[];
  isParticipating?: boolean;
  participationStatus?: string;
  completedTasks?: number;
}

interface QuestTask {
  _id: string;
  title: string;
  description: string;
  taskType: string;
  isRequired: boolean;
  order: number;
  completedBy: number;
  isCompleted?: boolean;
  submission?: any;
}

interface ParticipationStatus {
  isParticipating: boolean;
  status?: string;
  joinedAt?: Date;
  completedAt?: Date;
  totalTasksCompleted?: number;
  isWinner?: boolean;
  rewardClaimed?: boolean;
}

interface QuestStats {
  totalParticipants: number;
  completedParticipants: number;
  inProgressParticipants: number;
  winnerCount: number;
  completionRate: number;
}

export default function QuestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const questId = params.id as string;

  const [quest, setQuest] = useState<Quest | null>(null);
  const [tasks, setTasks] = useState<QuestTask[]>([]);
  const [participationStatus, setParticipationStatus] = useState<ParticipationStatus | null>(null);
  const [stats, setStats] = useState<QuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTask, setSelectedTask] = useState<QuestTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // Task submission states
  const [submissionText, setSubmissionText] = useState("");
  const [submissionLink, setSubmissionLink] = useState("");
  const [submissionImage, setSubmissionImage] = useState<File | null>(null);
  const [submissionImageUrl, setSubmissionImageUrl] = useState("");

  useEffect(() => {
    if (questId) {
      fetchQuestData();
    }
  }, [questId]);

  const fetchQuestData = async () => {
    setLoading(true);
    try {
      const [questResponse, statsResponse] = await Promise.all([
        userQuestApiService.getQuest(questId),
        userQuestApiService.getQuestStats(questId)
      ]);

      if (questResponse.success && questResponse.data) {
        setQuest(questResponse.data);

        if (user) {
          // Check participation status
          const statusResponse = await userQuestApiService.checkParticipationStatus(questId);
          if (statusResponse.success && statusResponse.data) {
            setParticipationStatus(statusResponse.data);

            // If participating, get tasks
            if (statusResponse.data.isParticipating) {
              const tasksResponse = await userQuestApiService.getQuestTasks(questId);
              if (tasksResponse.success && tasksResponse.data) {
                setTasks(tasksResponse.data);
              }
            }
          }
        }
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch quest data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load quest details",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQuest = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login to join quests",
      });
      return;
    }

    setJoining(true);
    try {
      const response = await userQuestApiService.joinQuest(questId, walletAddress);
      if (response.success) {
        toast({
          title: "Success",
          description: response.data?.message || "Successfully joined quest!",
        });
        fetchQuestData(); // Refresh data
      } else {
        throw new Error(response.error || "Failed to join quest");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to join quest",
      });
    } finally {
      setJoining(false);
    }
  };

  const handleTaskSubmission = async () => {
    if (!selectedTask) return;

    setSubmitting(selectedTask._id);
    try {
      let imageUrl = submissionImageUrl;

      // Upload image if provided
      if (submissionImage) {
        const uploadResponse = await userQuestApiService.uploadTaskMedia(submissionImage);
        if (uploadResponse.success && uploadResponse.data) {
          imageUrl = uploadResponse.data.mediaUrl;
        } else {
          throw new Error("Failed to upload image");
        }
      }

      // Prepare submission data based on task type
      const submissionData: any = {};

      switch (selectedTask.taskType) {
        case 'upload_screenshot':
          submissionData.imageUrl = imageUrl;
          submissionData.text = submissionText;
          break;
        case 'twitter_post':
          submissionData.twitterUrl = submissionLink;
          submissionData.text = submissionText;
          break;
        case 'wallet_connect':
          submissionData.walletAddress = submissionText;
          break;
        case 'custom':
          submissionData.text = submissionText;
          submissionData.linkUrl = submissionLink;
          submissionData.imageUrl = imageUrl;
          break;
        default:
          submissionData.text = submissionText;
          submissionData.linkUrl = submissionLink;
          submissionData.imageUrl = imageUrl;
      }

      const response = await userQuestApiService.submitTask(questId, selectedTask._id, submissionData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Task submitted successfully!",
        });
        setShowTaskModal(false);
        resetSubmissionForm();
        fetchQuestData(); // Refresh data
      } else {
        throw new Error(response.error || "Failed to submit task");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit task",
      });
    } finally {
      setSubmitting(null);
    }
  };

  const resetSubmissionForm = () => {
    setSubmissionText("");
    setSubmissionLink("");
    setSubmissionImage(null);
    setSubmissionImageUrl("");
    setSelectedTask(null);
  };

  const openTaskModal = (task: QuestTask) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSubmissionImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setSubmissionImageUrl(e.target?.result as string);
      reader.readAsDataURL(file);
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
      case "token": return <Coins className="h-5 w-5" />;
      case "nft": return <Award className="h-5 w-5" />;
      case "points": return <Target className="h-5 w-5" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case "twitter_post": return <Twitter className="h-4 w-4" />;
      case "upload_screenshot": return <ImageIcon className="h-4 w-4" />;
      case "wallet_connect": return <Wallet className="h-4 w-4" />;
      case "custom": return <Target className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
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

  const isQuestActive = () => {
    if (!quest) return false;
    const now = new Date();
    return quest.status === 'active' && new Date(quest.startDate) <= now && new Date(quest.endDate) > now;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700 rounded w-1/4"></div>
            <div className="h-64 bg-gray-700 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-700 rounded"></div>
              <div className="h-96 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Quest Not Found</h1>
          <Button onClick={() => router.push('/user/quests')} className="bg-purple-600 hover:bg-purple-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quests
          </Button>
        </div>
      </div>
    );
  }

  const progress = participationStatus?.totalTasksCompleted && tasks.length > 0
    ? (participationStatus.totalTasksCompleted / tasks.length) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/user/quests')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quests
          </Button>
        </div>

        {/* Quest Hero */}
        <div className="space-y-6">
          {quest.bannerImage ? (
            <div className="w-full h-80 rounded-2xl overflow-hidden relative">
              <img
                src={quest.bannerImage}
                alt={quest.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Quest Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-end justify-between">
                  <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getStatusColor(quest.status)} text-white`}>
                        {quest.status}
                      </Badge>
                      {quest.isAIGenerated && (
                        <Badge variant="outline" className="border-blue-500 text-blue-400 bg-blue-950/30">
                          AI Generated
                        </Badge>
                      )}
                      {participationStatus?.isParticipating && (
                        <Badge className="bg-green-600 text-white">
                          Joined
                        </Badge>
                      )}
                    </div>

                    <h1 className="text-4xl font-bold text-white">{quest.title}</h1>
                    <p className="text-gray-200 text-lg">{quest.description}</p>

                    {quest.community && (
                      <div className="flex items-center gap-3">
                        <img
                          src={quest.community.logo}
                          alt={quest.community.communityName}
                          className="w-10 h-10 rounded-full border-2 border-white/20"
                        />
                        <div>
                          <p className="text-white font-medium">{quest.community.communityName}</p>
                          <p className="text-gray-300 text-sm">@{quest.community.username}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress indicator for participating users */}
                  {participationStatus?.isParticipating && (
                    <div className="text-right">
                      <p className="text-white font-medium">Progress: {progress.toFixed(0)}%</p>
                      <div className="w-48 bg-gray-700 rounded-full h-3 mt-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // No banner image - show quest info in a card
            <Card className="bg-black/40 backdrop-blur-xl border-purple-800/30">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(quest.status)} text-white`}>
                      {quest.status}
                    </Badge>
                    {quest.isAIGenerated && (
                      <Badge variant="outline" className="border-blue-500 text-blue-400 bg-blue-950/30">
                        AI Generated
                      </Badge>
                    )}
                    {participationStatus?.isParticipating && (
                      <Badge className="bg-green-600 text-white">
                        Joined
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-4xl font-bold text-white">{quest.title}</h1>
                  <p className="text-gray-300 text-lg">{quest.description}</p>

                  {quest.community && (
                    <div className="flex items-center gap-3">
                      <img
                        src={quest.community.logo}
                        alt={quest.community.communityName}
                        className="w-10 h-10 rounded-full border-2 border-purple-600/50"
                      />
                      <div>
                        <p className="text-white font-medium">{quest.community.communityName}</p>
                        <p className="text-gray-400 text-sm">@{quest.community.username}</p>
                      </div>
                    </div>
                  )}

                  {/* Progress indicator for participating users */}
                  {participationStatus?.isParticipating && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">Your Progress</span>
                        <span className="text-white font-medium">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Join Quest Section - Always visible unless already joined */}
          {!participationStatus?.isParticipating && (
            <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-600/50 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">Join this Quest</h3>
                    <p className="text-gray-300">
                      {quest.status === 'active' 
                        ? `Join ${quest.totalParticipants.toLocaleString()} other participants and compete for rewards!`
                        : quest.status === 'ended'
                        ? 'This quest has ended, but you can still view the details.'
                        : quest.status === 'draft'
                        ? 'This quest is still in draft mode.'
                        : 'This quest is not currently active.'
                      }
                    </p>
                    {quest.totalParticipants >= quest.participantLimit && (
                      <p className="text-red-400 text-sm mt-1">
                        ⚠️ Quest is full ({quest.totalParticipants}/{quest.participantLimit} participants)
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-3 min-w-[280px]">
                    {quest.rewardPool.rewardType === 'token' && (
                      <Input
                        placeholder="Wallet address (optional)"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="bg-black/50 border-gray-600 text-white"
                      />
                    )}
                    <Button
                      onClick={handleJoinQuest}
                      disabled={joining || quest.totalParticipants >= quest.participantLimit || !user}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white py-3 px-8"
                      size="lg"
                    >
                      {joining ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Joining...
                        </>
                      ) : !user ? (
                        'Login to Join'
                      ) : quest.totalParticipants >= quest.participantLimit ? (
                        'Quest Full'
                      ) : (
                        'Join Quest Now'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quest Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full max-w-lg grid-cols-3 bg-black/40 backdrop-blur-xl border border-purple-800/30">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="tasks"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
                  disabled={!participationStatus?.isParticipating}
                >
                  Tasks
                </TabsTrigger>
                <TabsTrigger
                  value="leaderboard"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
                >
                  Leaderboard
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Quest Details */}
                <Card className="bg-black/40 backdrop-blur-xl border-purple-800/30">
                  <CardHeader>
                    <CardTitle>Quest Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-400" />
                        <div>
                          <p className="text-xs text-gray-400">Start Date</p>
                          <p className="text-sm font-medium text-white">{formatDate(quest.startDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
                        <Clock className="h-5 w-5 text-purple-400" />
                        <div>
                          <p className="text-xs text-gray-400">End Date</p>
                          <p className="text-sm font-medium text-white">{formatDate(quest.endDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
                        <Users className="h-5 w-5 text-purple-400" />
                        <div>
                          <p className="text-xs text-gray-400">Participants</p>
                          <p className="text-sm font-medium text-white">{quest.totalParticipants.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
                        <Trophy className="h-5 w-5 text-purple-400" />
                        <div>
                          <p className="text-xs text-gray-400">Winners</p>
                          <p className="text-sm font-medium text-white">{quest.participantLimit}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-800/30">
                      <div className="flex items-center gap-3 mb-2">
                        {getRewardTypeIcon(quest.rewardPool.rewardType)}
                        <h3 className="text-lg font-semibold text-white">Reward Pool</h3>
                      </div>
                      <p className="text-2xl font-bold text-purple-400">
                        {quest.rewardPool.amount} {quest.rewardPool.currency}
                      </p>
                      <p className="text-sm text-gray-400">
                        {quest.rewardPool.rewardType === 'custom'
                          ? quest.rewardPool.customReward
                          : `${quest.rewardPool.rewardType.charAt(0).toUpperCase() + quest.rewardPool.rewardType.slice(1)} Reward`
                        }
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Per winner: {(quest.rewardPool.amount / quest.participantLimit).toFixed(2)} {quest.rewardPool.currency}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quest Progress */}
                {participationStatus?.isParticipating && (
                  <Card className="bg-black/40 backdrop-blur-xl border-purple-800/30">
                    <CardHeader>
                      <CardTitle>Your Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Tasks Completed</span>
                        <span className="text-white font-medium">
                          {participationStatus.totalTasksCompleted} / {tasks.length}
                        </span>
                      </div>
                      <Progress value={progress} className="h-3" />

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${participationStatus.status === 'completed' ? 'bg-green-500' :
                              participationStatus.status === 'in_progress' ? 'bg-blue-500' :
                                participationStatus.status === 'winner' ? 'bg-purple-500' :
                                  'bg-gray-500'
                            }`} />
                          <span className="text-gray-400">Status: </span>
                          <span className="text-white font-medium capitalize">{participationStatus.status?.replace('_', ' ')}</span>
                        </div>
                        {participationStatus.isWinner && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Crown className="h-4 w-4" />
                            <span className="font-medium">Winner!</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                {!participationStatus?.isParticipating ? (
                  <Card className="bg-black/40 backdrop-blur-xl border-purple-800/30">
                    <CardContent className="p-8 text-center">
                      <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Join Quest to Access Tasks</h3>
                      <p className="text-gray-400 mb-4">
                        You need to join this quest before you can view and complete tasks.
                      </p>
                    </CardContent>
                  </Card>
                ) : tasks.length === 0 ? (
                  <Card className="bg-black/40 backdrop-blur-xl border-purple-800/30">
                    <CardContent className="p-8 text-center">
                      <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Tasks Available</h3>
                      <p className="text-gray-400">This quest doesn't have any tasks defined yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  tasks.map((task, index) => (
                    <Card key={task._id} className={`bg-black/40 backdrop-blur-xl border-purple-800/30 ${task.isCompleted ? 'border-green-600/50' : ''
                      }`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {getTaskIcon(task.taskType)}
                                <Badge variant="outline" className="text-xs">
                                  Task {task.order}
                                </Badge>
                                <Badge className={`${task.isRequired ? 'bg-red-600' : 'bg-blue-600'} text-white text-xs`}>
                                  {task.isRequired ? 'Required' : 'Optional'}
                                </Badge>
                                {task.isCompleted && (
                                  <Badge className="bg-green-600 text-white text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                            <p className="text-gray-300">{task.description}</p>

                            <div className="text-sm text-gray-400">
                              Completed by {task.completedBy} participants
                            </div>
                          </div>

                          <div className="ml-4">
                            {task.isCompleted ? (
                              <div className="text-right">
                                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                                <p className="text-sm text-green-400">Submitted</p>
                                {task.submission && (
                                  <p className="text-xs text-gray-500">
                                    Status: {task.submission.status}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <Button
                                onClick={() => openTaskModal(task)}
                                disabled={!isQuestActive()}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                              >
                                Complete Task
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="leaderboard" className="space-y-4">
                <Card className="bg-black/40 backdrop-blur-xl border-purple-800/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-400" />
                      Top Participants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((rank) => (
                        <div key={rank} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${rank === 1 ? 'bg-yellow-600 text-white' :
                                rank === 2 ? 'bg-gray-400 text-black' :
                                  rank === 3 ? 'bg-amber-600 text-white' :
                                    'bg-gray-600 text-white'
                              }`}>
                              {rank}
                            </div>
                            <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                            <div>
                              <p className="text-white font-medium">User #{rank}</p>
                              <p className="text-sm text-gray-400">@user{rank}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">{Math.max(0, tasks.length - rank + 1)} tasks</p>
                            <p className="text-sm text-gray-400">
                              {((Math.max(0, tasks.length - rank + 1) / tasks.length) * 100).toFixed(0)}% complete
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quest Stats */}
            {stats && (
              <Card className="bg-black/40 backdrop-blur-xl border-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-lg">Quest Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Participants</span>
                      <span className="text-white font-medium">{stats.totalParticipants.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Completed</span>
                      <span className="text-green-400 font-medium">{stats.completedParticipants.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">In Progress</span>
                      <span className="text-blue-400 font-medium">{stats.inProgressParticipants.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Winners Selected</span>
                      <span className="text-purple-400 font-medium">{stats.winnerCount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-700">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Completion Rate</span>
                      <span className="text-white font-medium">{stats.completionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={stats.completionRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Community Info */}
            {quest.community && (
              <Card className="bg-black/40 backdrop-blur-xl border-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-lg">Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <img
                      src={quest.community.logo}
                      alt={quest.community.communityName}
                      className="w-12 h-12 rounded-full border border-purple-600/50"
                    />
                    <div>
                      <p className="text-white font-medium">{quest.community.communityName}</p>
                      <p className="text-gray-400 text-sm">@{quest.community.username}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
                    onClick={() => router.push(`/communities/${quest.community?.username}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Community
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Share Quest */}
            <Card className="bg-black/40 backdrop-blur-xl border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-lg">Share Quest</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Copied to clipboard!" });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-blue-600/50 text-blue-400 hover:bg-blue-950/30"
                  onClick={() => {
                    const tweetText = `Check out this amazing quest: ${quest.title} on @ChainVerse! 🚀`;
                    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(window.location.href)}`;
                    window.open(tweetUrl, '_blank');
                  }}
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Share on Twitter
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Task Submission Modal */}
        <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Complete Task</DialogTitle>
              <DialogDescription className="text-gray-300">
                {selectedTask?.title}
              </DialogDescription>
            </DialogHeader>

            {selectedTask && (
              <div className="space-y-4">
                <Alert className="bg-blue-950/30 border-blue-600/50">
                  <Info className="h-4 w-4" />
                  <AlertTitle className="text-blue-400">Task Instructions</AlertTitle>
                  <AlertDescription className="text-gray-300">
                    {selectedTask.description}
                  </AlertDescription>
                </Alert>

                {/* Task-specific inputs */}
                {selectedTask.taskType === 'upload_screenshot' && (
                  <div className="space-y-3">
                    <Label htmlFor="task-image" className="text-white">Upload Screenshot *</Label>
                    <Input
                      id="task-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    {submissionImageUrl && (
                      <img src={submissionImageUrl} alt="Preview" className="w-full h-32 object-cover rounded" />
                    )}
                    <Label htmlFor="task-description" className="text-white">Description (Optional)</Label>
                    <Textarea
                      id="task-description"
                      placeholder="Add any additional details..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>
                )}

                {selectedTask.taskType === 'twitter_post' && (
                  <div className="space-y-3">
                    <Label htmlFor="twitter-url" className="text-white">Twitter Post URL *</Label>
                    <Input
                      id="twitter-url"
                      placeholder="https://twitter.com/your-username/status/..."
                      value={submissionLink}
                      onChange={(e) => setSubmissionLink(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    <Label htmlFor="tweet-content" className="text-white">Tweet Content (Optional)</Label>
                    <Textarea
                      id="tweet-content"
                      placeholder="Copy your tweet content here..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>
                )}

                {selectedTask.taskType === 'wallet_connect' && (
                  <div className="space-y-3">
                    <Label htmlFor="wallet-address" className="text-white">Wallet Address *</Label>
                    <Input
                      id="wallet-address"
                      placeholder="0x..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                )}

                {selectedTask.taskType === 'custom' && (
                  <div className="space-y-3">
                    <Label htmlFor="custom-text" className="text-white">Response</Label>
                    <Textarea
                      id="custom-text"
                      placeholder="Provide your response..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      rows={4}
                    />
                    <Label htmlFor="custom-link" className="text-white">Link (Optional)</Label>
                    <Input
                      id="custom-link"
                      placeholder="https://..."
                      value={submissionLink}
                      onChange={(e) => setSubmissionLink(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    <Label htmlFor="custom-image" className="text-white">Image (Optional)</Label>
                    <Input
                      id="custom-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTaskModal(false);
                      resetSubmissionForm();
                    }}
                    className="flex-1 border-gray-600 text-gray-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTaskSubmission}
                    disabled={submitting === selectedTask._id}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {submitting === selectedTask._id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Task'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}