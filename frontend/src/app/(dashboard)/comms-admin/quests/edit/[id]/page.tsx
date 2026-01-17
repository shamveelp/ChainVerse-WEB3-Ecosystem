"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Trophy,
  Target,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { communityAdminQuestApiService } from '@/services/quests/communityAdminQuestApiService';
import Image from 'next/image';

interface QuestTask {
  _id?: string;
  title: string;
  description: string;
  taskType: string;
  isRequired: boolean;
  order: number;
  config?: any;
}

interface UpdateQuestData {
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
}

const taskTypes = [
  { value: 'join_community', label: 'Join Community', description: 'User must join the community' },
  { value: 'follow_user', label: 'Follow User', description: 'Follow a specific user or admin' },
  { value: 'twitter_post', label: 'Twitter Post', description: 'Post on Twitter with specific content' },
  { value: 'upload_screenshot', label: 'Upload Screenshot', description: 'Upload proof screenshot' },
  { value: 'nft_mint', label: 'NFT Mint', description: 'Mint a specific NFT' },
  { value: 'token_hold', label: 'Token Hold', description: 'Hold minimum amount of tokens' },
  { value: 'wallet_connect', label: 'Wallet Connect', description: 'Connect their wallet' },
  { value: 'custom', label: 'Custom Task', description: 'Custom task with instructions' }
];

const rewardTypes = [
  { value: 'token', label: 'Token' },
  { value: 'nft', label: 'NFT' },
  { value: 'points', label: 'Points' },
  { value: 'custom', label: 'Custom Reward' }
];

export default function EditQuestPage() {
  const params = useParams();
  const router = useRouter();
  const questId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");

  const [questData, setQuestData] = useState<UpdateQuestData>({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(),
    selectionMethod: 'random',
    participantLimit: 10,
    rewardPool: {
      amount: 100,
      currency: 'POINTS',
      rewardType: 'points'
    },
    tasks: []
  });

  useEffect(() => {
    if (questId) {
      fetchQuest();
    }
  }, [questId]);

  const fetchQuest = async () => {
    setLoading(true);
    try {
      const response = await communityAdminQuestApiService.getQuest(questId);
      if (response.success && response.data) {
        const quest = response.data;
        setQuestData({
          title: quest.title,
          description: quest.description,
          startDate: new Date(quest.startDate),
          endDate: new Date(quest.endDate),
          selectionMethod: quest.selectionMethod,
          participantLimit: quest.participantLimit,
          rewardPool: quest.rewardPool,
          tasks: quest.tasks || []
        });

        if (quest.bannerImage) {
          setBannerPreview(quest.bannerImage);
        }
      } else {
        throw new Error(response.error || "Failed to fetch quest");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch quest",
      });
      router.push('/comms-admin/quests');
    } finally {
      setLoading(false);
    }
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

  const addTask = () => {
    const newTask: QuestTask = {
      title: '',
      description: '',
      taskType: 'join_community',
      isRequired: true,
      order: questData.tasks.length + 1
    };
    setQuestData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
  };

  const updateTask = (index: number, field: string, value: any) => {
    setQuestData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) =>
        i === index ? { ...task, [field]: value } : task
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

  const handleUpdateQuest = async () => {
    setSaving(true);
    try {
      // Validate required fields
      if (!questData.title.trim() || !questData.description.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Title and description are required",
        });
        return;
      }

      if (questData.tasks.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "At least one task is required",
        });
        return;
      }

      // Update quest
      const response = await communityAdminQuestApiService.updateQuest(questId, questData);

      if (response.success && response.data) {
        // Upload banner if provided
        if (bannerFile) {
          await communityAdminQuestApiService.uploadQuestBanner(questId, bannerFile);
        }

        toast({
          title: "Success",
          description: "Quest updated successfully",
        });
        router.push(`/comms-admin/quests/${questId}`);
      } else {
        throw new Error(response.error || "Failed to update quest");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update quest",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push(`/comms-admin/quests/${questId}`)}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">
            Edit Quest
          </h1>
          <p className="text-gray-400 mt-2">Modify quest details and configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border-white/10">
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
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="fcfs">First Come, First Served</SelectItem>
                  <SelectItem value="random">Random Selection</SelectItem>
                  <SelectItem value="leaderboard">Leaderboard Ranking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Banner Image Upload */}
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
                    <Image src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reward Configuration */}
        <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10">
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
      <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Quest Tasks</span>
            <Button
              onClick={addTask}
              size="sm"
              className="bg-white text-black hover:bg-slate-200"
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
                <Card key={task._id || index} className="bg-slate-800/50 border-white/10">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-white border-white">
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
                        rows={2}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`required-${index}`}
                        checked={task.isRequired}
                        onCheckedChange={(checked) => updateTask(index, 'isRequired', checked)}
                      />
                      <Label htmlFor={`required-${index}`}>Required Task</Label>
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
          onClick={() => router.push(`/comms-admin/quests/${questId}`)}
          className="border-gray-600 text-gray-400 hover:bg-gray-700"
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpdateQuest}
          disabled={saving}
          className="bg-white text-black hover:bg-slate-200"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}