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
  ChevronLeft,
} from "lucide-react";
import ChainCastJoinButton from "@/components/chainCast/chainCastJoinButton";
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
  { id: "all", label: "All", icon: Users },
  { id: "admin", label: "Admin", icon: Crown },
  { id: "moderator", label: "Mod", icon: Shield },
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
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

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
        setHasMore(response.hasMore);
        setNextCursor(response.nextCursor);
      } catch (err: unknown) {
        console.error("Failed to load communities:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load communities";
        setError(errorMessage);
        toast.error("Failed to load communities");
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

  // Handle filter change
  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loadingMore && nextCursor) {
      loadCommunities(false);
    }
  };

  // Handle community click
  const handleCommunityClick = (community: MyCommunity) => {
    router.push(`/user/community/c/${community.username}`);
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

        toast.success(result.message);
        setShowLeaveDialog(null);
      }
    } catch (error: unknown) {
      console.error("Leave community error:", error);
      toast.error("Failed to leave community");
    } finally {
      setLeavingCommunity(null);
    }
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    const icons = {
      admin: Crown,
      moderator: Shield,
      member: User,
    };
    const Icon = icons[role as keyof typeof icons] || User;
    return (
      <div className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
        <Icon className="w-3 h-3" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </div>
    )
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-0">
        {/* Header */}
        <div className="sticky top-[4.5rem] bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 z-10 -mx-[1px] -mt-[1px]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                My Communities
              </h2>
              <p className="text-xs text-slate-500">
                {stats.totalCommunities} Joined
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => router.push("/user/community/explore")} className="rounded-full hover:bg-slate-900">
              <Plus className="h-5 w-5 text-cyan-500" />
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-4 mt-4 overflow-x-auto no-scrollbar">
            {filters.map((filter) => (
              <div
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`cursor-pointer border-b-4 py-2 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeFilter === filter.id
                  ? 'border-cyan-500 text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
              >
                <filter.icon className="h-4 w-4" />
                {filter.label}
              </div>
            ))}
          </div>
        </div>

        {/* Communities List */}
        <div className="px-0 pb-6">
          {error && communities.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={() => loadCommunities(true)} variant="outline">Retry</Button>
            </div>
          ) : communities.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-slate-600" />
              <p className="text-lg font-bold text-white mb-2">No communities found</p>
              <p className="text-slate-500 mb-6">
                Join communities to see them here.
              </p>
              <Button
                onClick={() => router.push("/user/community/explore")}
                className="bg-cyan-500 hover:bg-cyan-600 rounded-full px-6"
              >
                Explore Communities
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {communities.filter(c => c.communityName.toLowerCase().includes(searchQuery.toLowerCase())).map((community) => (
                <div
                  key={community._id}
                  className="group relative cursor-pointer hover:bg-slate-900/40 p-4 transition-colors"
                  onClick={() => router.push(`/user/community/c/messages/${community.username}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12 rounded-lg">
                        <AvatarImage
                          src={community.logo}
                          alt={community.communityName}
                        />
                        <AvatarFallback className="bg-slate-800 text-white">
                          {community.communityName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {community.unreadPosts > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full border-2 border-slate-950" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-base truncate">
                            {community.communityName}
                          </h3>
                          {getRoleBadge(community.memberRole)}
                        </div>
                        <span className="text-xs text-slate-500">
                          {community.lastActiveAt ? userMyCommunitiesApiService.formatTimeAgo(community.lastActiveAt) : 'Joined just now'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-slate-500 text-sm truncate pr-4">
                          {community.unreadPosts > 0
                            ? <span className="text-white font-medium">{community.unreadPosts} new posts</span>
                            : community.description || "No description"}
                        </p>

                        <div className="flex items-center gap-2">
                          {/* Profile Button - Visible on Hover */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCommunityClick(community);
                            }}
                            className="hidden group-hover:flex bg-slate-800 hover:bg-slate-700 text-white h-7 text-xs"
                          >
                            Profile
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleLeaveCommunity(e, community)}
                            className="text-slate-500 hover:text-red-500 h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Leave
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center py-4 border-t border-slate-800">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="ghost"
                className="text-cyan-500"
              >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : "Show More"}
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Leave Community Confirmation Dialog */}
      <Dialog
        open={!!showLeaveDialog}
        onOpenChange={() => setShowLeaveDialog(null)}
      >
        <DialogContent className="sm:max-w-[425px] bg-slate-950 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Leave {showLeaveDialog?.communityName}?
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              You will no longer have access to this community.
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
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}