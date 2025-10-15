"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Crown,
  Shield,
  UserX,
  Ban,
  UserCheck,
  Loader2,
  UserPlus,
  TrendingUp,
  Star,
  MessageSquare
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { communityAdminMembersApiService } from '@/services/communityAdmin/communityAdminMembersApiService'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

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

export default function CommunityAdminMembers() {
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string>()
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('recent')
  
  // Summary stats
  const [summary, setSummary] = useState({
    totalMembers: 0,
    activeMembers: 0,
    moderators: 0,
    premiumMembers: 0,
    bannedMembers: 0,
    newMembersThisWeek: 0
  })

  // Modal states
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null)
  const [actionType, setActionType] = useState<'ban' | 'unban' | 'promote' | 'demote' | 'remove' | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionReason, setActionReason] = useState('')
  const [banDuration, setBanDuration] = useState('')

  const observerRef = useRef<IntersectionObserver>(null)

  // Set up intersection observer for infinite scroll
  const lastMemberRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMembers()
      }
    })

    if (node) observerRef.current.observe(node)
  }, [loadingMore, hasMore])

  // Load initial members
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadMembers(true)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm, roleFilter, statusFilter, sortBy])

  const loadMembers = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true)
        setCursor(undefined)
      }

      const response = await communityAdminMembersApiService.getCommunityMembers({
        cursor: isInitial ? undefined : cursor,
        limit: 20,
        search: searchTerm || undefined,
        role: roleFilter as any || undefined,
        status: statusFilter as any || undefined,
        sortBy: sortBy as any || 'recent'
      })

      if (response.success && response.data) {
        if (isInitial) {
          setMembers(response.data.members)
        } else {
          setMembers(prev => [...prev, ...response.data!.members])
        }
        
        setHasMore(response.data.hasMore)
        setCursor(response.data.nextCursor)
        setSummary(response.data.summary)
      } else {
        toast.error(response.error || 'Failed to load members')
      }
    } catch (error: any) {
      console.error('Error loading members:', error)
      toast.error('Failed to load members')
    } finally {
      if (isInitial) {
        setLoading(false)
      }
      setLoadingMore(false)
    }
  }

  const loadMoreMembers = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    await loadMembers(false)
  }

  const handleMemberAction = (member: CommunityMember, action: 'ban' | 'unban' | 'promote' | 'demote' | 'remove') => {
    setSelectedMember(member)
    setActionType(action)
    setActionReason('')
    setBanDuration('')
    setShowActionDialog(true)
  }

  const executeAction = async () => {
    if (!selectedMember || !actionType) return

    try {
      let response

      switch (actionType) {
        case 'ban':
          response = await communityAdminMembersApiService.banMember({
            memberId: selectedMember._id,
            reason: actionReason,
            durationDays: banDuration ? parseInt(banDuration) : undefined
          })
          break
        case 'unban':
          response = await communityAdminMembersApiService.unbanMember(selectedMember._id)
          break
        case 'promote':
          response = await communityAdminMembersApiService.updateMemberRole({
            memberId: selectedMember._id,
            role: 'moderator',
            reason: actionReason
          })
          break
        case 'demote':
          response = await communityAdminMembersApiService.updateMemberRole({
            memberId: selectedMember._id,
            role: 'member',
            reason: actionReason
          })
          break
        case 'remove':
          response = await communityAdminMembersApiService.removeMember(selectedMember._id, actionReason)
          break
      }

      if (response?.success) {
        toast.success(response.message || 'Action completed successfully')
        setShowActionDialog(false)
        loadMembers(true) // Refresh the list
      } else {
        toast.error(response?.error || 'Action failed')
      }
    } catch (error: any) {
      toast.error('Action failed')
    }
  }

  const getStatusColor = (member: CommunityMember): string => {
    return communityAdminMembersApiService.getStatusColor(member)
  }

  const getRoleBadgeColor = (role: string): string => {
    return communityAdminMembersApiService.getRoleBadgeColor(role)
  }

  const getStatusText = (member: CommunityMember): string => {
    if (member.bannedUntil && new Date(member.bannedUntil) > new Date()) {
      return 'Banned'
    }
    if (!member.isActive) {
      return 'Inactive'
    }
    
    const lastActive = new Date(member.lastActiveAt)
    const hoursSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60)
    
    if (hoursSinceActive <= 1) {
      return 'Online'
    } else if (hoursSinceActive <= 24) {
      return 'Active today'
    } else if (hoursSinceActive <= 168) {
      return 'Active this week'
    } else {
      return 'Inactive'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto" />
            <p className="text-gray-400">Loading community members...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            Community Members
          </h1>
          <p className="text-gray-400 mt-1">
            Manage and moderate your community members
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-red-400" />
              <div>
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-lg font-bold text-white">{summary.totalMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-green-400" />
              <div>
                <p className="text-xs text-gray-400">Active</p>
                <p className="text-lg font-bold text-white">{summary.activeMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-purple-400" />
              <div>
                <p className="text-xs text-gray-400">Moderators</p>
                <p className="text-lg font-bold text-white">{summary.moderators}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-yellow-400" />
              <div>
                <p className="text-xs text-gray-400">Premium</p>
                <p className="text-lg font-bold text-white">{summary.premiumMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Ban className="h-6 w-6 text-red-400" />
              <div>
                <p className="text-xs text-gray-400">Banned</p>
                <p className="text-lg font-bold text-white">{summary.bannedMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">New (Week)</p>
                <p className="text-lg font-bold text-white">{summary.newMembersThisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-red-950/20 border-red-800/30 text-white"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="bg-red-950/20 border-red-800/30 text-white">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="bg-black/80 backdrop-blur-xl border-red-800/30">
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="member">Members</SelectItem>
                <SelectItem value="moderator">Moderators</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-red-950/20 border-red-800/30 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-black/80 backdrop-blur-xl border-red-800/30">
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-red-950/20 border-red-800/30 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-black/80 backdrop-blur-xl border-red-800/30">
                <SelectItem value="recent">Recently Joined</SelectItem>
                <SelectItem value="oldest">Oldest Members</SelectItem>
                <SelectItem value="most_active">Most Active</SelectItem>
                <SelectItem value="most_posts">Most Posts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      {members.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No members found</h3>
          <p className="text-gray-400">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {members.map((member, index) => (
            <Card
              key={member._id}
              ref={index === members.length - 1 ? lastMemberRef : undefined}
              className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-700/50 transition-all duration-200"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 ring-2 ring-red-700/50">
                      <AvatarImage src={member.profilePic} alt={member.name} />
                      <AvatarFallback className="bg-gradient-to-r from-red-500 to-red-700 text-white">
                        {member.name.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{member.name}</h3>
                        {member.isPremium && (
                          <Crown className="h-4 w-4 text-yellow-400" />
                        )}
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", getRoleBadgeColor(member.role))}
                        >
                          {member.role}
                        </Badge>
                        <span className={cn("text-xs font-medium", getStatusColor(member))}>
                          {getStatusText(member)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">@{member.username}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Joined {communityAdminMembersApiService.formatTimeAgo(member.joinedAt)}</span>
                        <span>•</span>
                        <span>{member.stats.totalPosts} posts</span>
                        <span>•</span>
                        <span>{member.stats.totalLikes} likes</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-4 text-gray-400">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{member.stats.totalPosts}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          <span>{member.stats.totalLikes}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Last active {communityAdminMembersApiService.formatTimeAgo(member.lastActiveAt)}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-white hover:bg-red-800/30"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black/80 backdrop-blur-xl border-red-800/30">
                        {member.role === 'member' && (
                          <DropdownMenuItem
                            onClick={() => handleMemberAction(member, 'promote')}
                            className="text-gray-200 hover:bg-red-900/30"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Promote to Moderator
                          </DropdownMenuItem>
                        )}
                        
                        {member.role === 'moderator' && (
                          <DropdownMenuItem
                            onClick={() => handleMemberAction(member, 'demote')}
                            className="text-gray-200 hover:bg-red-900/30"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Demote to Member
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className="bg-red-800/30" />

                        {member.isActive && !member.bannedUntil && (
                          <DropdownMenuItem
                            onClick={() => handleMemberAction(member, 'ban')}
                            className="text-orange-400 hover:bg-red-900/30"
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Ban Member
                          </DropdownMenuItem>
                        )}

                        {member.bannedUntil && new Date(member.bannedUntil) > new Date() && (
                          <DropdownMenuItem
                            onClick={() => handleMemberAction(member, 'unban')}
                            className="text-green-400 hover:bg-red-900/30"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Unban Member
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => handleMemberAction(member, 'remove')}
                          className="text-red-400 hover:bg-red-900/30"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-red-500 mx-auto" />
            <p className="text-gray-400 text-sm">Loading more members...</p>
          </div>
        </div>
      )}

      {/* End indicator */}
      {!hasMore && members.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500 text-sm">You've reached the end</p>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="sm:max-w-[425px] bg-black/80 backdrop-blur-xl border-red-800/30">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionType === 'ban' && 'Ban Member'}
              {actionType === 'unban' && 'Unban Member'}
              {actionType === 'promote' && 'Promote to Moderator'}
              {actionType === 'demote' && 'Demote to Member'}
              {actionType === 'remove' && 'Remove Member'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedMember && (
                <>
                  You are about to {actionType} <strong>{selectedMember.name}</strong> (@{selectedMember.username}).
                  {actionType === 'ban' || actionType === 'remove' ? ' This action cannot be easily undone.' : ''}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {actionType === 'ban' && (
              <div>
                <label className="text-sm font-medium text-gray-300">Ban Duration (days)</label>
                <Input
                  placeholder="Leave empty for permanent ban"
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className="bg-red-950/20 border-red-800/30 text-white mt-1"
                  type="number"
                  min="1"
                />
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-300">
                Reason {actionType === 'ban' || actionType === 'remove' ? '(required)' : '(optional)'}
              </label>
              <Textarea
                placeholder={`Reason for ${actionType}...`}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="bg-red-950/20 border-red-800/30 text-white mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActionDialog(false)}
              className="border-red-600/50 hover:bg-red-950/30"
            >
              Cancel
            </Button>
            <Button
              onClick={executeAction}
              disabled={
                (actionType === 'ban' || actionType === 'remove') && !actionReason.trim()
              }
              className={cn(
                actionType === 'ban' || actionType === 'remove'
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              )}
            >
              {actionType === 'ban' && 'Ban Member'}
              {actionType === 'unban' && 'Unban Member'}
              {actionType === 'promote' && 'Promote Member'}
              {actionType === 'demote' && 'Demote Member'}
              {actionType === 'remove' && 'Remove Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}