"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Plus,
  Settings,
  MessageCircle,
  TrendingUp,
  Bell,
  BellOff,
  Crown,
  Shield,
  User,
  Hash,
  Calendar,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Sidebar from "@/components/community/sidebar";
import RightSidebar from "@/components/community/right-sidebar";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  userMyCommunitiesApiService,
  type MyCommunity,
  type MyCommunitiesResponse,
  type MyCommunitiesStats,
} from "@/services/userCommunityServices/userMyCommunitiesApiServices";

const filters = [
  { id: "all", label: "All Communities", icon: Users },
  { id: "admin", label: "Admin", icon: Crown },
  { id: "moderator", label: "Moderator", icon: Shield },
  { id: "recent", label: "Recently Joined", icon: Calendar },
  { id: "active", label: "Recently Active", icon: TrendingUp },
];

const sortOptions = [
  { id: "recent", label: "Recently Joined" },
  { id: "name", label: "Name (A-Z)" },
  { id: "members", label: "Most Members" },
];

export default function CommunitiesPage() {
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.userAuth?.user);

  const [communities, setCommunities] = useState<MyCommunity[]>([]);
  const [stats, setStats] = useState<MyCommunitiesStats>({
    totalCommunities: 0,
    adminCommunities: 0,
    moderatorCommunities: 0,
    memberCommunities: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCommunities, setFilteredCommunities] = useState<MyCommunity[]>(
    []
  );
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [totalCount, setTotalCount] = useState(0);

  const [leavingCommunity, setLeavingCommunity] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState<MyCommunity | null>(
    null
  );

  // Load communities
  const loadCommunities = useCallback(
    async (reset: boolean = false) => {
      if (!currentUser) return;

      try {
        if (reset) {
          setLoading(true);
          setCommunities([]);
        } else {
          setLoadingMore(true);
        }

        setError(null);

        const cursor = reset ? undefined : nextCursor;
        const response: MyCommunitiesResponse =
          await userMyCommunitiesApiService.getMyCommunities(
            activeFilter,
            sortBy,
            cursor,
            20
          );

        if (reset) {
          setCommunities(response.communities);
        } else {
          setCommunities((prev) => [...prev, ...response.communities]);
        }

        setStats(response.stats);
        setHasMore(response.hasMore);
        setNextCursor(response.nextCursor);
        setTotalCount(response.totalCount);
      } catch (err: any) {
        console.error("Failed to load communities:", err);
        setError(err.message || "Failed to load communities");
        toast.error("Failed to load communities", {
          description: err.message || "Please try again",
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [currentUser, activeFilter, sortBy, nextCursor]
  );

  // Initial load
  useEffect(() => {
    loadCommunities(true);
  }, [activeFilter, sortBy]);

  // Filter and search communities
  useEffect(() => {
    let filtered = communities;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (community) =>
          community.communityName.toLowerCase().includes(query) ||
          community.username.toLowerCase().includes(query) ||
          community.description.toLowerCase().includes(query) ||
          community.category.toLowerCase().includes(query)
      );
    }

    setFilteredCommunities(filtered);
  }, [communities, searchQuery]);

  // Handle filter change
  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
  };

  // Handle sort change
  const handleSortChange = (sortId: string) => {
    setSortBy(sortId);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loadingMore && nextCursor) {
      loadCommunities(false);
    }
  };

  // Handle community click
  const handleCommunityClick = (community: MyCommunity) => {
    router.push(`/user/community/communities/${community.username}`);
  };

  // Handle settings click
  const handleSettingsClick = (e: React.MouseEvent, community: MyCommunity) => {
    e.stopPropagation();
    if (community.memberRole === "admin") {
      router.push(`/community-admin/${community.username}/dashboard`);
    } else {
      // TODO: Open community settings modal for notifications, etc.
      toast.info("Community settings coming soon");
    }
  };

  // Handle notifications toggle
  const handleNotificationsToggle = async (
    e: React.MouseEvent,
    community: MyCommunity
  ) => {
    e.stopPropagation();

    try {
      const newNotificationState = !community.notifications;
      await userMyCommunitiesApiService.updateCommunityNotifications(
        community._id,
        newNotificationState
      );

      // Update local state
      setCommunities((prev) =>
        prev.map((c) =>
          c._id === community._id
            ? { ...c, notifications: newNotificationState }
            : c
        )
      );

      toast.success(
        `Notifications ${newNotificationState ? "enabled" : "disabled"} for ${
          community.communityName
        }`
      );
    } catch (error: any) {
      console.error("Toggle notifications error:", error);
      toast.error("Failed to update notifications", {
        description: error.message || "Please try again",
      });
    }
  };

  // Handle leave community
  const handleLeaveCommunity = (
    e: React.MouseEvent,
    community: MyCommunity
  ) => {
    e.stopPropagation();
    setShowLeaveDialog(community);
  };

  // Handle leave confirmation
  const handleLeaveConfirm = async () => {
    if (!showLeaveDialog) return;

    const communityToLeave = showLeaveDialog;
    setLeavingCommunity(communityToLeave._id);

    try {
      const result = await userMyCommunitiesApiService.leaveCommunityFromMy(
        communityToLeave._id
      );

      if (result.success) {
        // Remove from local state
        setCommunities((prev) =>
          prev.filter((c) => c._id !== communityToLeave._id)
        );

        // Update stats
        setStats((prev) => ({
          ...prev,
          totalCommunities: Math.max(0, prev.totalCommunities - 1),
          [(communityToLeave.memberRole +
            "Communities") as keyof MyCommunitiesStats]: Math.max(
            0,
            (prev as any)[communityToLeave.memberRole + "Communities"] - 1
          ),
        }));

        setTotalCount((prev) => Math.max(0, prev - 1));

        toast.success(result.message);
        setShowLeaveDialog(null);
      }
    } catch (error: any) {
      console.error("Leave community error:", error);
      toast.error("Failed to leave community", {
        description: error.message || "Please try again",
      });
    } finally {
      setLeavingCommunity(null);
    }
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    const colors = userMyCommunitiesApiService.getRoleBadgeColor(role);
    const icons = {
      admin: Crown,
      moderator: Shield,
      member: User,
    };
    const Icon = icons[role as keyof typeof icons] || User;

    return (
      <Badge
        className={`${colors.bg} ${colors.text} ${colors.border} text-xs border`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  // Show loading
  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
          <div className="max-w-2xl mx-auto h-screen overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto" />
                <p className="text-slate-400">Loading your communities...</p>
              </div>
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
        <div className="max-w-2xl mx-auto h-screen overflow-y-auto scrollbar-hidden">
          <div className="space-y-6">
            {/* Header */}
            <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    My Communities
                  </h2>
                  <p className="text-slate-400">
                    {userMyCommunitiesApiService.formatMemberCount(totalCount)}{" "}
                    communities joined
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push("/user/community/explore")}
                    className="border-slate-600 text-slate-400 hover:text-white"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => router.push("/user/community/explore")}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Explore
                  </Button>
                </div>
              </div>

              {/* Stats */}
              {stats.totalCommunities > 0 && (
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {stats.totalCommunities}
                    </div>
                    <div className="text-xs text-slate-400">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-400">
                      {stats.adminCommunities}
                    </div>
                    <div className="text-xs text-slate-400">Admin</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">
                      {stats.moderatorCommunities}
                    </div>
                    <div className="text-xs text-slate-400">Moderator</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">
                      {stats.memberCommunities}
                    </div>
                    <div className="text-xs text-slate-400">Member</div>
                  </div>
                </div>
              )}

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search your communities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-400"
                />
              </div>

              {/* Filter and Sort Tabs */}
              <div className="flex flex-col gap-3">
                <div className="flex space-x-1 bg-slate-900/50 rounded-lg p-1 overflow-x-auto">
                  {filters.map((filter) => {
                    const Icon = filter.icon;
                    return (
                      <Button
                        key={filter.id}
                        variant={
                          activeFilter === filter.id ? "secondary" : "ghost"
                        }
                        size="sm"
                        onClick={() => handleFilterChange(filter.id)}
                        className={`flex-shrink-0 ${
                          activeFilter === filter.id
                            ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/30"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-1" />
                        {filter.label}
                      </Button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Sort by:</span>
                  <div className="flex space-x-1 bg-slate-900/50 rounded-lg p-1">
                    {sortOptions.map((option) => (
                      <Button
                        key={option.id}
                        variant={sortBy === option.id ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => handleSortChange(option.id)}
                        className={`text-xs ${
                          sortBy === option.id
                            ? "bg-slate-700 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Communities List */}
            <div className="px-4 space-y-4 pb-6">
              {error && communities.length === 0 ? (
                <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-12">
                  <div className="text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                    <p className="text-slate-400">{error}</p>
                    <Button
                      onClick={() => loadCommunities(true)}
                      variant="outline"
                      className="border-slate-600 hover:bg-slate-800"
                    >
                      Try Again
                    </Button>
                  </div>
                </Card>
              ) : filteredCommunities.length === 0 ? (
                <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-12">
                  <div className="text-center space-y-4">
                    <Users className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-lg text-slate-400">
                      {searchQuery.trim()
                        ? "No communities found"
                        : "No communities yet"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {searchQuery.trim()
                        ? "Try different search terms"
                        : "Join your first community to get started"}
                    </p>
                    {!searchQuery.trim() && (
                      <Button
                        onClick={() => router.push("/user/community/explore")}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Explore Communities
                      </Button>
                    )}
                  </div>
                </Card>
              ) : (
                <>
                  {filteredCommunities.map((community) => (
                    <Card
                      key={community._id}
                      className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 cursor-pointer p-6 group"
                      onClick={() => handleCommunityClick(community)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <Avatar className="w-16 h-16 ring-2 ring-slate-700/50 flex-shrink-0">
                            <AvatarImage
                              src={community.logo}
                              alt={community.communityName}
                            />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                              {userMyCommunitiesApiService.getCommunityAvatarFallback(
                                community.communityName
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {community.unreadPosts > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">
                                {community.unreadPosts > 9
                                  ? "9+"
                                  : community.unreadPosts}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 truncate">
                                  {community.communityName}
                                </h3>
                                {community.isVerified && (
                                  <div className="w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <p className="text-slate-400 text-sm mb-1">
                                @{community.username}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) =>
                                  handleNotificationsToggle(e, community)
                                }
                                className="text-slate-400 hover:text-white"
                                title={
                                  community.notifications
                                    ? "Disable notifications"
                                    : "Enable notifications"
                                }
                              >
                                {community.notifications ? (
                                  <Bell className="h-4 w-4" />
                                ) : (
                                  <BellOff className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) =>
                                  handleSettingsClick(e, community)
                                }
                                className="text-slate-400 hover:text-white"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                            {community.description}
                          </p>

                          <div className="flex items-center gap-4 mb-3 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>
                                {userMyCommunitiesApiService.formatMemberCount(
                                  community.memberCount
                                )}{" "}
                                members
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="border-slate-600 text-slate-400"
                            >
                              <Hash className="w-3 h-3 mr-1" />
                              {community.category}
                            </Badge>
                            {getRoleBadge(community.memberRole)}
                            <span className="text-xs">
                              Joined{" "}
                              {userMyCommunitiesApiService.formatTimeAgo(
                                community.joinedAt
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              {community.unreadPosts > 0 && (
                                <div className="flex items-center gap-1 text-cyan-400">
                                  <MessageCircle className="w-4 h-4" />
                                  <span className="font-medium">
                                    {community.unreadPosts} new
                                  </span>
                                </div>
                              )}
                              {community.lastActiveAt && (
                                <span>
                                  Active{" "}
                                  {userMyCommunitiesApiService.formatTimeAgo(
                                    community.lastActiveAt
                                  )}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {community.settings.allowGroupChat && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation(); // prevent Card click
                                    router.push(
                                      `/user/community/c/${community.username}`
                                    ); // go to profile
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="border-slate-600 hover:bg-slate-700/50"
                                >
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  Profile
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) =>
                                  handleLeaveCommunity(e, community)
                                }
                                className="border-slate-600 hover:bg-red-600/20 hover:border-red-400 hover:text-red-400"
                                disabled={leavingCommunity === community._id}
                              >
                                {leavingCommunity === community._id && (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                )}
                                Leave
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="text-center py-4">
                      <Button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        variant="outline"
                        className="border-slate-600 hover:bg-slate-800"
                      >
                        {loadingMore && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Load More Communities
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />

      {/* Leave Community Confirmation Dialog */}
      <Dialog
        open={!!showLeaveDialog}
        onOpenChange={() => setShowLeaveDialog(null)}
      >
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Leave {showLeaveDialog?.communityName}?
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              You will no longer have access to community posts and discussions.
              You can rejoin anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLeaveDialog(null)}
              disabled={!!leavingCommunity}
              className="border-slate-600 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLeaveConfirm}
              disabled={!!leavingCommunity}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {leavingCommunity && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Leave Community
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
