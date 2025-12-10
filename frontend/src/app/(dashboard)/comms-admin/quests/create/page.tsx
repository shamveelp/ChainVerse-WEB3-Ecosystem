"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Bot, Plus, Trash2, Calendar, Users, Trophy, Target, ArrowLeft, Sparkles,
  Upload, Save, Loader2, Check, X, Wand2, Zap, AlertTriangle, Crown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { communityAdminQuestApiService } from '@/services/quests/communityAdminQuestApiService';
import { TaskConfiguration } from '@/components/comms-admin/quests/TaskConfiguration';
import { AIQuestChat } from '@/components/comms-admin/quests/AIQuestChat';
import { QuestAccessGuard } from '@/components/comms-admin/QuestAccessGuard';
import { COMMUNITY_ADMIN_ROUTES } from "@/routes";

type TaskType = 'join_community' | 'follow_user' | 'twitter_post' | 'upload_screenshot' | 'nft_mint' | 'token_hold' | 'wallet_connect' | 'custom';

interface TaskConfig {
  communityId?: string;
  communityName?: string;
  communityUsername?: string;
  targetUserId?: string;
  targetUsername?: string;
  twitterText?: string;
  twitterHashtags?: string[];
  contractAddress?: string;
  tokenId?: string;
  tokenAddress?: string;
  minimumAmount?: number;
  customInstructions?: string;
  requiresProof?: boolean;
  proofType?: 'text' | 'image' | 'link';
  websiteUrl?: string;
}

interface QuestTask {
  title: string;
  description: string;
  taskType: TaskType;
  isRequired: boolean;
  order: number;
  privilegePoints: number; // New field for leaderboard
  config: TaskConfig;
}

interface CreateQuestData {
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
    rewardType: 'token' | 'nft' | 'points' | 'custom';
    customReward?: string;
  };
  tasks: QuestTask[];
  isAIGenerated?: boolean;
  aiPrompt?: string;
}

const taskTypes: Array<{ value: TaskType; label: string; description: string; available: boolean }> = [
  { value: 'join_community', label: 'Join Community', description: 'Members must join a specific community', available: true },
  { value: 'follow_user', label: 'Follow User', description: 'Follow a creator/admin profile', available: true },
  { value: 'twitter_post', label: 'Twitter Post', description: 'Publish a post on X/Twitter', available: true },
  { value: 'upload_screenshot', label: 'Upload Screenshot', description: 'Upload visual proof or artifacts', available: true },
  { value: 'nft_mint', label: 'NFT Mint', description: 'Mint an NFT from a contract', available: false },
  { value: 'token_hold', label: 'Token Hold', description: 'Hold or stake a token balance', available: false },
  { value: 'wallet_connect', label: 'Wallet Connect', description: 'Connect wallet to a dApp or ChainVerse', available: true },
  { value: 'custom', label: 'Custom Task', description: 'Anything else with manual instructions', available: true }
];

const rewardTypes = [
  { value: 'points', label: 'Points', available: true },
  { value: 'token', label: 'Token', available: false },
  { value: 'nft', label: 'NFT', available: false },
  { value: 'custom', label: 'Custom Reward', available: true }
];

const selectionMethods = [
  { value: 'random', label: 'Random Selection', description: 'Winners are selected randomly from completed participants' },
  { value: 'fcfs', label: 'First Come, First Served', description: 'Winners are selected based on completion order' },
  { value: 'leaderboard', label: 'Leaderboard Ranking', description: 'Winners are selected based on privilege points earned' }
];

export default function CreateQuestPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("manual"); // Start with manual for better UX
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initialQuestState: CreateQuestData = {
    title: '',
    description: '',
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    selectionMethod: 'random',
    participantLimit: 10,
    rewardPool: {
      amount: 100,
      currency: 'POINTS',
      rewardType: 'points'
    },
    tasks: []
  };

  const [questData, setQuestData] = useState<CreateQuestData>(initialQuestState);

  const getDefaultTaskConfig = (taskType: TaskType): TaskConfig => {
    return {
      requiresProof: true,
      proofType: 'image'
    };
  };

  const validateForm = (data?: CreateQuestData): Record<string, string> => {
    const dataToValidate = data || questData;
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!dataToValidate.title.trim()) {
      newErrors.title = "Quest title is required";
    } else if (dataToValidate.title.length > 200) {
      newErrors.title = "Quest title must be less than 200 characters";
    }

    if (!dataToValidate.description.trim()) {
      newErrors.description = "Quest description is required";
    } else if (dataToValidate.description.length > 2000) {
      newErrors.description = "Quest description must be less than 2000 characters";
    }

    if (dataToValidate.participantLimit < 1) {
      newErrors.participantLimit = "Winner limit must be at least 1";
    } else if (dataToValidate.participantLimit > 1000) {
      newErrors.participantLimit = "Winner limit cannot exceed 1000";
    }

    if (dataToValidate.rewardPool.amount <= 0) {
      newErrors.rewardAmount = "Reward amount must be greater than 0";
    }

    if (!dataToValidate.rewardPool.currency.trim()) {
      newErrors.rewardCurrency = "Reward currency is required";
    }

    // Date validation
    const now = new Date();
    const startDate = new Date(dataToValidate.startDate);
    const endDate = new Date(dataToValidate.endDate);

    if (startDate <= now) {
      newErrors.startDate = "Start date must be in the future";
    }

    if (endDate <= startDate) {
      newErrors.endDate = "End date must be after start date";
    }

    // Tasks validation
    if (dataToValidate.tasks.length === 0) {
      newErrors.tasks = "At least one task is required";
    }

    dataToValidate.tasks.forEach((task, index) => {
      if (!task.title.trim()) {
        newErrors[`task_${index}_title`] = `Task ${index + 1} title is required`;
      }
      if (!task.description.trim()) {
        newErrors[`task_${index}_description`] = `Task ${index + 1} description is required`;
      }

      // Validate privilege points for leaderboard method
      if (dataToValidate.selectionMethod === 'leaderboard') {
        if (!task.privilegePoints || task.privilegePoints < 1 || task.privilegePoints > 10) {
          newErrors[`task_${index}_privilege`] = `Task ${index + 1} privilege points must be between 1-10`;
        }
      }

      // Task-specific validation
      switch (task.taskType) {
        case 'join_community':
          if (!task.config.communityId) {
            newErrors[`task_${index}_community`] = `Task ${index + 1} requires a community selection`;
          }
          break;
        case 'follow_user':
          if (!task.config.targetUserId) {
            newErrors[`task_${index}_user`] = `Task ${index + 1} requires a user selection`;
          }
          break;
        case 'nft_mint':
          if (!task.config.contractAddress) {
            newErrors[`task_${index}_contract`] = `Task ${index + 1} requires a contract address`;
          }
          break;
        case 'token_hold':
          if (!task.config.tokenAddress) {
            newErrors[`task_${index}_token`] = `Task ${index + 1} requires a token address`;
          }
          if (!task.config.minimumAmount || task.config.minimumAmount <= 0) {
            newErrors[`task_${index}_amount`] = `Task ${index + 1} requires a minimum amount`;
          }
          break;
        case 'custom':
          if (!task.config.customInstructions?.trim()) {
            newErrors[`task_${index}_instructions`] = `Task ${index + 1} requires custom instructions`;
          }
          break;
      }
    });

    setErrors(newErrors);
    return newErrors;
  };

  const handleAIQuestGenerated = (aiQuestData: CreateQuestData) => {
    // Process AI data to ensure it matches local state requirements
    const processedData: CreateQuestData = {
      ...aiQuestData,
      participantLimit: Number(aiQuestData.participantLimit),
      rewardPool: {
        ...aiQuestData.rewardPool,
        amount: Number(aiQuestData.rewardPool.amount)
      },
      startDate: new Date(aiQuestData.startDate),
      endDate: new Date(aiQuestData.endDate),
      tasks: (aiQuestData.tasks || []).map((task, index) => ({
        ...task,
        order: index + 1,
        isRequired: task.isRequired ?? true,
        privilegePoints: Number(task.privilegePoints) || 1,
        config: { ...getDefaultTaskConfig(task.taskType), ...(task.config || {}) }
      }))
    };

    setQuestData(processedData);

    if ((aiQuestData as any).bannerFile) {
      setBannerFile((aiQuestData as any).bannerFile);
    }

    setActiveTab("manual");
    toast({
      title: "Quest Generated! ✨",
      description: "AI-generated quest has been loaded. You can review and modify it before creating.",
    });
  };

  const addTask = () => {
    const newTask: QuestTask = {
      title: '',
      description: '',
      taskType: 'join_community',
      isRequired: true,
      order: questData.tasks.length + 1,
      privilegePoints: 1, // Default privilege points
      config: getDefaultTaskConfig('join_community')
    };
    setQuestData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
  };

  const updateTask = (index: number, field: string, value: any) => {
    setQuestData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => {
        if (i !== index) return task;
        if (field === 'taskType') {
          return {
            ...task,
            taskType: value,
            config: getDefaultTaskConfig(value)
          };
        }
        return { ...task, [field]: value };
      })
    }));
  };

  const updateTaskConfig = (index: number, config: Partial<TaskConfig>) => {
    setQuestData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) =>
        i === index ? { ...task, config: { ...task.config, ...config } } : task
      )
    }));
  };

  const removeTask = (index: number) => {
    setQuestData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index).map((task, i) => ({
        ...task,
        order: i + 1
      }))
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setBannerPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAIQuestSave = async (aiQuestData: CreateQuestData) => {
    // Process data for submission
    const processedData: CreateQuestData = {
      ...aiQuestData,
      participantLimit: Number(aiQuestData.participantLimit),
      rewardPool: {
        ...aiQuestData.rewardPool,
        amount: Number(aiQuestData.rewardPool.amount)
      },
      startDate: new Date(aiQuestData.startDate),
      endDate: new Date(aiQuestData.endDate),
      tasks: (aiQuestData.tasks || []).map((task, index) => ({
        ...task,
        order: index + 1,
        isRequired: task.isRequired ?? true,
        privilegePoints: Number(task.privilegePoints) || 1,
        config: { ...getDefaultTaskConfig(task.taskType), ...(task.config || {}) }
      }))
    };

    if ((aiQuestData as any).bannerFile) {
      setBannerFile((aiQuestData as any).bannerFile);
    }

    await submitQuest(processedData);
  };

  const submitQuest = async (dataToSubmit: CreateQuestData) => {
    const validationErrors = validateForm(dataToSubmit);

    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: firstError || "Please check the form for errors",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await communityAdminQuestApiService.createQuest(dataToSubmit);

      if (response.success && response.data) {
        // Upload banner if provided
        const bannerToUpload = (dataToSubmit as any).bannerFile || bannerFile;
        if (bannerToUpload) {
          await communityAdminQuestApiService.uploadQuestBanner(response.data._id, bannerToUpload);
        }

        toast({
          title: response.message || "Success! 🎉",
          description: "Quest created successfully. You can now review and start it when ready.",
        });
        router.push(COMMUNITY_ADMIN_ROUTES.QUESTS);
      } else {
        throw new Error(response.error || "Failed to create quest");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create quest",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuest = () => submitQuest(questData);

  const formatDateForInput = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  return (
    <QuestAccessGuard>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Create New Quest
            </h1>
            <p className="text-gray-400 mt-2">Design engaging quests to grow your community and reward participants</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-black/60 backdrop-blur-xl border border-purple-800/30">
            <TabsTrigger value="manual" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white">
              <Trophy className="h-4 w-4 mr-2" />
              Manual Creation
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          {/* Manual Creation Tab */}
          <TabsContent value="manual" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Information */}
              <Card className="lg:col-span-2 bg-black/60 backdrop-blur-xl border-purple-800/30">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Quest Title *</Label>
                      <Input
                        id="title"
                        value={questData.title}
                        onChange={(e) => {
                          setQuestData(prev => ({ ...prev, title: e.target.value }));
                          if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                        }}
                        placeholder="Enter quest title"
                        className={`bg-gray-800 border-gray-600 text-white ${errors.title ? 'border-red-500' : ''}`}
                      />
                      {errors.title && (
                        <p className="text-red-400 text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {errors.title}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="participantLimit">Winner Limit *</Label>
                      <Input
                        id="participantLimit"
                        type="number"
                        min="1"
                        max="1000"
                        value={questData.participantLimit}
                        onChange={(e) => {
                          setQuestData(prev => ({ ...prev, participantLimit: parseInt(e.target.value) || 1 }));
                          if (errors.participantLimit) setErrors(prev => ({ ...prev, participantLimit: '' }));
                        }}
                        className={`bg-gray-800 border-gray-600 text-white ${errors.participantLimit ? 'border-red-500' : ''}`}
                      />
                      {errors.participantLimit && (
                        <p className="text-red-400 text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {errors.participantLimit}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Quest Description *</Label>
                    <Textarea
                      id="description"
                      value={questData.description}
                      onChange={(e) => {
                        setQuestData(prev => ({ ...prev, description: e.target.value }));
                        if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                      }}
                      placeholder="Describe your quest and what participants need to do..."
                      rows={4}
                      className={`bg-gray-800 border-gray-600 text-white ${errors.description ? 'border-red-500' : ''}`}
                    />
                    {errors.description && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={formatDateForInput(questData.startDate)}
                        onChange={(e) => {
                          setQuestData(prev => ({ ...prev, startDate: new Date(e.target.value) }));
                          if (errors.startDate) setErrors(prev => ({ ...prev, startDate: '' }));
                        }}
                        className={`bg-gray-800 border-gray-600 text-white ${errors.startDate ? 'border-red-500' : ''}`}
                      />
                      {errors.startDate && (
                        <p className="text-red-400 text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {errors.startDate}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={formatDateForInput(questData.endDate)}
                        onChange={(e) => {
                          setQuestData(prev => ({ ...prev, endDate: new Date(e.target.value) }));
                          if (errors.endDate) setErrors(prev => ({ ...prev, endDate: '' }));
                        }}
                        className={`bg-gray-800 border-gray-600 text-white ${errors.endDate ? 'border-red-500' : ''}`}
                      />
                      {errors.endDate && (
                        <p className="text-red-400 text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {errors.endDate}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Winner Selection Method *</Label>
                    <Select
                      value={questData.selectionMethod}
                      onValueChange={(value: 'fcfs' | 'random' | 'leaderboard') => setQuestData(prev => ({ ...prev, selectionMethod: value }))}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {selectionMethods.map(method => (
                          <SelectItem key={method.value} value={method.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{method.label}</span>
                              <span className="text-xs text-gray-400">{method.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {questData.selectionMethod === 'leaderboard' && (
                      <div className="mt-2 p-3 bg-purple-950/30 border border-purple-600/30 rounded-lg">
                        <div className="flex items-center gap-2 text-purple-400 text-sm">
                          <Crown className="h-4 w-4" />
                          <span>Leaderboard Mode: Assign privilege points (1-10) to each task for ranking</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Banner Upload */}
                  <div className="space-y-2">
                    <Label>Quest Banner (Optional)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                      {bannerPreview && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                          <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reward Configuration */}
              <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
                <CardHeader>
                  <CardTitle>Reward Pool</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Reward Type</Label>
                    <Select
                      value={questData.rewardPool.rewardType}
                      onValueChange={(value: any) => setQuestData(prev => ({
                        ...prev,
                        rewardPool: {
                          ...prev.rewardPool,
                          rewardType: value,
                          currency: value === 'points' ? 'POINTS' : prev.rewardPool.currency
                        }
                      }))}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {rewardTypes.map(type => (
                          <SelectItem
                            key={type.value}
                            value={type.value}
                            disabled={!type.available}
                          >
                            <div className="flex items-center gap-2">
                              {type.label}
                              {!type.available && (
                                <Badge variant="outline" className="text-xs border-gray-500 text-gray-400">
                                  Coming Soon
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={questData.rewardPool.amount}
                      onChange={(e) => {
                        setQuestData(prev => ({
                          ...prev,
                          rewardPool: { ...prev.rewardPool, amount: parseFloat(e.target.value) || 0 }
                        }));
                        if (errors.rewardAmount) setErrors(prev => ({ ...prev, rewardAmount: '' }));
                      }}
                      className={`bg-gray-800 border-gray-600 text-white ${errors.rewardAmount ? 'border-red-500' : ''}`}
                    />
                    {errors.rewardAmount && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {errors.rewardAmount}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Currency/Token</Label>
                    <Input
                      value={questData.rewardPool.currency}
                      onChange={(e) => {
                        setQuestData(prev => ({
                          ...prev,
                          rewardPool: { ...prev.rewardPool, currency: e.target.value }
                        }));
                        if (errors.rewardCurrency) setErrors(prev => ({ ...prev, rewardCurrency: '' }));
                      }}
                      placeholder="e.g., POINTS, USDT, ETH"
                      className={`bg-gray-800 border-gray-600 text-white ${errors.rewardCurrency ? 'border-red-500' : ''}`}
                      disabled={questData.rewardPool.rewardType === 'points'}
                    />
                    {errors.rewardCurrency && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {errors.rewardCurrency}
                      </p>
                    )}
                  </div>

                  {questData.rewardPool.rewardType === 'custom' && (
                    <div className="space-y-2">
                      <Label>Custom Reward Description</Label>
                      <Textarea
                        value={questData.rewardPool.customReward || ''}
                        onChange={(e) => setQuestData(prev => ({
                          ...prev,
                          rewardPool: { ...prev.rewardPool, customReward: e.target.value }
                        }))}
                        placeholder="Describe the custom reward..."
                        rows={3}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  )}

                  <div className="text-sm text-gray-400 bg-gray-800/50 p-3 rounded-lg">
                    <p className="font-medium mb-1">Reward Distribution:</p>
                    <p>Each winner will receive: <span className="text-white font-mono">
                      {(questData.rewardPool.amount / questData.participantLimit).toFixed(2)} {questData.rewardPool.currency}
                    </span></p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quest Tasks */}
            <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Quest Tasks</span>
                  <Button
                    onClick={addTask}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {errors.tasks && (
                  <div className="mb-4 p-3 bg-red-950/50 border border-red-600/50 rounded-lg">
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {errors.tasks}
                    </p>
                  </div>
                )}

                {questData.tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks added yet. Click "Add Task" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questData.tasks.map((task, index) => (
                      <Card key={index} className="bg-gray-800/50 border-gray-700">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-purple-400 border-purple-600">
                              Task {index + 1}
                            </Badge>
                            <Button
                              onClick={() => removeTask(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Task Title</Label>
                              <Input
                                value={task.title}
                                onChange={(e) => {
                                  updateTask(index, 'title', e.target.value);
                                  if (errors[`task_${index}_title`]) {
                                    setErrors(prev => ({ ...prev, [`task_${index}_title`]: '' }));
                                  }
                                }}
                                placeholder="Enter task title"
                                className={`bg-gray-700 border-gray-600 text-white ${errors[`task_${index}_title`] ? 'border-red-500' : ''
                                  }`}
                              />
                              {errors[`task_${index}_title`] && (
                                <p className="text-red-400 text-xs flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {errors[`task_${index}_title`]}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label>Task Type</Label>
                              <Select
                                value={task.taskType}
                                onValueChange={(value) => updateTask(index, 'taskType', value)}
                              >
                                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-600">
                                  {taskTypes.map(type => (
                                    <SelectItem
                                      key={type.value}
                                      value={type.value}
                                      disabled={!type.available}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <div>
                                          <div className="font-medium">{type.label}</div>
                                          <div className="text-xs text-gray-400">{type.description}</div>
                                        </div>
                                        {!type.available && (
                                          <Badge variant="outline" className="text-xs border-gray-500 text-gray-400 ml-2">
                                            Soon
                                          </Badge>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Task Description</Label>
                            <Textarea
                              value={task.description}
                              onChange={(e) => {
                                updateTask(index, 'description', e.target.value);
                                if (errors[`task_${index}_description`]) {
                                  setErrors(prev => ({ ...prev, [`task_${index}_description`]: '' }));
                                }
                              }}
                              placeholder="Describe what the user needs to do..."
                              rows={2}
                              className={`bg-gray-700 border-gray-600 text-white ${errors[`task_${index}_description`] ? 'border-red-500' : ''
                                }`}
                            />
                            {errors[`task_${index}_description`] && (
                              <p className="text-red-400 text-xs flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {errors[`task_${index}_description`]}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`required-${index}`}
                                checked={task.isRequired}
                                onCheckedChange={(checked) => updateTask(index, 'isRequired', checked)}
                              />
                              <Label htmlFor={`required-${index}`}>Required task</Label>
                            </div>
                            {questData.selectionMethod === 'leaderboard' && (
                              <div className="space-y-2">
                                <Label>Privilege Points (1-10)</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={task.privilegePoints}
                                  onChange={(e) => {
                                    updateTask(index, 'privilegePoints', parseInt(e.target.value) || 1);
                                    if (errors[`task_${index}_privilege`]) {
                                      setErrors(prev => ({ ...prev, [`task_${index}_privilege`]: '' }));
                                    }
                                  }}
                                  className={`bg-gray-700 border-gray-600 text-white ${errors[`task_${index}_privilege`] ? 'border-red-500' : ''
                                    }`}
                                />
                                {errors[`task_${index}_privilege`] && (
                                  <p className="text-red-400 text-xs flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {errors[`task_${index}_privilege`]}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Task Configuration */}
                          <div className="border-t border-gray-600 pt-4">
                            <TaskConfiguration
                              taskType={task.taskType}
                              config={task.config}
                              onChange={(config: any) => updateTaskConfig(index, config)}
                            />
                          </div>

                          {/* Display task-specific errors */}
                          {Object.entries(errors)
                            .filter(([key]) => key.startsWith(`task_${index}_`) && !key.includes('title') && !key.includes('description') && !key.includes('privilege'))
                            .map(([key, error]) => (
                              <p key={key} className="text-red-400 text-xs flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {error}
                              </p>
                            ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateQuest}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4 mr-2" />
                    Create Quest
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai" className="min-h-[600px]">
            <AIQuestChat
              onQuestGenerated={handleAIQuestGenerated}
              onSaveAndCreate={handleAIQuestSave}
            />
          </TabsContent>
        </Tabs>
      </div>
    </QuestAccessGuard>
  );
}