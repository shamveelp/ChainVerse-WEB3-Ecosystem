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
  MessageSquare, Send, Loader2, Check, X, Wand2, Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { communityAdminQuestApiService } from '@/services/quests/communityAdminQuestApiService';

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
}

interface QuestTask {
  title: string;
  description: string;
  taskType: TaskType;
  isRequired: boolean;
  order: number;
  config: TaskConfig;
}

interface CreateQuestData {
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
    rewardType: 'token' | 'nft' | 'points' | 'custom';
    customReward?: string;
  };
  tasks: QuestTask[];
  isAIGenerated?: boolean;
  aiPrompt?: string;
}

const taskTypes: Array<{ value: TaskType; label: string; description: string }> = [
  { value: 'join_community', label: 'Join Community', description: 'Members must join a specific community' },
  { value: 'follow_user', label: 'Follow User', description: 'Follow a creator/admin profile' },
  { value: 'twitter_post', label: 'Twitter Post', description: 'Publish a post on X/Twitter' },
  { value: 'upload_screenshot', label: 'Upload Screenshot', description: 'Upload visual proof or artifacts' },
  { value: 'nft_mint', label: 'NFT Mint', description: 'Mint an NFT from a contract' },
  { value: 'token_hold', label: 'Token Hold', description: 'Hold or stake a token balance' },
  { value: 'wallet_connect', label: 'Wallet Connect', description: 'Connect wallet to a dApp or ChainVerse' },
  { value: 'custom', label: 'Custom Task', description: 'Anything else with manual instructions' }
];

const rewardTypes = [
  { value: 'token', label: 'Token' },
  { value: 'nft', label: 'NFT' },
  { value: 'points', label: 'Points' },
  { value: 'custom', label: 'Custom Reward' }
];

const questTemplates = [
  {
    name: "Community Growth",
    description: "Grow your community with social engagement tasks",
    prompt: "Create a community growth quest with Twitter engagement and community joining tasks"
  },
  {
    name: "DeFi Learning",
    description: "Educational quest about DeFi protocols and yield farming",
    prompt: "Design a DeFi learning quest that teaches users about yield farming and liquidity provision"
  },
  {
    name: "NFT Collection",
    description: "Quest focused on NFT minting and collection activities",
    prompt: "Create an NFT-focused quest with minting tasks and community engagement"
  },
  {
    name: "Trading Challenge",
    description: "Token trading and portfolio management challenge",
    prompt: "Design a trading challenge quest with token holding and swap requirements"
  }
];

export default function CreateQuestPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("ai");
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedQuest, setAiGeneratedQuest] = useState<CreateQuestData | null>(null);
  const [conversationStep, setConversationStep] = useState<'template' | 'chat' | 'generated'>('template');

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

  const handleTemplateSelect = (template: typeof questTemplates[0]) => {
    setCurrentMessage(template.prompt);
    setConversationStep('chat');
    setChatMessages([
      { 
        role: 'assistant', 
        content: `Great choice! I'll help you create a ${template.name.toLowerCase()}. ${template.description}. Let me know if you'd like me to customize anything specific!` 
      }
    ]);
    handleAIMessage(template.prompt);
  };

  const handleAIMessage = async (message?: string) => {
    const userMessage = message || currentMessage;
    if (!userMessage.trim() || aiLoading) return;

    setCurrentMessage("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiLoading(true);

    try {
      const response = await communityAdminQuestApiService.generateQuestWithAI({
        prompt: userMessage,
        difficulty: 'medium',
        expectedWinners: 10
      });

      if (response.success && response.data) {
        const normalized: CreateQuestData = {
          ...response.data,
          startDate: new Date(response.data.startDate),
          endDate: new Date(response.data.endDate),
          tasks: response.data.tasks.map((task: any, index: number) => ({
            ...task,
            order: index + 1,
            config: { ...getDefaultTaskConfig(task.taskType), ...(task.config || {}) }
          }))
        };
        
        setAiGeneratedQuest(normalized);
        setConversationStep('generated');
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `🎉 Perfect! I've created "${normalized.title}" for you! This quest includes ${normalized.tasks.length} engaging tasks and offers ${normalized.rewardPool.amount} ${normalized.rewardPool.currency} in rewards. Check out the preview and let me know if you'd like any adjustments!`
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `I'd be happy to help create that quest! Could you provide more details about what type of engagement you're looking for? For example:

• What's your community's main focus?
• What rewards would motivate your members?
• Any specific tasks you have in mind?

The more details you share, the better I can customize the quest for your community! 🚀`
        }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble generating a quest right now. Please try the manual creation or try again with more specific details about your quest goals! 🔧"
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const useAIQuest = () => {
    if (aiGeneratedQuest) {
      setQuestData(aiGeneratedQuest);
      setActiveTab("manual");
      toast({
        title: "Quest Loaded! ✨",
        description: "AI-generated quest has been loaded for editing",
      });
    }
  };

  const addTask = () => {
    const newTask: QuestTask = {
      title: '',
      description: '',
      taskType: 'join_community',
      isRequired: true,
      order: questData.tasks.length + 1,
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

  const handleCreateQuest = async () => {
    // Basic validation
    if (!questData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Title",
        description: "Please enter a quest title",
      });
      return;
    }

    if (!questData.description.trim()) {
      toast({
        variant: "destructive", 
        title: "Missing Description",
        description: "Please enter a quest description",
      });
      return;
    }

    if (questData.tasks.length === 0) {
      toast({
        variant: "destructive",
        title: "No Tasks",
        description: "Please add at least one task to your quest",
      });
      return;
    }

    // Validate tasks
    for (let i = 0; i < questData.tasks.length; i++) {
      const task = questData.tasks[i];
      if (!task.title.trim()) {
        toast({
          variant: "destructive",
          title: "Missing Task Title",
          description: `Task ${i + 1} needs a title`,
        });
        return;
      }
      if (!task.description.trim()) {
        toast({
          variant: "destructive",
          title: "Missing Task Description", 
          description: `Task ${i + 1} needs a description`,
        });
        return;
      }
    }

    setLoading(true);
    try {
      const response = await communityAdminQuestApiService.createQuest(questData);

      if (response.success && response.data) {
        if (bannerFile) {
          await communityAdminQuestApiService.uploadQuestBanner(response.data._id, bannerFile);
        }

        toast({
          title: "Success! 🎉",
          description: "Quest created successfully",
        });
        router.push('/comms-admin/quests');
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

  const formatDateForInput = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  return (
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
          <p className="text-gray-400 mt-2">Design engaging quests to grow your community</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-black/60 backdrop-blur-xl border border-purple-800/30">
          <TabsTrigger value="ai" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="manual" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white">
            <Trophy className="h-4 w-4 mr-2" />
            Manual Creation
          </TabsTrigger>
        </TabsList>

        {/* AI Assistant Tab */}
        <TabsContent value="ai">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Chat Interface */}
            <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-400" />
                  AI Quest Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {conversationStep === 'template' && (
                  <div className="space-y-4">
                    <div className="text-center py-6">
                      <Wand2 className="h-16 w-16 mx-auto mb-4 text-purple-400" />
                      <h3 className="text-xl font-semibold text-white mb-2">Choose Your Quest Type</h3>
                      <p className="text-gray-400 mb-6">Select a template to get started, or describe your custom quest below</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {questTemplates.map((template, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="p-4 h-auto text-left border-purple-600/30 hover:border-purple-500/50 hover:bg-purple-950/30"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div>
                            <div className="font-medium text-white mb-1">{template.name}</div>
                            <div className="text-sm text-gray-400">{template.description}</div>
                          </div>
                          <Zap className="h-5 w-5 text-purple-400 ml-auto" />
                        </Button>
                      ))}
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-600" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-gray-900 px-2 text-gray-400">Or describe your custom quest</span>
                      </div>
                    </div>
                  </div>
                )}

                {conversationStep !== 'template' && (
                  <div className="h-96 overflow-y-auto space-y-4 bg-gray-900/50 rounded-lg p-4">
                    {chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
                            message.role === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-100'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-700 text-gray-100 p-3 rounded-lg flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating your perfect quest...
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAIMessage()}
                    placeholder={conversationStep === 'template' ? "Describe your custom quest idea..." : "Ask for modifications or clarifications..."}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={aiLoading}
                  />
                  <Button
                    onClick={() => handleAIMessage()}
                    disabled={!currentMessage.trim() || aiLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quest Preview */}
            <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-purple-400" />
                    Quest Preview
                  </span>
                  {aiGeneratedQuest && (
                    <Button
                      onClick={useAIQuest}
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-purple-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Use This Quest
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiGeneratedQuest ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{aiGeneratedQuest.title}</h3>
                      <p className="text-gray-300 text-sm">{aiGeneratedQuest.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Winners: </span>
                        <span className="text-white">{aiGeneratedQuest.participantLimit}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Method: </span>
                        <span className="text-white">{aiGeneratedQuest.selectionMethod}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Reward: </span>
                        <span className="text-white">
                          {aiGeneratedQuest.rewardPool.amount} {aiGeneratedQuest.rewardPool.currency}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Tasks: </span>
                        <span className="text-white">{aiGeneratedQuest.tasks.length}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-white">Tasks:</h4>
                      {aiGeneratedQuest.tasks.map((task, index) => (
                        <div key={index} className="bg-gray-800 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {task.taskType.replace('_', ' ')}
                            </Badge>
                            {task.isRequired && (
                              <Badge className="text-xs bg-red-600">Required</Badge>
                            )}
                          </div>
                          <p className="text-white font-medium text-sm">{task.title}</p>
                          <p className="text-gray-400 text-xs">{task.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-16">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>
                      {conversationStep === 'template' 
                        ? 'Choose a template or describe your quest to see a preview'
                        : 'Continue chatting to generate your perfect quest'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
                      onChange={(e) => setQuestData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter quest title"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="participantLimit">Winner Limit *</Label>
                    <Input
                      id="participantLimit"
                      type="number"
                      min="1"
                      value={questData.participantLimit}
                      onChange={(e) => setQuestData(prev => ({ ...prev, participantLimit: parseInt(e.target.value) || 1 }))}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Quest Description *</Label>
                  <Textarea
                    id="description"
                    value={questData.description}
                    onChange={(e) => setQuestData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your quest and what participants need to do..."
                    rows={4}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formatDateForInput(questData.startDate)}
                      onChange={(e) => setQuestData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formatDateForInput(questData.endDate)}
                      onChange={(e) => setQuestData(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Selection Method</Label>
                  <Select
                    value={questData.selectionMethod}
                    onValueChange={(value: 'fcfs' | 'random') => setQuestData(prev => ({ ...prev, selectionMethod: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="fcfs">First Come, First Served</SelectItem>
                      <SelectItem value="random">Random Selection</SelectItem>
                    </SelectContent>
                  </Select>
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
                      rewardPool: { ...prev.rewardPool, rewardType: value }
                    }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {rewardTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
                    value={questData.rewardPool.amount}
                    onChange={(e) => setQuestData(prev => ({
                      ...prev,
                      rewardPool: { ...prev.rewardPool, amount: parseFloat(e.target.value) || 0 }
                    }))}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Currency/Token</Label>
                  <Input
                    value={questData.rewardPool.currency}
                    onChange={(e) => setQuestData(prev => ({
                      ...prev,
                      rewardPool: { ...prev.rewardPool, currency: e.target.value }
                    }))}
                    placeholder="e.g., USDT, ETH, POINTS"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
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
                              onChange={(e) => updateTask(index, 'title', e.target.value)}
                              placeholder="Enter task title"
                              className="bg-gray-700 border-gray-600 text-white"
                            />
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
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
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
                            onChange={(e) => updateTask(index, 'description', e.target.value)}
                            placeholder="Describe what the user needs to do..."
                            rows={3}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`required-${index}`}
                            checked={task.isRequired}
                            onCheckedChange={(checked) => updateTask(index, 'isRequired', checked)}
                          />
                          <Label htmlFor={`required-${index}`}>Required task</Label>
                        </div>
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
      </Tabs>
    </div>
  );
}