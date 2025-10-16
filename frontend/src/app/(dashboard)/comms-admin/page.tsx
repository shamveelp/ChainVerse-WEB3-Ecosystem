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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
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
      const response =
        await communityAdminDashboardApiService.getDashboardData();

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

  // ✅ CLICK HANDLERS - ALL FIXED
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
      <div className="min-h-screen bg-[var(--background-primary)] flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-[var(--text-secondary)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-[var(--background-primary)] flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <p className="text-[var(--text-primary)]">
            Failed to load dashboard data
          </p>
          <Button onClick={fetchDashboardData} className="premium-button">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-primary)] relative z-20">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {" "}
        {/* ADD pointer-events-none */}
        <div className="absolute inset-0 dark-gradient pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-accent-500/5 to-primary-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* ✅ FIXED LAYOUT - Higher z-index, no ScrollArea conflict */}
      <div className="relative z-20 grid grid-cols-12 gap-6 p-6 min-h-screen">
        {/* Left Side - Chat */}
        <div className="col-span-4">
          <Card className="premium-card h-full premium-shadow">
            <CardHeader className="border-b border-[var(--border-primary)]">
              <CardTitle className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary-500" />
                Community Chat
                <Badge className="ml-auto bg-accent-500/20 text-accent-500 border-accent-500/30">
                  Coming Soon
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-80px)]">
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="h-8 w-8 text-primary-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Chat Feature Coming Soon
                  </h3>
                  <p className="text-[var(--text-secondary)] max-w-xs">
                    Real-time community chat will be available in the next
                    update. Stay tuned for instant member communication!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Community Details */}
        <div className="col-span-8 space-y-6 pb-20">
          {" "}
          {/* ✅ Fixed padding for scrolling */}
          {/* Welcome Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold premium-gradient bg-clip-text text-transparent">
                {getGreeting()}! ✨
              </h1>
              <p className="text-[var(--text-secondary)] text-lg mt-2">
                Welcome back to your {dashboardData.communityOverview.name}{" "}
                dashboard
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[var(--text-tertiary)]">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          {/* Community Overview Card */}
          <Card className="premium-card premium-shadow overflow-hidden">
            <div className="relative h-32 bg-gradient-to-r from-primary-500/20 to-accent-500/20">
              {dashboardData.communityOverview.banner && (
                <img
                  src={dashboardData.communityOverview.banner}
                  alt="Community Banner"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
            </div>

            <CardContent className="p-6 -mt-8 relative">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16 border-4 border-[var(--background-elevated)] premium-shadow">
                  <AvatarImage
                    src={dashboardData.communityOverview.logo}
                    alt={dashboardData.communityOverview.name}
                  />
                  <AvatarFallback className="premium-gradient text-white text-xl font-bold">
                    {dashboardData.communityOverview.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                      {dashboardData.communityOverview.name}
                    </h2>
                    {dashboardData.communityOverview.isVerified && (
                      <div className="w-6 h-6 premium-gradient rounded-full flex items-center justify-center">
                        <Star className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-[var(--text-secondary)] text-sm mb-2">
                    @{dashboardData.communityOverview.username}
                  </p>
                  <p className="text-[var(--text-secondary)] mb-4 leading-relaxed">
                    {dashboardData.communityOverview.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>
                        {formatNumber(
                          dashboardData.communityOverview.memberCount
                        )}{" "}
                        members
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-4 w-4 text-success" />
                      <span>
                        {formatNumber(
                          dashboardData.communityOverview.activeMembers
                        )}{" "}
                        active
                      </span>
                    </div>
                    <Badge className="bg-primary-500/20 text-primary-500 border-primary-500/30">
                      {dashboardData.communityOverview.category}
                    </Badge>
                  </div>
                </div>

                {/* ✅ FIXED: Clickable Settings Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="premium-border hover:scale-105 transition-transform"
                  onClick={handleSettingsClick}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Quick Stats - ✅ ALL CLICKABLE */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              className="premium-card premium-shadow cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => handleStatsClick("members")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--text-tertiary)] text-sm">
                      Total Members
                    </p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {formatNumber(dashboardData.stats.totalMembers)}
                    </p>
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span className="text-success">
                        +{dashboardData.stats.newMembersThisWeek} this week
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="premium-card premium-shadow cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => handleStatsClick("active")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--text-tertiary)] text-sm">
                      Active Today
                    </p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {formatNumber(dashboardData.stats.activeMembers)}
                    </p>
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <Activity className="h-3 w-3 text-success" />
                      <span className="text-success">
                        {(
                          (dashboardData.stats.activeMembers /
                            dashboardData.stats.totalMembers) *
                          100
                        ).toFixed(1)}
                        % active
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                    <Activity className="h-6 w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="premium-card premium-shadow cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => handleStatsClick("posts")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--text-tertiary)] text-sm">Posts</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {formatNumber(dashboardData.stats.totalPosts)}
                    </p>
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <MessageSquare className="h-3 w-3 text-blue-400" />
                      <span className="text-blue-400">
                        +{dashboardData.stats.postsToday} today
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="premium-card premium-shadow cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => handleStatsClick("engagement")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--text-tertiary)] text-sm">
                      Engagement
                    </p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {dashboardData.stats.engagementRate.toFixed(1)}%
                    </p>
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <Heart className="h-3 w-3 text-accent-500" />
                      <span className="text-accent-500">
                        {formatNumber(dashboardData.stats.totalLikes)} likes
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-accent-500/20 rounded-full flex items-center justify-center">
                    <Heart className="h-6 w-6 text-accent-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Recent Activity & Top Members */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="premium-card premium-shadow">
              <CardHeader className="border-b border-[var(--border-primary)]">
                <CardTitle className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-80">
                  <div className="p-4 space-y-4">
                    {dashboardData.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--background-secondary)] transition-colors cursor-pointer"
                        onClick={() =>
                          toast.info(`${activity.user.name} ${activity.action}`)
                        }
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={activity.user.profilePic}
                            alt={activity.user.name}
                          />
                          <AvatarFallback className="premium-gradient text-white text-xs">
                            {activity.user.name.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text-primary)] truncate">
                            <span className="font-medium">
                              {activity.user.name}
                            </span>{" "}
                            {activity.action}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {activity.type === "join" && (
                            <UserPlus className="h-4 w-4 text-success" />
                          )}
                          {activity.type === "post" && (
                            <MessageSquare className="h-4 w-4 text-blue-400" />
                          )}
                          {activity.type === "like" && (
                            <Heart className="h-4 w-4 text-red-400" />
                          )}
                          {activity.type === "comment" && (
                            <MessageCircle className="h-4 w-4 text-purple-400" />
                          )}
                        </div>
                      </div>
                    ))}

                    {dashboardData.recentActivity.length === 0 && (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
                        <p className="text-[var(--text-secondary)]">
                          No recent activity
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Top Members */}
            <Card className="premium-card premium-shadow">
              <CardHeader className="border-b border-[var(--border-primary)]">
                <CardTitle className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-accent-500" />
                  Top Members
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-80">
                  <div className="p-4 space-y-4">
                    {dashboardData.topMembers.map((member, index) => (
                      <div
                        key={member._id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--background-secondary)] transition-colors cursor-pointer"
                        onClick={() =>
                          toast.info(`View ${member.name}'s profile`)
                        }
                      >
                        <div className="flex-shrink-0 w-6 text-center">
                          <span
                            className={`text-sm font-bold ${
                              index === 0
                                ? "text-accent-500"
                                : index === 1
                                ? "text-gray-400"
                                : index === 2
                                ? "text-amber-600"
                                : "text-[var(--text-tertiary)]"
                            }`}
                          >
                            #{index + 1}
                          </span>
                        </div>

                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={member.profilePic}
                            alt={member.name}
                          />
                          <AvatarFallback className="premium-gradient text-white text-xs">
                            {member.name.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {member.name}
                            </p>
                            {member.isPremium && (
                              <Crown className="h-3 w-3 text-accent-500" />
                            )}
                            {member.role !== "member" && (
                              <Badge className="text-xs bg-primary-500/20 text-primary-500 border-primary-500/30">
                                {member.role}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mt-1">
                            <span>{formatNumber(member.totalPosts)} posts</span>
                            <span>•</span>
                            <span>{formatNumber(member.totalLikes)} likes</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {dashboardData.topMembers.length === 0 && (
                      <div className="text-center py-8">
                        <Trophy className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
                        <p className="text-[var(--text-secondary)]">
                          No member data available
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          {/* Community Settings Quick Access */}
          <Card className="premium-card premium-shadow">
            <CardHeader className="border-b border-[var(--border-primary)]">
              <CardTitle className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary-500" />
                Community Features
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  className={`p-4 rounded-lg border-2 transition-colors cursor-pointer hover:scale-105 ${
                    dashboardData.communityOverview.settings.allowPosts
                      ? "border-success/30 bg-success/10"
                      : "border-[var(--border-secondary)] bg-[var(--background-secondary)]"
                  }`}
                  onClick={() => toast.info("Posts Settings")}
                >
                  <MessageSquare
                    className={`h-6 w-6 mb-2 ${
                      dashboardData.communityOverview.settings.allowPosts
                        ? "text-success"
                        : "text-[var(--text-tertiary)]"
                    }`}
                  />
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Posts
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {dashboardData.communityOverview.settings.allowPosts
                      ? "Enabled"
                      : "Disabled"}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 transition-colors cursor-pointer hover:scale-105 ${
                    dashboardData.communityOverview.settings.allowGroupChat
                      ? "border-success/30 bg-success/10"
                      : "border-[var(--border-secondary)] bg-[var(--background-secondary)]"
                  }`}
                  onClick={() => toast.info("Group Chat Settings")}
                >
                  <MessageCircle
                    className={`h-6 w-6 mb-2 ${
                      dashboardData.communityOverview.settings.allowGroupChat
                        ? "text-success"
                        : "text-[var(--text-tertiary)]"
                    }`}
                  />
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Group Chat
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {dashboardData.communityOverview.settings.allowGroupChat
                      ? "Enabled"
                      : "Disabled"}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 transition-colors cursor-pointer hover:scale-105 ${
                    dashboardData.communityOverview.settings.allowQuests
                      ? "border-success/30 bg-success/10"
                      : "border-[var(--border-secondary)] bg-[var(--background-secondary)]"
                  }`}
                  onClick={() => toast.info("Quests Settings")}
                >
                  <Trophy
                    className={`h-6 w-6 mb-2 ${
                      dashboardData.communityOverview.settings.allowQuests
                        ? "text-success"
                        : "text-[var(--text-tertiary)]"
                    }`}
                  />
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Quests
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {dashboardData.communityOverview.settings.allowQuests
                      ? "Enabled"
                      : "Disabled"}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 transition-colors cursor-pointer hover:scale-105 ${
                    dashboardData.communityOverview.settings.allowChainCast
                      ? "border-success/30 bg-success/10"
                      : "border-[var(--border-secondary)] bg-[var(--background-secondary)]"
                  }`}
                  onClick={() => toast.info("ChainCast Settings")}
                >
                  <BarChart3
                    className={`h-6 w-6 mb-2 ${
                      dashboardData.communityOverview.settings.allowChainCast
                        ? "text-success"
                        : "text-[var(--text-tertiary)]"
                    }`}
                  />
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    ChainCast
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {dashboardData.communityOverview.settings.allowChainCast
                      ? "Enabled"
                      : "Disabled"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Social Links */}
          {dashboardData.communityOverview.socialLinks.length > 0 && (
            <Card className="premium-card premium-shadow">
              <CardHeader className="border-b border-[var(--border-primary)]">
                <CardTitle className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary-500" />
                  Social Links
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-3">
                  {dashboardData.communityOverview.socialLinks.map(
                    (link, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="premium-border hover:scale-105 transition-transform"
                        onClick={() => handleSocialLinkClick(link.url)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {link.platform}
                      </Button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
