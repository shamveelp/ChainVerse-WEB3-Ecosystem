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
import { ArrowLeft, Users, Trophy, Calendar, Target, Clock, Coins, Award, CheckCircle, Upload, Link, Image as ImageIcon, Twitter, Wallet, Crown, Star, TrendingUp, Copy, ExternalLink, Loader2, AlertCircle, Info, Timer, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { userQuestApiService } from '@/services/quests/userQuestApiService';
import Navbar from '@/components/home/navbar';
import { useAuth } from '@/hooks/useAuth';
import {
  Quest,
  QuestTask,
  ParticipationStatus,
  QuestStats,
  LeaderboardParticipant
} from "@/types/quests/user.types";
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
import Image from 'next/image';

// Local interfaces for state that might differ slightly or for internal use
interface LeaderboardParticipantLocal extends LeaderboardParticipant {
  // Add any local-only properties if needed, otherwise just use imported
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardParticipant[]>([]);
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [leaderboardPages, setLeaderboardPages] = useState(1);
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

        // Fetch leaderboard if quest supports it
        if (questResponse.data.selectionMethod === 'leaderboard') {
          await fetchLeaderboard();
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: questResponse.error || "Failed to load quest details",
        });
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

  const fetchLeaderboard = async (page: number = 1) => {
    try {
      const response = await userQuestApiService.getQuestLeaderboard(questId, { page, limit: 10 });
      if (response.success && response.data) {
        setLeaderboard(response.data.participants || []);
        setLeaderboardPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    }
  };

  const handleJoinQuest = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login to join quests",
      });
      router.push('/auth/login');
      return;
    }

    setJoining(true);
    try {
      const response = await userQuestApiService.joinQuest(questId, walletAddress);
      if (response.success) {
        toast({
          title: "🎉 Quest Joined Successfully!",
          description: response.data?.message || "You can now start completing tasks to earn rewards!",
        });
        await fetchQuestData(); // Refresh data
      } else {
        throw new Error(response.error || "Failed to join quest");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred while joining the quest"
      toast({
        variant: "destructive",
        title: "Failed to Join Quest",
        description: message,
      });
    } finally {
      setJoining(false);
    }
  };

  const handleTaskSubmission = async () => {
    if (!selectedTask) return;

    // Prepare data for validation
    const validationData: Record<string, unknown> = {
      text: submissionText,
      linkUrl: submissionLink,
      imageUrl: submissionImageUrl,
      twitterUrl: submissionLink,
      walletAddress: submissionText,
    };

    // Add specific fields based on task type
    if (selectedTask.taskType === 'join_community') {
      const commId = selectedTask.config?.communityId || quest?.communityId;
      validationData.communityId = (typeof commId === 'object' && commId !== null) ? (commId as { _id: string })._id : commId;
    } else if (selectedTask.taskType === 'follow_user') {
      const userId = selectedTask.config?.targetUserId;
      validationData.targetUserId = (typeof userId === 'object' && userId !== null) ? (userId as { _id: string })._id : userId;
    }

    // Validate submission data
    const validationResult = userQuestApiService.validateTaskSubmissionData(selectedTask.taskType, validationData);

    if (!validationResult.valid) {
      toast({
        variant: "destructive",
        title: "Invalid Submission",
        description: validationResult.message,
      });
      return;
    }

    setSubmitting(selectedTask._id);
    try {
      let finalImageUrl = "";

      // Upload image if provided
      if (submissionImage) {
        const uploadResponse = await userQuestApiService.uploadTaskMedia(submissionImage);
        if (uploadResponse.success && uploadResponse.data) {
          finalImageUrl = uploadResponse.data.mediaUrl;
        } else {
          throw new Error("Failed to upload image");
        }
      }

      // Prepare submission data based on task type
      const submissionData: {
        text?: string;
        linkUrl?: string;
        imageUrl?: string;
        twitterUrl?: string;
        walletAddress?: string;
        communityId?: string;
        targetUserId?: string;
      } = {};

      switch (selectedTask.taskType) {
        case 'upload_screenshot':
          submissionData.imageUrl = finalImageUrl;
          submissionData.text = submissionText;
          break;
        case 'twitter_post':
          submissionData.twitterUrl = submissionLink;
          submissionData.text = submissionText;
          break;
        case 'wallet_connect':
          submissionData.walletAddress = submissionText;
          break;
        case 'join_community':
          submissionData.communityId = validationData.communityId as string;
          submissionData.text = submissionText;
          submissionData.imageUrl = finalImageUrl;
          break;
        case 'follow_user':
          submissionData.targetUserId = validationData.targetUserId as string;
          submissionData.text = submissionText;
          submissionData.imageUrl = finalImageUrl;
          break;
        case 'custom':
          submissionData.text = submissionText;
          submissionData.linkUrl = submissionLink;
          submissionData.imageUrl = finalImageUrl;
          break;
        default:
          submissionData.text = submissionText;
          submissionData.linkUrl = submissionLink;
          submissionData.imageUrl = finalImageUrl;
      }

      const response = await userQuestApiService.submitTask(questId, selectedTask._id, submissionData);
      if (response.success) {
        toast({
          title: "✅ Task Submitted Successfully!",
          description: response.message || "Your task submission has been recorded!",
        });
        setShowTaskModal(false);
        resetSubmissionForm();
        await fetchQuestData(); // Refresh data
      } else {
        throw new Error(response.error || "Failed to submit task");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit task. Please try again."
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: message,
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
    if (!task.canSubmit) {
      toast({
        variant: "destructive",
        title: "Task Already Completed",
        description: "You have already submitted this task.",
      });
      return;
    }

    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Please select an image smaller than 5MB",
        });
        return;
      }

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

  const formatTimeRemaining = (timeRemaining?: { days: number; hours: number; minutes: number; hasEnded: boolean }) => {
    if (!timeRemaining || timeRemaining.hasEnded) return "Quest has ended";

    const { days, hours, minutes } = timeRemaining;
    if (days > 0) return `${days} days, ${hours} hours remaining`;
    if (hours > 0) return `${hours} hours, ${minutes} minutes remaining`;
    return `${minutes} minutes remaining`;
  };

  const isQuestActive = () => {
    if (!quest) return false;
    const now = new Date();
    return quest.status === 'active' && new Date(quest.startDate) <= now && new Date(quest.endDate) > now;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Quest Not Found</h1>
          <Button onClick={() => router.push('/user/quests')}>Back to Quests</Button>
        </div>
      </div>
    );
  }

  const progress = participationStatus?.totalTasksCompleted && tasks.length > 0
    ? (participationStatus.totalTasksCompleted / tasks.length) * 100
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 font-sans selection:bg-white/20">
      <Navbar />

      <main className="container mx-auto px-4 pb-8 pt-28 md:pt-32 max-w-7xl">
        {/* Breadcrumb / Back Navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/user/quests')}
            className="text-gray-400 hover:text-white hover:bg-white/5 pl-0 gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Quests
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN - Main Content */}
          <div className="lg:col-span-8 space-y-8">

            {/* 1. Hero / Banner Section */}
            <div className="relative group rounded-3xl overflow-hidden border border-white/5 bg-slate-900/50">
              {quest.bannerImage ? (
                <div className="aspect-[21/9] w-full relative">
                  <Image
                    src={quest.bannerImage}
                    alt={quest.title}
                    fill
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                </div>
              ) : (
                <div className="aspect-[21/9] w-full bg-slate-900 flex items-center justify-center">
                  <Trophy className="h-20 w-20 text-white/5" />
                </div>
              )}

              <div className="absolute top-4 right-4 flex gap-2">
                <Badge className={`backdrop-blur-md shadow-lg border-0 ${quest.status === 'active' ? 'bg-green-500/90 text-black' :
                  quest.status === 'ended' ? 'bg-gray-500/90 text-white' :
                    'bg-blue-500/90 text-white'
                  }`}>
                  {quest.status.toUpperCase()}
                </Badge>
                {quest.isAIGenerated && (
                  <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-blue-400/50 text-blue-300">
                    <Star className="w-3 h-3 mr-1" /> AI Generated
                  </Badge>
                )}
              </div>
            </div>

            {/* 2. Title & Community Header */}
            <div className="flex gap-5 items-start">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-[#202020] border-4 border-[#0b0b0b] overflow-hidden shadow-xl -mt-10 relative z-10 flex items-center justify-center">
                  {quest.community ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={quest.community.logo}
                        alt={quest.community.communityName}
                        fill
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <Users className="h-8 w-8 text-gray-600" />
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                  {quest.title}
                </h1>

                {quest.community && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-sm font-medium hover:text-white transition-colors cursor-pointer">
                      {quest.community.communityName}
                    </span>
                    <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-gray-300">
                      @{quest.community.username}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Main Tabs & Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-transparent border-b border-white/10 w-full justify-start h-auto p-0 gap-8 rounded-none">
                {['Overview', 'Tasks', 'Leaderboard'].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab.toLowerCase()}
                    disabled={tab === 'Tasks' && !participationStatus?.isParticipating}
                    className="
                      rounded-none border-b-2 border-transparent px-0 py-4 
                      data-[state=active]:border-white data-[state=active]:bg-transparent 
                      data-[state=active]:text-white text-slate-500 font-medium text-base
                      hover:text-gray-300 transition-colors
                    "
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-8 min-h-[400px]">
                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="prose prose-invert max-w-none">
                    <h3 className="text-xl font-semibold mb-3">About this Quest</h3>
                    <p className="text-gray-300 leading-relaxed text-lg">
                      {quest.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-slate-900/50 border-white/5 hover:border-white/10 transition-colors">
                      <CardContent className="p-5 flex items-start gap-4">
                        <div className="p-3 bg-white/5 rounded-xl">
                          <Trophy className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Rewards</p>
                          <p className="text-xl font-bold text-white">
                            {quest.rewardPool.amount} <span className="text-slate-300">{quest.rewardPool.currency}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {quest.rewardPool.rewardType.toUpperCase()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-white/5 hover:border-white/10 transition-colors">
                      <CardContent className="p-5 flex items-start gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                          <Target className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Method</p>
                          <p className="text-xl font-bold text-white capitalize">
                            {quest.selectionMethod.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Limit: {quest.participantLimit} Winners
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* TASKS TAB */}
                <TabsContent value="tasks" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Your Tasks</h3>
                    <span className="text-sm text-gray-400">
                      {participationStatus?.totalTasksCompleted || 0} / {tasks.length} Completed
                    </span>
                  </div>

                  {/* Task Progress Bar */}
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-8">
                    <div
                      className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task._id}
                        className={`
                               group relative rounded-xl border p-5 transition-all duration-300
                               ${task.isCompleted
                            ? 'bg-[#121212] border-green-900/30'
                            : 'bg-slate-900/50 border-white/5 hover:border-white/20 hover:bg-slate-900'
                          }
                            `}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`
                                  shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                                  ${task.isCompleted ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'}
                               `}>
                            {task.isCompleted ? <CheckCircle className="h-5 w-5" /> : getTaskIcon(task.taskType)}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-semibold ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                                {task.title}
                              </h4>
                              {task.isRequired && !task.isCompleted && (
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-red-900/50 text-red-400 bg-red-950/10">Required</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 max-w-2xl">{task.description}</p>
                          </div>

                          <div className="shrink-0 flex items-center gap-3">
                            {task.privilegePoints && (
                              <div className="text-xs font-mono text-slate-300 bg-white/5 px-2 py-1 rounded">
                                +{task.privilegePoints} PTS
                              </div>
                            )}

                            {task.isCompleted ? (
                              <Button size="sm" variant="ghost" className="text-green-500 hover:text-green-600 hover:bg-green-950/20" disabled>
                                Completed
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-white text-black hover:bg-gray-200 font-semibold"
                                onClick={() => openTaskModal(task)}
                              >
                                Start
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* LEADERBOARD TAB */}
                <TabsContent value="leaderboard" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="rounded-xl border border-white/5 overflow-hidden bg-slate-900/50">
                    <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                      <div className="col-span-1 text-center">Rank</div>
                      <div className="col-span-5">User</div>
                      <div className="col-span-3 text-right">Points</div>
                      <div className="col-span-3 text-right">Tasks</div>
                    </div>

                    <div className="divide-y divide-white/5">
                      {leaderboard.length > 0 ? leaderboard.map((participant) => (
                        <div key={participant._id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                          <div className="col-span-1 text-center font-mono text-gray-400">
                            {participant.rank <= 3 ? (
                              <span className={`flex items-center justify-center w-6 h-6 rounded-full mx-auto ${participant.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                                participant.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                                  'bg-orange-500/20 text-orange-500'
                                }`}>
                                {participant.rank}
                              </span>
                            ) : `#${participant.rank}`}
                          </div>
                          <div className="col-span-5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                              {participant.userId.profilePic ? (
                                <Image
                                  src={participant.userId.profilePic}
                                  alt={participant.userId.username}
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-white">{participant.userId.username[0].toUpperCase()}</span>
                              )}
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-medium text-white truncate">{participant.userId.name}</p>
                              <p className="text-xs text-gray-500 truncate">@{participant.userId.username}</p>
                            </div>
                          </div>
                          <div className="col-span-3 text-right font-mono text-white">
                            {participant.totalPrivilegePoints}
                          </div>
                          <div className="col-span-3 text-right text-gray-400 text-sm">
                            {participant.totalTasksCompleted}
                          </div>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-gray-500">
                          No participants yet. Be the first!
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* RIGHT COLUMN - Sticky Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* 1. Main Action Card */}
              <Card className="border-white/10 bg-slate-900/50 shadow-none">
                <CardHeader className="pb-2">
                  <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Time Remaining</p>
                  <div className="flex items-center gap-2 text-2xl font-mono text-white">
                    <Clock className="w-6 h-6 text-white" />
                    {formatTimeRemaining(quest.timeRemaining)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Participants</span>
                      <span className="text-white font-medium">{quest.totalParticipants.toLocaleString()}</span>
                    </div>
                    <Progress value={(quest.totalParticipants / quest.participantLimit) * 100} className="h-1.5" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{((quest.totalParticipants / quest.participantLimit) * 100).toFixed(0)}% Full</span>
                      <span>Max: {quest.participantLimit}</span>
                    </div>
                  </div>

                  {/* CTA BUTTON */}
                  {!participationStatus?.isParticipating ? (
                    <Button
                      onClick={handleJoinQuest}
                      disabled={joining || !user || !quest.canJoin}
                      className={`
                              w-full h-14 text-lg font-bold rounded-xl transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                              ${!user
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-white text-black hover:bg-slate-200 shadow-none border border-white/10'
                        }
                           `}
                    >
                      {joining ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Joining...</>
                      ) : !user ? (
                        'Login to Participate'
                      ) : !quest.canJoin ? (
                        'Quest Unavailable'
                      ) : (
                        'Participate Now'
                      )}
                    </Button>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                      <p className="text-green-500 font-semibold flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        You are participating
                      </p>
                      <p className="text-xs text-green-400/70 mt-1">
                        Complete tasks to win
                      </p>
                    </div>
                  )}

                  {/* Share Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button variant="outline" className="border-white/10 hover:bg-white/5 hover:text-white text-gray-400 h-10"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast({ title: "Copied!", description: "Link copied to clipboard" });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" /> Copy Link
                    </Button>
                    <Button variant="outline" className="border-white/10 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 text-gray-400 h-10"
                      onClick={() => {
                        const text = `Join me on this quest: ${quest.title} on ChainVerse! 🚀`;
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
                      }}
                    >
                      <Twitter className="h-4 w-4 mr-2" /> Tweet
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 2. Requirements / Info */}
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 space-y-4">
                <h4 className="font-semibold text-white">Requirements</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-gray-400">
                    <div className="mt-0.5 p-1 bg-white/5 rounded-full"><Users className="h-3 w-3" /></div>
                    <span>Must strictly follow validation rules</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-400">
                    <div className="mt-0.5 p-1 bg-white/5 rounded-full"><Trophy className="h-3 w-3" /></div>
                    <span>Winners selected via {quest.selectionMethod}</span>
                  </li>
                  {quest.rewardPool.rewardType === 'token' && (
                    <li className="flex items-start gap-3 text-sm text-gray-400">
                      <div className="mt-0.5 p-1 bg-white/5 rounded-full"><Wallet className="h-3 w-3" /></div>
                      <span>Wallet required for token distribution</span>
                    </li>
                  )}
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* Task Submission Modal */}
        <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
          <DialogContent className="bg-slate-950 border-white/10 text-white sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-lg text-white">
                  <Target className="h-5 w-5" />
                </div>
                Complete Task
              </DialogTitle>
              <DialogDescription className="text-gray-400 pt-2 text-base">
                {selectedTask?.title}
              </DialogDescription>
            </DialogHeader>

            {selectedTask && (
              <div className="space-y-6 py-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Instructions</h5>
                  <p className="text-gray-300 leading-relaxed">{selectedTask.description}</p>
                </div>

                {/* Dynamic Instructions */}
                <div className="space-y-4">
                  <Label className="text-white text-xs uppercase font-bold tracking-wider">
                    Action Required
                  </Label>
                  <div className="text-sm text-gray-300">
                    {String(userQuestApiService.getTaskTypeInstructions(selectedTask.taskType, selectedTask.config || {}))}
                  </div>
                </div>

                {/* Inputs based on task type */}
                <div className="space-y-4 pt-2">
                  {selectedTask.taskType === 'upload_screenshot' && (
                    <div className="space-y-3">
                      <Label className="text-white">Upload Proof</Label>
                      <div className="border-2 border-dashed border-gray-700 hover:border-white/50 rounded-xl p-8 text-center transition-colors bg-white/5">
                        <Input
                          id="task-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Label htmlFor="task-image" className="cursor-pointer block w-full h-full">
                          {submissionImageUrl ? (
                            <Image
                              src={submissionImageUrl}
                              alt="Preview"
                              width={400}
                              height={300}
                              className="max-h-48 mx-auto rounded-lg shadow-lg object-contain"
                            />
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                              <p className="text-sm text-gray-400">Click to upload screenshot</p>
                            </div>
                          )}
                        </Label>
                      </div>

                      <Label className="text-white">Notes (Optional)</Label>
                      <Textarea
                        placeholder="Add any additional details..."
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        className="bg-[#0f0f0f] border-gray-800 text-white min-h-[80px]"
                      />
                    </div>
                  )}

                  {selectedTask.taskType === 'twitter_post' && (
                    <div className="space-y-3">
                      <Label className="text-white">Tweet URL</Label>
                      <Input
                        placeholder="https://twitter.com/..."
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        className="bg-slate-900 border-white/10 text-white h-12"
                      />
                    </div>
                  )}

                  {(selectedTask.taskType === 'join_community' || selectedTask.taskType === 'follow_user') && (
                    <div className="space-y-4">
                      {(!!selectedTask.config?.communityId || !!quest?.communityId || !!selectedTask.config?.targetUserId) ? (
                        <Button
                          className="w-full bg-white text-black hover:bg-slate-200 h-12 gap-2"
                          onClick={() => {
                            let url = '#';
                            if (selectedTask.taskType === 'join_community') {
                              const configComm = selectedTask.config?.communityId as Record<string, unknown> | string | undefined;
                              const isConfigObject = typeof configComm === 'object' && configComm !== null;

                              // Try to get username
                              let communityUsername = isConfigObject ? (configComm as Record<string, unknown>).username as string : undefined;

                              if (!communityUsername) {
                                // Try quest community
                                if (quest?.community?.username) {
                                  communityUsername = quest.community.username;
                                } else if (quest?.communityId && typeof quest.communityId === 'object' && (quest.communityId as Record<string, unknown>).username) {
                                  communityUsername = (quest.communityId as Record<string, unknown>).username as string;
                                }
                              }

                              if (communityUsername) {
                                url = `/user/community/c/${communityUsername}`;
                              } else {
                                // Fallback to ID
                                let id = isConfigObject ? (configComm as Record<string, unknown>)._id as string : configComm as string;
                                if (!id && quest?.communityId) {
                                  id = typeof quest.communityId === 'object' ? (quest.communityId as Record<string, unknown>)._id as string : quest.communityId as string;
                                }
                                if (id) url = `/user/community/c/${id}`;
                              }
                            } else {
                              // follow_user
                              const config = selectedTask.config || {};
                              let username = config.targetUsername;

                              if (!username) {
                                const targetUser = config.targetUserId;
                                if (targetUser && typeof targetUser === 'object' && (targetUser as Record<string, unknown>).username) {
                                  username = (targetUser as Record<string, unknown>).username as string;
                                } else if (typeof targetUser === 'string') {
                                  // Fallback: If it's a string, it might be ID or username.
                                  // We prefer not to link if it's an ID, but if we must...
                                  // Let's assume if it looks like an ID, we try to use it, but really we want the username.
                                  // If the user *entered* a username as targetUserId (legacy data?), it works.
                                  username = targetUser;
                                }
                              }

                              if (username) url = `/user/community/${username}`;
                            }

                            if (url !== '#') window.open(url, '_blank');
                          }}
                        >
                          {selectedTask.taskType === 'join_community' ? <Users className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                          {selectedTask.taskType === 'join_community' ? 'Go to Community' : 'Go to Profile'}
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </Button>
                      ) : null}

                      <div className="space-y-2">
                        <Label className="text-white">Verify Username</Label>
                        <Input
                          placeholder="Your username"
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                          className="bg-slate-900 border-white/10 text-white h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Proof Screenshot (Optional)</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="bg-[#0f0f0f] border-gray-800 text-white"
                        />
                      </div>
                    </div>
                  )}

                  {selectedTask.taskType === 'wallet_connect' && (
                    <div className="space-y-3">
                      <Label className="text-white">Wallet Address</Label>
                      <Input
                        placeholder="0x..."
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        className="bg-[#0f0f0f] border-gray-800 text-white h-12 font-mono"
                      />
                    </div>
                  )}

                  {selectedTask.taskType === 'custom' && (
                    <div className="space-y-3">
                      <Label className="text-white">Response</Label>
                      <Textarea
                        placeholder="Type your answer..."
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        className="bg-[#0f0f0f] border-gray-800 text-white min-h-[100px]"
                      />
                      <Label className="text-white">Link (Optional)</Label>
                      <Input
                        placeholder="https://..."
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        className="bg-slate-900 border-white/10 text-white h-12"
                      />
                      <Label className="text-white">Image (Optional)</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="bg-[#0f0f0f] border-gray-800 text-white"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTaskModal(false);
                      resetSubmissionForm();
                    }}
                    className="flex-1 border-white/10 hover:bg-white/5 text-gray-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTaskSubmission}
                    disabled={submitting === selectedTask._id}
                    className="flex-1 bg-white text-black hover:bg-gray-200 font-bold"
                  >
                    {submitting === selectedTask._id ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                    ) : (
                      'Verify & Submit'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}