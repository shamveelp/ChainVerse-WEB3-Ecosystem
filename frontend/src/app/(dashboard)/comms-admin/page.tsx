"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  TrendingUp,
  Crown,
  MessageSquare,
  Trophy,
  Activity,
  Sparkles,
  Star,
  Clock,
  UserPlus,
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  Share,
  Settings,
  ExternalLink,
} from "lucide-react";
import { communityAdminDashboardApiService } from "@/services/communityAdmin/communityAdminDashboardApiService";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { COMMUNITY_ADMIN_ROUTES } from "@/routes";

interface DashboardData {
  communityOverview: {
    _id: string;
    name: string;
    username: string;
    description: string;
    category: string;
    logo: string;
    banner: string;
    memberCount: number;
    activeMembers: number;
    isVerified: boolean;
    settings: {
      allowChainCast: boolean;
      allowGroupChat: boolean;
      allowPosts: boolean;
      allowQuests: boolean;
    };
    socialLinks: Array<{
      platform: string;
      url: string;
    }>;
  };
  stats: {
    totalMembers: number;
    activeMembers: number;
    newMembersToday: number;
    newMembersThisWeek: number;
    totalPosts: number;
    postsToday: number;
    totalLikes: number;
    totalComments: number;
    engagementRate: number;
    growthRate: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    user: {
      _id: string;
      username: string;
      name: string;
      profilePic: string;
      isVerified: boolean;
    };
    action: string;
    timestamp: Date;
  }>;
  topMembers: Array<{
    _id: string;
    username: string;
    name: string;
    profilePic: string;
    isVerified: boolean;
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    questsCompleted: number;
    joinedAt: Date;
    role: string;
    isPremium: boolean;
  }>;
}

export default function CommunityAdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await communityAdminDashboardApiService.getDashboardData();
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        toast.error(response.error || "Failed to fetch dashboard data");
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleSettingsClick = () => {
    router.push(COMMUNITY_ADMIN_ROUTES.SETTINGS);
    toast.success("Navigating to Settings...");
  };

  const handleSocialLinkClick = (url: string) => {
    window.open(url, "_blank");
    toast.success(`Opened ${url}`);
  };

  const handleStatsClick = (type: string) => {
    const messages = {
      members: "View Members Analytics",
      active: "View Activity Report",
      posts: "View Posts Feed",
      engagement: "View Engagement Analytics",
    };
    toast.info(messages[type as keyof typeof messages]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-950 flex items-center justify-center z-50">
        <div className="text-center space-y-4 animate-pulse">
          <div className="h-12 w-12 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin"></div>
          <p className="text-white text-lg font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-950 flex items-center justify-center z-50">
        <div className="text-center space-y-6">
          <p className="text-white text-xl font-semibold">Failed to load dashboard data</p>
          <Button onClick={fetchDashboardData} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-950 relative z-20">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-950/50 to-purple-950/50" />
        <div className="absolute top-1/5 left-1/5 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/5 right-1/5 w-64 h-64 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main Content */}
      <div className="relative z-20 container mx-auto p-4 sm:p-6 lg:p-8 xl:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Side - Chat */}
          <div className="lg:col-span-4">
            <Card className="bg-gray-800/80 backdrop-blur-lg border border-blue-500/30 shadow-lg shadow-blue-500/10 h-full transition-all duration-300 hover:shadow-blue-500/20">
              <CardHeader className="border-b border-blue-500/30">
                <CardTitle className="text-xl font-semibold text-white flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  Community Chat
                  <Badge className="ml-auto bg-purple-500/20 text-purple-300 border-purple-500/30">Coming Soon</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                      <MessageSquare className="h-8 w-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Chat Feature Coming Soon</h3>
                    <p className="text-gray-300 text-sm max-w-xs mx-auto">
                      Real-time community chat will be available in the next update. Stay tuned!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Community Details */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                  {getGreeting()}! ✨
                </h1>
                <p className="text-gray-300 text-base sm:text-lg mt-2">
                  Welcome to your {dashboardData.communityOverview.name} dashboard
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-400">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-lg font-semibold text-white">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Community Overview Card */}
            <Card className="bg-gray-800/80 backdrop-blur-lg border border-blue-500/30 shadow-lg shadow-blue-500/10 overflow-hidden transition-all duration-300 hover:shadow-blue-500/20">
              <div className="relative h-32 sm:h-40 bg-gradient-to-r from-blue-600/30 to-purple-600/30">
                {dashboardData.communityOverview.banner && (
                  <img
                    src={dashboardData.communityOverview.banner}
                    alt="Community Banner"
                    className="w-full h-full object-cover opacity-80"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 to-transparent" />
              </div>
              <CardContent className="p-4 sm:p-6 relative -mt-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-gray-800 shadow-lg shadow-blue-500/20">
                    <AvatarImage src={dashboardData.communityOverview.logo} alt={dashboardData.communityOverview.name} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-bold">
                      {dashboardData.communityOverview.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-white">{dashboardData.communityOverview.name}</h2>
                      {dashboardData.communityOverview.isVerified && (
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Star className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm mb-2">@{dashboardData.communityOverview.username}</p>
                    <p className="text-gray-300 text-sm sm:text-base mb-4 leading-relaxed">
                      {dashboardData.communityOverview.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-blue-400" />
                        <span>{formatNumber(dashboardData.communityOverview.memberCount)} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4 text-green-400" />
                        <span>{formatNumber(dashboardData.communityOverview.activeMembers)} active</span>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        {dashboardData.communityOverview.category}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-blue-500/50 text-blue-300 hover:bg-blue-600/20 hover:text-blue-200 transition-all duration-300"
                    onClick={handleSettingsClick}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Total Members",
                  value: formatNumber(dashboardData.stats.totalMembers),
                  subValue: `+${dashboardData.stats.newMembersThisWeek} this week`,
                  icon: Users,
                  color: "blue-400",
                  type: "members",
                },
                {
                  title: "Active Today",
                  value: formatNumber(dashboardData.stats.activeMembers),
                  subValue: `${((dashboardData.stats.activeMembers / dashboardData.stats.totalMembers) * 100).toFixed(1)}% active`,
                  icon: Activity,
                  color: "green-400",
                  type: "active",
                },
                {
                  title: "Posts",
                  value: formatNumber(dashboardData.stats.totalPosts),
                  subValue: `+${dashboardData.stats.postsToday} today`,
                  icon: MessageSquare,
                  color: "purple-400",
                  type: "posts",
                },
                {
                  title: "Engagement",
                  value: `${dashboardData.stats.engagementRate.toFixed(1)}%`,
                  subValue: `${formatNumber(dashboardData.stats.totalLikes)} likes`,
                  icon: Heart,
                  color: "pink-400",
                  type: "engagement",
                },
              ].map((stat) => (
                <Card
                  key={stat.title}
                  className={`bg-gray-800/80 backdrop-blur-lg border border-${stat.color}/30 shadow-lg shadow-${stat.color}/10 cursor-pointer hover:shadow-${stat.color}/20 transition-all duration-300`}
                  onClick={() => handleStatsClick(stat.type)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">{stat.title}</p>
                        <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                        <div className="flex items-center gap-1 text-xs mt-1">
                          <TrendingUp className={`h-3 w-3 text-${stat.color}`} />
                          <span className={`text-${stat.color}`}>{stat.subValue}</span>
                        </div>
                      </div>
                      <div className={`w-12 h-12 bg-${stat.color}/20 rounded-full flex items-center justify-center`}>
                        <stat.icon className={`h-6 w-6 text-${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Activity & Top Members */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Recent Activity */}
              <Card className="bg-gray-800/80 backdrop-blur-lg border border-blue-500/30 shadow-lg shadow-blue-500/10">
                <CardHeader className="border-b border-blue-500/30">
                  <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-80">
                    <div className="p-4 space-y-3">
                      {dashboardData.recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-200 cursor-pointer"
                          onClick={() => toast.info(`${activity.user.name} ${activity.action}`)}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={activity.user.profilePic} alt={activity.user.name} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
                              {activity.user.name.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              <span className="font-medium">{activity.user.name}</span> {activity.action}
                            </p>
                            <p className="text-xs text-gray-400">{formatTimeAgo(activity.timestamp)}</p>
                          </div>
                          <div className="flex-shrink-0">
                            {activity.type === "join" && <UserPlus className="h-4 w-4 text-green-400" />}
                            {activity.type === "post" && <MessageSquare className="h-4 w-4 text-purple-400" />}
                            {activity.type === "like" && <Heart className="h-4 w-4 text-pink-400" />}
                            {activity.type === "comment" && <MessageCircle className="h-4 w-4 text-blue-400" />}
                          </div>
                        </div>
                      ))}
                      {dashboardData.recentActivity.length === 0 && (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-300">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Top Members */}
              <Card className="bg-gray-800/80 backdrop-blur-lg border border-blue-500/30 shadow-lg shadow-blue-500/10">
                <CardHeader className="border-b border-blue-500/30">
                  <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    Top Members
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-80">
                    <div className="p-4 space-y-3">
                      {dashboardData.topMembers.map((member, index) => (
                        <div
                          key={member._id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-200 cursor-pointer"
                          onClick={() => toast.info(`View ${member.name}'s profile`)}
                        >
                          <div className="flex-shrink-0 w-6 text-center">
                            <span
                              className={`text-sm font-bold ${
                                index === 0
                                  ? "text-yellow-400"
                                  : index === 1
                                  ? "text-gray-300"
                                  : index === 2
                                  ? "text-amber-400"
                                  : "text-gray-400"
                              }`}
                            >
                              #{index + 1}
                            </span>
                          </div>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={member.profilePic} alt={member.name} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
                              {member.name.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white truncate">{member.name}</p>
                              {member.isPremium && <Crown className="h-3 w-3 text-yellow-400" />}
                              {member.role !== "member" && (
                                <Badge className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                                  {member.role}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                              <span>{formatNumber(member.totalPosts)} posts</span>
                              <span>•</span>
                              <span>{formatNumber(member.totalLikes)} likes</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {dashboardData.topMembers.length === 0 && (
                        <div className="text-center py-8">
                          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-300">No member data available</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Community Features */}
            <Card className="bg-gray-800/80 backdrop-blur-lg border border-blue-500/30 shadow-lg shadow-blue-500/10">
              <CardHeader className="border-b border-blue-500/30">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-400" />
                  Community Features
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      title: "Posts",
                      enabled: dashboardData.communityOverview.settings.allowPosts,
                      icon: MessageSquare,
                      onClick: () => toast.info("Posts Settings"),
                    },
                    {
                      title: "Group Chat",
                      enabled: dashboardData.communityOverview.settings.allowGroupChat,
                      icon: MessageCircle,
                      onClick: () => toast.info("Group Chat Settings"),
                    },
                    {
                      title: "Quests",
                      enabled: dashboardData.communityOverview.settings.allowQuests,
                      icon: Trophy,
                      onClick: () => toast.info("Quests Settings"),
                    },
                    {
                      title: "ChainCast",
                      enabled: dashboardData.communityOverview.settings.allowChainCast,
                      icon: BarChart3,
                      onClick: () => toast.info("ChainCast Settings"),
                    },
                  ].map((feature) => (
                    <div
                      key={feature.title}
                      className={`p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:scale-105 ${
                        feature.enabled
                          ? "border-blue-500/30 bg-blue-500/10"
                          : "border-gray-700 bg-gray-700/50"
                      }`}
                      onClick={feature.onClick}
                    >
                      <feature.icon
                        className={`h-6 w-6 mb-2 ${feature.enabled ? "text-blue-400" : "text-gray-400"}`}
                      />
                      <p className="text-sm font-medium text-white">{feature.title}</p>
                      <p className="text-xs text-gray-300">{feature.enabled ? "Enabled" : "Disabled"}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            {dashboardData.communityOverview.socialLinks.length > 0 && (
              <Card className="bg-gray-800/80 backdrop-blur-lg border border-blue-500/30 shadow-lg shadow-blue-500/10">
                <CardHeader className="border-b border-blue-500/30">
                  <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-blue-400" />
                    Social Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-wrap gap-3">
                    {dashboardData.communityOverview.socialLinks.map((link, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 border-blue-500/50 text-blue-300 hover:bg-blue-600/20 hover:text-blue-200 transition-all duration-300"
                        onClick={() => handleSocialLinkClick(link.url)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {link.platform}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}