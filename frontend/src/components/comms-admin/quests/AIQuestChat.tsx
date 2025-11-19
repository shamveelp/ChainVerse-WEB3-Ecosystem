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
  ChevronDown
} from 'lucide-react';
import { communityAdminQuestApiService } from '@/services/quests/communityAdminQuestApiService';
import { toast } from '@/components/ui/use-toast';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  needsInput?: {
    type: 'community' | 'user' | 'token' | 'nft' | 'banner';
    field: string;
    prompt: string;
    options?: any[];
  }[];
  questPreview?: any;
}

interface AIQuestChatProps {
  onQuestGenerated: (questData: any) => void;
  onClose?: () => void;
}

export function AIQuestChat({ onQuestGenerated, onClose }: AIQuestChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI Quest Assistant 🤖 I'll help you create an amazing quest for your community. Let's start with some basics:\n\n• What type of quest would you like to create?\n• Who is your target audience?\n• What's the main goal of this quest?\n\nJust describe your idea in natural language, and I'll guide you through the process!",
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questGenerated, setQuestGenerated] = useState(false);
  const [generatedQuest, setGeneratedQuest] = useState<any>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [awaitingInput, setAwaitingInput] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

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
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'system',
        content: `Error: ${error.message}. Please try again or rephrase your request.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: typeof templates[0]) => {
    handleSendMessage(template.prompt);
  };

  const handleInputResponse = async (value: any) => {
    if (!awaitingInput) return;

    const responseMessage = `Selected ${awaitingInput.type}: ${
      typeof value === 'object' ? value.name || value.username || value.symbol : value
    }`;
    
    await handleSendMessage(responseMessage);
    setAwaitingInput(null);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      toast({
        title: "Banner Uploaded",
        description: "Banner will be applied when quest is created",
      });
    }
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
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleUseQuest = () => {
    if (generatedQuest) {
      const questWithBanner = bannerFile 
        ? { ...generatedQuest, bannerFile }
        : generatedQuest;
      
      onQuestGenerated(questWithBanner);
      if (onClose) onClose();
    }
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
                    <Command>
                      <CommandInput
                        placeholder={`Search ${awaitingInput.type}s...`}
                        onValueChange={handleSearchInput}
                        className="text-white"
                      />
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {searchResults.map((item: any) => (
                          <CommandItem
                            key={item._id}
                            onSelect={() => {
                              handleInputResponse(item);
                              setSearchOpen(false);
                            }}
                            className="text-white hover:bg-gray-700"
                          >
                            <div className="flex items-center gap-2">
                              {(item.logo || item.profilePic) && (
                                <img 
                                  src={item.logo || item.profilePic} 
                                  alt="" 
                                  className="w-6 h-6 rounded-full" 
                                />
                              )}
                              <div>
                                <p className="font-medium">
                                  {item.communityName || item.name || item.username}
                                </p>
                                <p className="text-xs text-gray-400">
                                  @{item.username}
                                </p>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        );

      case 'banner':
        return (
          <Card className="bg-purple-950/50 border-purple-600/50 mb-4">
            <CardContent className="p-4">
              <div className="space-y-3">
                <p className="text-purple-200 text-sm">{awaitingInput.prompt}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex-1 border-purple-600/50 text-purple-400"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Banner
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
        return null;
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
          className={`max-w-[80%] rounded-lg p-3 ${
            isUser
              ? 'bg-purple-600 text-white'
              : isSystem
              ? 'bg-red-900 text-red-200'
              : 'bg-gray-700 text-gray-100'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {isUser ? (
              <User className="h-4 w-4" />
            ) : isSystem ? (
              <span className="text-red-400 text-xs font-medium">System</span>
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
      <Card className="flex-1 flex flex-col bg-black/60 backdrop-blur-xl border-purple-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-400" />
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
                    className="p-3 h-auto text-left border-purple-600/30 hover:border-purple-500/50 hover:bg-purple-950/30"
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
                  <span className="font-medium text-green-200">Quest Generated!</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUseQuest}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Use This Quest
                  </Button>
                  <Button
                    onClick={() => {
                      setQuestGenerated(false);
                      setGeneratedQuest(null);
                    }}
                    variant="outline"
                    className="border-gray-600 text-gray-400"
                  >
                    Continue Editing
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
              placeholder="Describe your quest idea or ask questions..."
              className="flex-1 bg-gray-800 border-gray-600 text-white"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!currentMessage.trim() || isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}