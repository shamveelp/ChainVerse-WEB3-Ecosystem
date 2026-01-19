"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Users, Search, MoreHorizontal, Crown, Shield, Ban, UserX, UserCheck, Activity, Calendar, MessageSquare, Heart, Trophy, Loader2, RefreshCw, Filter, Import as SortAsc, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { communityAdminMembersApiService } from "@/services/communityAdmin/communityAdminMembersApiService";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import type { MemberFilters } from "@/types/comms-admin/members.types";

interface CommunityMember {
  _id: string;
  userId: string;
  username: string;
  name: string;
  email: string;
  profilePic: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: Date;
  isActive: boolean;
  lastActiveAt: Date;
  isPremium: boolean;
  stats: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    questsCompleted: number;
  };
  bannedUntil?: Date;
  banReason?: string;
}

interface MembersSummary {
  totalMembers: number;
  activeMembers: number;
  moderators: number;
  premiumMembers: number;
  bannedMembers: number;
  newMembersThisWeek: number;
}

export default function CommunityAdminMembers() {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>();
  const [summary, setSummary] = useState<MembersSummary | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  // Modal states
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<number>();
  const [newRole, setNewRole] = useState<'member' | 'moderator'>('member');
  const [actionLoading, setActionLoading] = useState(false);

  const observerRef = useRef<IntersectionObserver>(null);

  // Set up intersection observer for infinite scroll
  const lastMemberRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMembers();
      }
    });

    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMore]);

  useEffect(() => {
    loadMembers(true);
  }, [roleFilter, statusFilter, sortBy, debouncedSearchQuery]);

  const loadMembers = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
        setCursor(undefined);
      }

      const filters = {
        cursor: isInitial ? undefined : cursor,
        limit: 20,
        search: searchQuery || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter as MemberFilters['role'],
        status: statusFilter === 'all' ? undefined : statusFilter as MemberFilters['status'],
        sortBy: sortBy as MemberFilters['sortBy']
      };

      const response = await communityAdminMembersApiService.getCommunityMembers(filters);

      if (response.success && response.data) {
        if (isInitial) {
          setMembers(response.data.members);
        } else {
          setMembers(prev => [...prev, ...response.data!.members]);
        }

        setHasMore(response.data.hasMore);
        setCursor(response.data.nextCursor);
        setSummary(response.data.summary);
      } else {
        toast.error(response.error || 'Failed to load community members');
      }
    } catch (error: unknown) {
      console.error('Error loading members:', error);
      toast.error('Failed to load community members');
    } finally {
      if (isInitial) {
        setLoading(false);
      }
      setLoadingMore(false);
    }
  };

  const loadMoreMembers = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadMembers(false);
  };

  const refreshMembers = async () => {
    await loadMembers(true);
    toast.success('Members list refreshed!');
  };

  // Handle member actions
  const handleBanMember = async () => {
    if (!selectedMember || !banReason.trim()) return;

    try {
      setActionLoading(true);
      const response = await communityAdminMembersApiService.banMember({
        memberId: selectedMember._id,
        reason: banReason.trim(),
        durationDays: banDuration
      });

      if (response.success && response.data) {
        setMembers(prev => prev.map(member =>
          member._id === selectedMember._id ? response.data!.member : member
        ));
        toast.success('Member banned successfully');
        setShowBanDialog(false);
        setBanReason("");
        setBanDuration(undefined);
        setSelectedMember(null);
      } else {
        toast.error(response.error || 'Failed to ban member');
      }
    } catch (error: unknown) {
      toast.error('Failed to ban member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanMember = async () => {
    if (!selectedMember) return;

    try {
      setActionLoading(true);
      const response = await communityAdminMembersApiService.unbanMember(selectedMember._id);

      if (response.success && response.data) {
        setMembers(prev => prev.map(member =>
          member._id === selectedMember._id ? response.data!.member : member
        ));
        toast.success('Member unbanned successfully');
        setShowUnbanDialog(false);
        setSelectedMember(null);
      } else {
        toast.error(response.error || 'Failed to unban member');
      }
    } catch (error: unknown) {
      toast.error('Failed to unban member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    try {
      setActionLoading(true);
      const response = await communityAdminMembersApiService.removeMember(selectedMember._id, banReason || undefined);

      if (response.success) {
        setMembers(prev => prev.filter(member => member._id !== selectedMember._id));
        toast.success('Member removed successfully');
        setShowRemoveDialog(false);
        setBanReason("");
        setSelectedMember(null);
      } else {
        toast.error(response.error || 'Failed to remove member');
      }
    } catch (error: unknown) {
      toast.error('Failed to remove member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedMember) return;

    try {
      setActionLoading(true);
      const response = await communityAdminMembersApiService.updateMemberRole({
        memberId: selectedMember._id,
        role: newRole,
        reason: banReason || undefined
      });

      if (response.success && response.data) {
        setMembers(prev => prev.map(member =>
          member._id === selectedMember._id ? response.data!.member : member
        ));
        toast.success('Member role updated successfully');
        setShowRoleDialog(false);
        setBanReason("");
        setNewRole('member');
        setSelectedMember(null);
      } else {
        toast.error(response.error || 'Failed to update member role');
      }
    } catch (error: unknown) {
      toast.error('Failed to update member role');
    } finally {
      setActionLoading(false);
    }
  };

  const openBanDialog = (member: CommunityMember) => {
    setSelectedMember(member);
    setBanReason("");
    setBanDuration(undefined);
    setShowBanDialog(true);
  };

  const openUnbanDialog = (member: CommunityMember) => {
    setSelectedMember(member);
    setShowUnbanDialog(true);
  };

  const openRemoveDialog = (member: CommunityMember) => {
    setSelectedMember(member);
    setBanReason("");
    setShowRemoveDialog(true);
  };

  const openRoleDialog = (member: CommunityMember) => {
    setSelectedMember(member);
    setNewRole(member.role === 'moderator' ? 'member' : 'moderator');
    setBanReason("");
    setShowRoleDialog(true);
  };

  const getMemberStatus = (member: CommunityMember) => {
    if (member.bannedUntil && new Date(member.bannedUntil) > new Date()) {
      return { status: 'banned', color: 'text-red-400', label: 'Banned' };
    }
    if (!member.isActive) {
      return { status: 'inactive', color: 'text-gray-500', label: 'Inactive' };
    }

    const lastActive = new Date(member.lastActiveAt);
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActive <= 1) {
      return { status: 'online', color: 'text-green-400', label: 'Online' };
    } else if (daysSinceActive <= 7) {
      return { status: 'recent', color: 'text-yellow-400', label: 'Recently Active' };
    } else {
      return { status: 'away', color: 'text-gray-400', label: 'Away' };
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-purple-400" />;
      default:
        return <Users className="w-4 h-4 text-blue-400" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'moderator':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };



  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Community Members
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Manage your community members and moderation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={refreshMembers}
            variant="outline"
            size="sm"
            className="border-blue-600/50 text-blue-400 hover:bg-blue-950/30"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 backdrop-blur-xl border-blue-500/30">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{summary.totalMembers}</p>
              <p className="text-sm text-blue-300">Total Members</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 backdrop-blur-xl border-green-500/30">
            <CardContent className="p-4 text-center">
              <Activity className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{summary.activeMembers}</p>
              <p className="text-sm text-green-300">Active</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 backdrop-blur-xl border-purple-500/30">
            <CardContent className="p-4 text-center">
              <Shield className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{summary.moderators}</p>
              <p className="text-sm text-purple-300">Moderators</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 backdrop-blur-xl border-yellow-500/30">
            <CardContent className="p-4 text-center">
              <Crown className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{summary.premiumMembers}</p>
              <p className="text-sm text-yellow-300">Premium</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 backdrop-blur-xl border-red-500/30">
            <CardContent className="p-4 text-center">
              <Ban className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{summary.bannedMembers}</p>
              <p className="text-sm text-red-300">Banned</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 backdrop-blur-xl border-indigo-500/30">
            <CardContent className="p-4 text-center">
              <UserCheck className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{summary.newMembersThisWeek}</p>
              <p className="text-sm text-indigo-300">New This Week</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-black/40 backdrop-blur-xl border-gray-700/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search members by name, username, or email..."
                  className="pl-10 bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] bg-gray-800/50 border-gray-600/50 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-gray-700/50">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="moderator">Moderators</SelectItem>
                  <SelectItem value="member">Members</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-gray-800/50 border-gray-600/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-gray-700/50">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-gray-800/50 border-gray-600/50 text-white">
                  <SortAsc className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-gray-700/50">
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="most_active">Most Active</SelectItem>
                  <SelectItem value="most_posts">Most Posts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
            <p className="text-gray-400">Loading community members...</p>
          </div>
        </div>
      ) : members.length === 0 ? (
        <Card className="bg-black/40 backdrop-blur-xl border-gray-700/50">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No members found</h3>
            <p className="text-gray-400">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? "Try adjusting your filters to see more results."
                : "Your community doesn't have any members yet."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {members.map((member, index) => {
            const status = getMemberStatus(member);

            return (
              <Card
                key={member._id}
                ref={index === members.length - 1 ? lastMemberRef : undefined}
                className="bg-black/40 backdrop-blur-xl border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="w-14 h-14 ring-2 ring-gray-700/50">
                        <AvatarImage src={member.profilePic} alt={member.name} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Status indicator */}
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900",
                        status.status === 'online' && 'bg-green-500',
                        status.status === 'recent' && 'bg-yellow-500',
                        status.status === 'away' && 'bg-gray-500',
                        status.status === 'inactive' && 'bg-gray-600',
                        status.status === 'banned' && 'bg-red-500'
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white truncate">{member.name}</h3>
                            {member.isPremium && (
                              <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400 truncate">@{member.username}</p>

                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getRoleBadgeColor(member.role)}>
                              <span className="flex items-center gap-1">
                                {getRoleIcon(member.role)}
                                {member.role}
                              </span>
                            </Badge>
                            <span className={cn("text-xs font-medium", status.color)}>
                              {status.label}
                            </span>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-400 hover:text-white hover:bg-gray-800/50 flex-shrink-0"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-xl border-gray-700/50">
                            {member.role !== 'admin' && (
                              <DropdownMenuItem
                                onClick={() => openRoleDialog(member)}
                                className="text-gray-200 hover:bg-gray-800/50"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                {member.role === 'moderator' ? 'Demote to Member' : 'Promote to Moderator'}
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="bg-gray-700/50" />

                            {member.bannedUntil && new Date(member.bannedUntil) > new Date() ? (
                              <DropdownMenuItem
                                onClick={() => openUnbanDialog(member)}
                                className="text-green-400 hover:bg-green-900/30"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Unban Member
                              </DropdownMenuItem>
                            ) : (
                              member.role !== 'admin' && (
                                <DropdownMenuItem
                                  onClick={() => openBanDialog(member)}
                                  className="text-yellow-400 hover:bg-yellow-900/30"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Ban Member
                                </DropdownMenuItem>
                              )
                            )}

                            {member.role !== 'admin' && (
                              <DropdownMenuItem
                                onClick={() => openRemoveDialog(member)}
                                className="text-red-400 hover:bg-red-900/30"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Member stats */}
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-700/50">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <MessageSquare className="w-3 h-3 text-blue-400" />
                            <span className="text-sm font-semibold text-white">
                              {member.stats.totalPosts}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">Posts</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Heart className="w-3 h-3 text-red-400" />
                            <span className="text-sm font-semibold text-white">
                              {member.stats.totalLikes}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">Likes</p>
                        </div>
                      </div>

                      {/* Join date */}
                      <div className="flex items-center gap-1 mt-3 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Joined {communityAdminMembersApiService.formatTimeAgo(member.joinedAt)}</span>
                      </div>

                      {/* Ban info */}
                      {member.banReason && (
                        <div className="mt-3 p-2 bg-red-900/30 border border-red-500/30 rounded-lg">
                          <p className="text-xs text-red-300 font-medium">Banned</p>
                          <p className="text-xs text-red-400">{member.banReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
            <p className="text-gray-400 text-sm">Loading more members...</p>
          </div>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && members.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500 text-sm">You've reached the end of the members list</p>
        </div>
      )}

      {/* Ban Member Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="sm:max-w-[425px] bg-black/90 backdrop-blur-xl border-gray-700/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-400" />
              Ban Member
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Ban {selectedMember?.name} from the community. This action can be reversed later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Reason for ban *
              </label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Provide a reason for banning this member..."
                className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Ban duration (optional)
              </label>
              <Select onValueChange={(value) => setBanDuration(value === 'permanent' ? undefined : parseInt(value))}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600/50 text-white">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-gray-700/50">
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">1 week</SelectItem>
                  <SelectItem value="30">1 month</SelectItem>
                  <SelectItem value="90">3 months</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBanDialog(false)}
              className="border-gray-600/50 hover:bg-gray-800/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBanMember}
              disabled={!banReason.trim() || actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Ban className="w-4 h-4 mr-2" />
              )}
              Ban Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban Member Dialog */}
      <Dialog open={showUnbanDialog} onOpenChange={setShowUnbanDialog}>
        <DialogContent className="sm:max-w-[425px] bg-black/90 backdrop-blur-xl border-gray-700/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Unban Member
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to unban {selectedMember?.name}? They will be able to participate in the community again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnbanDialog(false)}
              className="border-gray-600/50 hover:bg-gray-800/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnbanMember}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Unban Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="sm:max-w-[425px] bg-black/90 backdrop-blur-xl border-gray-700/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-400" />
              Remove Member
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Permanently remove {selectedMember?.name} from the community. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Reason for removal (optional)
              </label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Provide a reason for removing this member..."
                className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
              className="border-gray-600/50 hover:bg-gray-800/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRemoveMember}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserX className="w-4 h-4 mr-2" />
              )}
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-[425px] bg-black/90 backdrop-blur-xl border-gray-700/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Update Member Role
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Change {selectedMember?.name}'s role to {newRole === 'moderator' ? 'moderator' : 'member'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Reason for role change (optional)
              </label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Provide a reason for this role change..."
                className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRoleDialog(false)}
              className="border-gray-600/50 hover:bg-gray-800/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={actionLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}