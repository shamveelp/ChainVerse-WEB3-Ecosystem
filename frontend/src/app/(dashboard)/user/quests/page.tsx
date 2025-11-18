"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  Coins, 
  Award, 
  Star,
  ArrowRight,
  Target,
  Clock,
  Sparkles,
  Crown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { userQuestApiService } from '@/services/quests/userQuestApiService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from '@/components/home/navbar';

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
  isParticipating?: boolean;
  participationStatus?: string;
  completedTasks?: number;
}

interface MyQuest {
  _id: string;
  quest: Quest;
  status: string;
  joinedAt: Date;
  completedAt?: Date;
  totalTasksCompleted: number;
  isWinner: boolean;
  rewardClaimed: boolean;
  progress: number;
}

// Static data for top quests carousel
const topQuestsData = [
  {
    _id: "1",
    title: "DeFi Masters Challenge",
    description: "Complete advanced DeFi tasks and earn exclusive rewards in this comprehensive quest",
    bannerImage: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&q=80",
    rewardPool: { amount: 5000, currency: "USDC", rewardType: "token" },
    totalParticipants: 2847,
    participantLimit: 100,
    status: "active",
    community: { communityName: "DeFi Alliance", logo: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=100&q=80" }
  },
  {
    _id: "2", 
    title: "NFT Creator Bootcamp",
    description: "Learn NFT creation, minting, and marketplace strategies in this creative quest",
    bannerImage: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&q=80",
    rewardPool: { amount: 10, currency: "ETH", rewardType: "token" },
    totalParticipants: 1956,
    participantLimit: 50,
    status: "active",
    community: { communityName: "NFT Creators Hub", logo: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=100&q=80" }
  },
  {
    _id: "3",
    title: "Web3 Development Track",
    description: "Build smart contracts, dApps, and explore Web3 development fundamentals",
    bannerImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80",
    rewardPool: { amount: 2500, currency: "MATIC", rewardType: "token" },
    totalParticipants: 3421,
    participantLimit: 200,
    status: "active",
    community: { communityName: "Dev3 Community", logo: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=100&q=80" }
  },
  {
    _id: "4",
    title: "Crypto Trading Academy",
    description: "Master trading strategies, technical analysis, and risk management",
    bannerImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    rewardPool: { amount: 1000, currency: "BTC", rewardType: "token" },
    totalParticipants: 4102,
    participantLimit: 150,
    status: "active",
    community: { communityName: "Traders United", logo: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&q=80" }
  },
  {
    _id: "5",
    title: "Blockchain Gaming Quest",
    description: "Explore P2E games, NFT gaming, and the future of blockchain gaming",
    bannerImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    rewardPool: { amount: 500, currency: "RARE", rewardType: "nft" },
    totalParticipants: 2134,
    participantLimit: 75,
    status: "active",
    community: { communityName: "GameFi Guild", logo: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=100&q=80" }
  }
];

export default function QuestsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [myQuests, setMyQuests] = useState<MyQuest[]>([]);
  const [topQuests, setTopQuests] = useState<Quest[]>(topQuestsData as any);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [rewardFilter, setRewardFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  useEffect(() => {
    fetchQuests();
  }, [activeTab, currentPage, sortBy, sortOrder, rewardFilter]);

  useEffect(() => {
    fetchTopQuests();
  }, []);

  const fetchQuests = async () => {
    setLoading(true);
    try {
      if (activeTab === "my") {
        const response = await userQuestApiService.getMyQuests({
          page: currentPage,
          limit: 12,
          search: searchTerm || undefined
        });
        if (response.success && response.data) {
          setMyQuests(response.data.quests || []);
          setTotalPages(response.data.pagination.pages);
        }
      } else {
        const response = await userQuestApiService.getAvailableQuests({
          page: currentPage,
          limit: 12,
          status: activeTab === 'all' ? undefined : activeTab as any,
          search: searchTerm || undefined,
          sortBy,
          sortOrder,
          rewardType: rewardFilter === 'all' ? undefined : rewardFilter as any
        });
        if (response.success && response.data) {
          setQuests(response.data.quests || []);
          setTotalPages(response.data.pagination.pages);
        }
      }
    } catch (error) {
      console.error("Failed to fetch quests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopQuests = async () => {
    try {
      const response = await userQuestApiService.getTopQuests(10);
      if (response.success && response.data) {
        setTopQuests(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch top quests:", error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchQuests();
  };

  const nextCarouselSlide = () => {
    setCurrentCarouselIndex((prev) => (prev + 1) % topQuests.length);
  };

  const prevCarouselSlide = () => {
    setCurrentCarouselIndex((prev) => (prev - 1 + topQuests.length) % topQuests.length);
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

  const getParticipationStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-600";
      case "winner": return "bg-purple-600";
      case "disqualified": return "bg-red-600";
      case "in_progress": return "bg-blue-600";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            ChainVerse Quests
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover exciting Web3 quests, complete challenges, and earn amazing rewards from communities worldwide
          </p>
        </div>

        {/* Top Quests Carousel */}
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-400" />
              Featured Quests
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevCarouselSlide}
                className="border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextCarouselSlide}
                className="border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentCarouselIndex * 100}%)` }}
            >
              {topQuests.map((quest, index) => (
                <div key={quest._id} className="w-full flex-shrink-0">
                  <Card className="relative h-80 overflow-hidden bg-black/60 backdrop-blur-xl border-purple-800/30 cursor-pointer group"
                        onClick={() => router.push(`/user/quests/${quest._id}`)}>
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${quest.bannerImage})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                    </div>
                    
                    <CardContent className="relative h-full flex items-end p-8">
                      <div className="space-y-4 w-full">
                        <div className="flex items-center gap-3">
                          <img
                            src={quest.community?.logo}
                            alt={quest.community?.communityName}
                            className="w-12 h-12 rounded-full border-2 border-white/20"
                          />
                          <div>
                            <p className="text-white/80 text-sm">{quest.community?.communityName}</p>
                            <p className="text-white font-semibold">{quest.title}</p>
                          </div>
                        </div>
                        
                        <p className="text-gray-200 text-sm line-clamp-2 max-w-md">
                          {quest.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-300">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{quest.totalParticipants.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getRewardTypeIcon(quest.rewardPool.rewardType)}
                              <span>{quest.rewardPool.amount} {quest.rewardPool.currency}</span>
                            </div>
                          </div>
                          
                          <Button 
                            className="bg-purple-600 hover:bg-purple-700 text-white group-hover:translate-x-1 transition-transform"
                            size="sm"
                          >
                            View Quest <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="flex justify-center mt-4 gap-2">
            {topQuests.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentCarouselIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentCarouselIndex === index ? 'bg-purple-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-black/40 backdrop-blur-xl border-purple-800/30">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search quests by title, community, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 bg-gray-800/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="createdAt">Latest</SelectItem>
                    <SelectItem value="totalParticipants">Most Popular</SelectItem>
                    <SelectItem value="startDate">Start Date</SelectItem>
                    <SelectItem value="endDate">End Date</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={rewardFilter} onValueChange={setRewardFilter}>
                  <SelectTrigger className="w-32 bg-gray-800/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="all">All Rewards</SelectItem>
                    <SelectItem value="token">Tokens</SelectItem>
                    <SelectItem value="nft">NFTs</SelectItem>
                    <SelectItem value="points">Points</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleSearch}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quest Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 bg-black/40 backdrop-blur-xl border border-purple-800/30">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
            >
              All Quests
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
            >
              Active
            </TabsTrigger>
            <TabsTrigger
              value="ended"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
            >
              Ended
            </TabsTrigger>
            <TabsTrigger
              value="my"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
            >
              My Quests
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="bg-black/40 backdrop-blur-xl border-purple-800/30 animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="h-6 bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-20 bg-gray-700 rounded"></div>
                        <div className="flex gap-2">
                          <div className="h-8 bg-gray-700 rounded flex-1"></div>
                          <div className="h-8 bg-gray-700 rounded flex-1"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {activeTab === "my" ? (
                  myQuests.length === 0 ? (
                    <Card className="bg-black/40 backdrop-blur-xl border-purple-800/30">
                      <CardContent className="p-12 text-center">
                        <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Quests Yet</h3>
                        <p className="text-gray-400 mb-6">
                          You haven't joined any quests yet. Start exploring and join exciting quests to earn rewards!
                        </p>
                        <Button
                          onClick={() => setActiveTab('all')}
                          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
                        >
                          <Trophy className="h-4 w-4 mr-2" />
                          Explore Quests
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myQuests.map((myQuest) => (
                        <Card key={myQuest._id} className="bg-black/40 backdrop-blur-xl border-purple-800/30 hover:border-purple-700/50 transition-all duration-300 cursor-pointer group"
                              onClick={() => router.push(`/user/quests/${myQuest.quest._id}`)}>
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              {/* Quest Header */}
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                                    {myQuest.quest.title}
                                  </h3>
                                  <div className="flex flex-col items-end gap-1 ml-2">
                                    <Badge className={`${getParticipationStatusColor(myQuest.status)} text-white text-xs`}>
                                      {myQuest.status}
                                    </Badge>
                                    {myQuest.isWinner && (
                                      <Crown className="h-4 w-4 text-yellow-400" />
                                    )}
                                  </div>
                                </div>
                                <p className="text-gray-400 text-sm line-clamp-2">{myQuest.quest.description}</p>
                              </div>

                              {/* Community Info */}
                              {myQuest.quest.community && (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={myQuest.quest.community.logo}
                                    alt={myQuest.quest.community.communityName}
                                    className="w-6 h-6 rounded-full"
                                  />
                                  <span className="text-sm text-gray-300">{myQuest.quest.community.communityName}</span>
                                </div>
                              )}

                              {/* Progress */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-400">Progress</span>
                                  <span className="text-white font-medium">{myQuest.progress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${myQuest.progress}%` }}
                                  />
                                </div>
                              </div>

                              {/* Quest Stats */}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Target className="h-4 w-4" />
                                  <span>{myQuest.totalTasksCompleted} tasks done</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  {getRewardTypeIcon(myQuest.quest.rewardPool.rewardType)}
                                  <span>{myQuest.quest.rewardPool.amount} {myQuest.quest.rewardPool.currency}</span>
                                </div>
                              </div>

                              {/* Action Button */}
                              <Button
                                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white group-hover:shadow-lg transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/user/quests/${myQuest.quest._id}`);
                                }}
                              >
                                {myQuest.status === 'completed' ? 'View Results' : 'Continue Quest'}
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                ) : (
                  quests.length === 0 ? (
                    <Card className="bg-black/40 backdrop-blur-xl border-purple-800/30">
                      <CardContent className="p-12 text-center">
                        <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Quests Found</h3>
                        <p className="text-gray-400 mb-6">
                          No quests match your current filters. Try adjusting your search criteria.
                        </p>
                        <Button
                          onClick={() => {
                            setSearchTerm("");
                            setRewardFilter("all");
                            setSortBy("createdAt");
                            setActiveTab("all");
                            fetchQuests();
                          }}
                          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Clear Filters
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {quests.map((quest) => (
                        <Card key={quest._id} className="bg-black/40 backdrop-blur-xl border-purple-800/30 hover:border-purple-700/50 transition-all duration-300 cursor-pointer group"
                              onClick={() => router.push(`/user/quests/${quest._id}`)}>
                          {quest.bannerImage && (
                            <div className="relative h-48 overflow-hidden rounded-t-lg">
                              <img
                                src={quest.bannerImage}
                                alt={quest.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-3 right-3 flex gap-2">
                                <Badge className={`${getStatusColor(quest.status)} text-white`}>
                                  {quest.status}
                                </Badge>
                                {quest.isAIGenerated && (
                                  <Badge variant="outline" className="border-blue-500 text-blue-400 bg-blue-950/30">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    AI
                                  </Badge>
                                )}
                              </div>
                              {quest.isParticipating && (
                                <div className="absolute top-3 left-3">
                                  <Badge className="bg-green-600 text-white">
                                    Joined
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}

                          <CardContent className="p-6">
                            <div className="space-y-4">
                              {/* Quest Header */}
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                                    {quest.title}
                                  </h3>
                                  {!quest.bannerImage && (
                                    <div className="flex gap-1 ml-2">
                                      <Badge className={`${getStatusColor(quest.status)} text-white text-xs`}>
                                        {quest.status}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                <p className="text-gray-400 text-sm line-clamp-2">{quest.description}</p>
                              </div>

                              {/* Community Info */}
                              {quest.community && (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={quest.community.logo}
                                    alt={quest.community.communityName}
                                    className="w-6 h-6 rounded-full"
                                  />
                                  <span className="text-sm text-gray-300">{quest.community.communityName}</span>
                                </div>
                              )}

                              {/* Quest Stats */}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Users className="h-4 w-4" />
                                  <span>{quest.totalParticipants.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Trophy className="h-4 w-4" />
                                  <span>{quest.participantLimit} winners</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(quest.endDate)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  {getRewardTypeIcon(quest.rewardPool.rewardType)}
                                  <span>{quest.rewardPool.amount} {quest.rewardPool.currency}</span>
                                </div>
                              </div>

                              {/* Action Button */}
                              <Button
                                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white group-hover:shadow-lg transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/user/quests/${quest._id}`);
                                }}
                              >
                                {quest.isParticipating ? 'Continue' : 'View Quest'}
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page 
                              ? "bg-purple-600 text-white" 
                              : "border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
                            }
                            size="sm"
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}