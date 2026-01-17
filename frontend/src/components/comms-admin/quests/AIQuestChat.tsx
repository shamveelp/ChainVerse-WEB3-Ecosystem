"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  User,
  Send,
  Loader2,
  Wand2,
  CheckCircle,
  Upload,
  Search,
  ChevronDown,
  Crop,
  AlertTriangle
} from 'lucide-react';
import { communityAdminQuestApiService } from '@/services/quests/communityAdminQuestApiService';
import { toast } from '@/components/ui/use-toast';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ImageCropper } from "@/components/ui/image-cropper";
import Image from 'next/image';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  needsInput?: {
    type: 'community' | 'user' | 'token' | 'nft' | 'banner';
    field: string;
    prompt: string;
    options?: string[];
  }[];
  questPreview?: QuestData;
}

export interface QuestData {
  title?: string;
  description?: string;
  participantLimit?: number;
  rewardPool?: {
    amount: number;
    currency: string;
  };
  tasks?: unknown[];
  bannerFile?: File;
  startDate?: string | Date;
  endDate?: string | Date;
  selectionMethod?: 'fcfs' | 'random' | 'leaderboard';
  isAIGenerated?: boolean;
  aiPrompt?: string;
}

interface AIQuestChatProps {
  onQuestGenerated: (questData: QuestData) => void;
  onSaveAndCreate?: (questData: QuestData) => Promise<void>;
  onClose?: () => void;
}

export function AIQuestChat({ onQuestGenerated, onSaveAndCreate, onClose }: AIQuestChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI Quest Assistant 🤖 I'll help you create an amazing quest for your community. Let's start with some basics:\n\n• What type of quest would you like to create?\n• Who is your target audience?\n• What's the main goal of this quest?\n\nJust describe your idea in natural language, and I'll guide you through the process!\n\n💡 **Note**: AI quest generation has usage limits. If you reach your limit, you can always switch to the Manual Creation tab.",
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questGenerated, setQuestGenerated] = useState(false);
  const [generatedQuest, setGeneratedQuest] = useState<QuestData | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [awaitingInput, setAwaitingInput] = useState<{
    type: string;
    field: string;
    label?: string;
    fieldType?: string;
    prompt: string;
  } | null>(null);
  const [searchResults, setSearchResults] = useState<unknown[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showManipulateOptions, setShowManipulateOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image cropping states
  const [bannerCropperOpen, setBannerCropperOpen] = useState(false);
  const [tempBannerUrl, setTempBannerUrl] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (tempBannerUrl) URL.revokeObjectURL(tempBannerUrl);
    };
  }, [tempBannerUrl]);

  // Clean up blob URLs when preview changes
  useEffect(() => {
    return () => {
      if (bannerPreview && bannerPreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [bannerPreview]);

  const templates = [
    {
      title: "Community Growth Quest",
      description: "Social engagement and community building",
      prompt: "Create a community growth quest with social media tasks and engagement activities"
    },
    {
      title: "NFT Collection Quest",
      description: "NFT minting and collection challenges",
      prompt: "Design an NFT-focused quest with minting tasks and collection activities"
    },
    {
      title: "DeFi Learning Quest",
      description: "Educational DeFi and yield farming challenge",
      prompt: "Create a DeFi learning quest that teaches yield farming and liquidity provision"
    },
    {
      title: "Trading Challenge",
      description: "Token trading and portfolio challenge",
      prompt: "Design a trading challenge with token holding and swap requirements"
    }
  ];

  const handleSendMessage = async (messageText?: string) => {
    const message = messageText || currentMessage;
    if (!message.trim() || isLoading) return;

    // Handle local field editing
    if (awaitingInput?.type === 'field_edit') {
      const userMessage: Message = {
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setCurrentMessage('');

      // Update local state
      let updatedValue: string | number = message;
      if (awaitingInput.fieldType === 'number') {
        updatedValue = parseFloat(message) || 0;
      }

      const updatedQuest = { ...generatedQuest, [awaitingInput.field]: updatedValue };
      setGeneratedQuest(updatedQuest);
      setAwaitingInput(null);
      setIsLoading(true);

      // Simulate AI processing for local edit
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ Updated ${awaitingInput.label} to "${message}". Anything else?`,
          timestamp: new Date(),
          questPreview: updatedQuest
        }]);
        setIsLoading(false);
      }, 500);
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await communityAdminQuestApiService.chatWithAI(
        message,
        messages.map(m => ({ role: m.role, content: m.content }))
      );

      if (response.success && response.data) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date(),
          needsInput: response.data.needsInput,
          questPreview: response.data.questData
        };

        setMessages(prev => [...prev, assistantMessage]);

        if (response.data.questGenerated && response.data.questData) {
          setQuestGenerated(true);
          setGeneratedQuest(response.data.questData);
        }

        if (response.data.needsInput && response.data.needsInput.length > 0) {
          setAwaitingInput(response.data.needsInput[0]);
        }
      } else {
        throw new Error(response.error || 'Failed to get AI response');
      }
    } catch (error: unknown) {
      // Check if it's a limit exceeded error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMsg = (error instanceof Error ? error.message : (error as any)?.response?.data?.message || String(error)).toLowerCase();

      const isLimitExceeded =
        errorMsg.includes('limit') ||
        errorMsg.includes('quota') ||
        errorMsg.includes('rate') ||
        errorMsg.includes('exceeded') ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.response?.status === 429;

      let errorContent = '';

      if (isLimitExceeded) {
        errorContent = `⚠️ **AI Quest Limit Exceeded**\n\nYou've reached your AI quest generation limit for now. Here are your options:\n\n• **Switch to Manual Mode**: Click the "Manual Creation" tab to create your quest manually\n• **Edit Existing Quest**: If a quest was already generated, you can edit it using the "Manipulate / Edit" button\n• **Try Again Later**: Your AI limit will reset soon\n\nWould you like to switch to manual creation?`;
      } else {
        errorContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or rephrase your request.`;
      }

      const errorMessage: Message = {
        role: 'system',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);

      // Show toast for limit exceeded
      if (isLimitExceeded) {
        toast({
          variant: "destructive",
          title: "AI Limit Exceeded",
          description: "You've reached your AI quest generation limit. Please use manual creation or try again later.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: typeof templates[0]) => {
    handleSendMessage(template.prompt);
  };

  const handleInputResponse = async (value: unknown) => {
    if (!awaitingInput) return;

    let displayValue: string | number | undefined = String(value);
    let internalId = '';

    if (typeof value === 'object' && value !== null) {
      const item = value as { name?: string; username?: string; symbol?: string; communityName?: string; _id?: string; id?: string };
      displayValue = item.name || item.username || item.symbol || item.communityName;
      internalId = item._id || item.id || '';
    }

    const responseMessage = `Selected ${awaitingInput.type}: ${displayValue} (ID: ${internalId})`;

    await handleSendMessage(responseMessage);
    setAwaitingInput(null);
  };

  const handleFileSelect = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Max 10MB allowed for banner images.",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a valid image file",
      });
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setTempBannerUrl(imageUrl);
    setBannerCropperOpen(true);
  };

  const handleCropComplete = (croppedImage: File) => {
    // Create preview URL for the cropped image
    const previewUrl = URL.createObjectURL(croppedImage);

    setBannerFile(croppedImage);
    setBannerPreview(previewUrl);
    setBannerCropperOpen(false);
    if (tempBannerUrl) URL.revokeObjectURL(tempBannerUrl);
    setTempBannerUrl('');

    toast({
      title: "Banner Uploaded",
      description: "Banner will be applied when quest is created",
    });

    // If AI is waiting for banner input, respond
    if (awaitingInput?.type === 'banner') {
      handleInputResponse('uploaded');
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset value so same file can be selected again
    e.target.value = '';
  };

  const handleSearchInput = async (query: string) => {
    if (!awaitingInput || query.length < 2) return;

    try {
      let response;
      if (awaitingInput.type === 'community') {
        response = await communityAdminQuestApiService.searchCommunities(query);
      } else if (awaitingInput.type === 'user') {
        response = await communityAdminQuestApiService.searchUsers(query);
      }

      if (response?.success && response.data) {
        setSearchResults(response.data);
      }
    } catch (error: unknown) {
      console.error('Search error:', error);
    }
  };

  const handleSaveAndCreate = async () => {
    if (!generatedQuest || !onSaveAndCreate) return;

    // Disable saving while processing
    setIsLoading(true);
    try {
      const questWithBanner = bannerFile
        ? { ...generatedQuest, bannerFile }
        : generatedQuest;

      await onSaveAndCreate(questWithBanner);
    } catch (error: unknown) {
      // Error handling is likely done in the parent or should be shown here
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditManually = () => {
    if (!generatedQuest) return;
    const questWithBanner = bannerFile
      ? { ...generatedQuest, bannerFile }
      : generatedQuest;
    onQuestGenerated(questWithBanner);
  };

  const startFieldEdit = (field: string, label: string, type: 'text' | 'number' = 'text') => {
    setAwaitingInput({
      type: 'field_edit',
      field,
      label,
      fieldType: type,
      prompt: `Enter new ${label}:`
    });
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `What should be the new ${label}?`,
      timestamp: new Date()
    }]);
  };

  const renderInputHandler = () => {
    if (!awaitingInput) return null;

    switch (awaitingInput.type) {
      case 'community':
      case 'user':
        return (
          <Card className="bg-blue-950/50 border-blue-600/50 mb-4">
            <CardContent className="p-4">
              <div className="space-y-3">
                <p className="text-blue-200 text-sm">{awaitingInput.prompt}</p>
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between bg-gray-800 border-gray-600 text-white"
                    >
                      Select {awaitingInput.type}...
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-gray-800 border-gray-600">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder={`Search ${awaitingInput.type}s...`}
                        onValueChange={handleSearchInput}
                        className="text-white"
                      />
                      <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {searchResults.map((item: unknown) => {
                            const result = item as { _id: string; name?: string; username?: string; communityName?: string; logo?: string; profilePic?: string };
                            return (
                              <CommandItem
                                key={result._id}
                                value={result._id}
                                onSelect={() => {
                                  handleInputResponse(result);
                                  setSearchOpen(false);
                                }}
                                className="text-white hover:bg-gray-700 cursor-pointer"
                              >
                                <div className="flex items-center gap-2 pointer-events-none">
                                  {(result.logo || result.profilePic) && (
                                    <Image
                                      src={(result.logo || result.profilePic) || ''}
                                      alt=""
                                      className="w-6 h-6 rounded-full"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">
                                      {result.communityName || result.name || result.username}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      @{result.username}
                                    </p>
                                  </div>
                                </div>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        );

      case 'banner':
        return (
          <Card className="bg-slate-800/50 border-white/10 mb-4">
            <CardContent className="p-4">
              <div className="space-y-3">
                <p className="text-slate-300 text-sm">{awaitingInput.prompt}</p>

                {/* Banner Preview */}
                {bannerPreview && (
                  <div className="h-24 rounded-lg bg-gray-900 border border-gray-700 overflow-hidden">
                    <Image src={bannerPreview} alt="Banner preview" className="h-full w-full object-cover" />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex-1 border-white/10 text-white"
                  >
                    <Crop className="h-4 w-4 mr-2" />
                    {bannerPreview ? 'Change Banner' : 'Upload & Crop'}
                  </Button>
                  <Button
                    onClick={() => handleInputResponse('skip')}
                    variant="ghost"
                    className="text-gray-400"
                  >
                    Skip
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null; // For field_edit, we just use the main chat input
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    return (
      <div
        key={index}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg p-3 ${isUser
            ? 'bg-white text-black'
            : isSystem
              ? 'bg-red-900 text-red-200'
              : 'bg-gray-700 text-gray-100'
            }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {isUser ? (
              <User className="h-4 w-4" />
            ) : isSystem ? (
              <>
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-red-400 text-xs font-medium">System</span>
              </>
            ) : (
              <Bot className="h-4 w-4" />
            )}
            <span className="text-xs opacity-70">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <p className="whitespace-pre-wrap">{message.content}</p>

          {message.questPreview && (
            <div className="mt-3 p-3 bg-black/20 rounded border border-gray-600">
              <h4 className="font-medium mb-2 text-green-400">Quest Preview:</h4>
              <div className="text-sm space-y-1">
                <p><strong>Title:</strong> {message.questPreview.title}</p>
                <p><strong>Winners:</strong> {message.questPreview.participantLimit}</p>
                <p><strong>Reward:</strong> {message.questPreview.rewardPool?.amount} {message.questPreview.rewardPool?.currency}</p>
                <p><strong>Tasks:</strong> {message.questPreview.tasks?.length || 0}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-white" />
            AI Quest Assistant
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          {/* Template Suggestions - Show only initially */}
          {messages.length === 1 && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-3">Quick Start Templates:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {templates.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleTemplateSelect(template)}
                    className="p-3 h-auto text-left border-white/10 hover:border-white/20 hover:bg-white/5"
                  >
                    <div>
                      <div className="font-medium text-white text-sm mb-1">
                        {template.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        {template.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map(renderMessage)}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 text-gray-100 rounded-lg p-3 flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input Handler */}
          {renderInputHandler()}

          {/* Generated Quest Actions */}
          {questGenerated && generatedQuest && (
            <Card className="bg-green-950/50 border-green-600/50 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="font-medium text-green-200">Quest Ready!</span>
                </div>

                {/* Manipulate Options Chips */}
                {showManipulateOptions && (
                  <div className="mb-4 space-y-2">
                    <p className="text-xs text-gray-400">Click a field to edit:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        className="cursor-pointer hover:bg-white/20 px-3 py-1"
                        onClick={() => startFieldEdit('title', 'Title')}
                      >
                        Title
                      </Badge>
                      <Badge
                        className="cursor-pointer hover:bg-white/20 px-3 py-1"
                        onClick={() => startFieldEdit('description', 'Description')}
                      >
                        Description
                      </Badge>
                      <Badge
                        className="cursor-pointer hover:bg-white/20 px-3 py-1"
                        onClick={() => startFieldEdit('participantLimit', 'Winner Limit', 'number')}
                      >
                        Winners
                      </Badge>
                      <Badge
                        className="cursor-pointer hover:bg-blue-600 bg-blue-900 px-3 py-1"
                        onClick={handleEditManually}
                      >
                        Advanced Edit (Form)
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveAndCreate}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save & Create Quest
                  </Button>
                  <Button
                    onClick={() => setShowManipulateOptions(!showManipulateOptions)}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-400"
                  >
                    {showManipulateOptions ? "Hide Options" : "Manipulate / Edit"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message Input */}
          <div className="flex gap-2 pt-4 border-t border-gray-700">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={awaitingInput?.type === 'field_edit' ? awaitingInput.prompt : "Describe your quest idea or ask questions..."}
              className="flex-1 bg-gray-800 border-gray-600 text-white"
              disabled={isLoading}
              autoFocus={!!awaitingInput?.type}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!currentMessage.trim() || isLoading}
              className="bg-white text-black hover:bg-slate-200"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Image Cropper */}
      <ImageCropper
        open={bannerCropperOpen}
        onClose={() => {
          setBannerCropperOpen(false);
          if (tempBannerUrl) {
            URL.revokeObjectURL(tempBannerUrl);
            setTempBannerUrl('');
          }
        }}
        imageSrc={tempBannerUrl}
        aspectRatio={3}
        cropShape="rect"
        fileName="quest-banner.jpg"
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}