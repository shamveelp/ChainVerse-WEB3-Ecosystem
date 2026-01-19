"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  Trophy,
  Crown,
  Eye,
  UserX,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Download
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { communityAdminQuestApiService } from '@/services/quests/communityAdminQuestApiService';
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
import Image from 'next/image';

interface Submission {
  taskType: string;
  status: string;
  taskTitle: string;
  submissionData?: {
    text?: string;
  };
  submittedAt: string;
}

interface Participant {
  _id: string;
  userId: {
    _id: string;
    username: string;
    name: string;
    profilePic: string;
    email: string;
  };
  status: string;
  joinedAt: Date;
  completedAt?: Date;
  totalTasksCompleted: number;
  isWinner: boolean;
  rewardClaimed: boolean;
  walletAddress?: string;
  submissions?: Submission[];
}

interface QuestTask {
  _id: string;
  title: string;
}

interface Quest {
  _id: string;
  title: string;
  status: string;
  totalParticipants: number;
  participantLimit: number;
  winnersSelected: boolean;
  tasks?: QuestTask[];
  selectionMethod: string;
}

interface ParticipantsResponse {
  participants?: Participant[];
  items?: Participant[];
  pagination?: {
    pages: number;
  };
}

export default function QuestParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const questId = params.id as string;

  const [quest, setQuest] = useState<Quest | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("joinedAt");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (questId) {
      fetchQuestData();
    }
  }, [questId]);

  useEffect(() => {
    if (quest) {
      fetchParticipants();
    }
  }, [quest, currentPage, statusFilter, sortBy, sortOrder]);

  const fetchQuestData = async () => {
    try {
      const response = await communityAdminQuestApiService.getQuest(questId);
      if (response.success && response.data) {
        setQuest(response.data as unknown as Quest);
      } else {
        throw new Error(response.error || "Failed to fetch quest");
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch quest data",
      });
      router.push('/comms-admin/quests');
    }
  };

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const response = await communityAdminQuestApiService.getQuestParticipants(questId, {
        page: currentPage,
        limit: 12,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (response.success && response.data) {
        const data = response.data as unknown as ParticipantsResponse;
        setParticipants(data.participants || data.items || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch participants:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewParticipantDetails = async (participant: Participant) => {
    try {
      const response = await communityAdminQuestApiService.getParticipantDetails(questId, participant.userId._id);
      if (response.success && response.data) {
        setSelectedParticipant({ ...participant, ...response.data });
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch participant details",
      });
    }
  };

  const disqualifyParticipant = async (participantId: string, reason: string) => {
    try {
      const response = await communityAdminQuestApiService.disqualifyParticipant(questId, participantId, reason);
      if (response.success) {
        toast({
          title: "Success",
          description: "Participant disqualified successfully",
        });
        fetchParticipants();
        setSelectedParticipant(null);
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disqualify participant",
      });
    }
  };

  const handleSelectWinners = async () => {
    if (!quest) return;

    try {
      const response = await communityAdminQuestApiService.selectWinners(questId, quest.selectionMethod as 'fcfs' | 'random');
      if (response.success) {
        toast({
          title: "Success",
          description: response.data?.message || "Winners selected successfully",
        });
        fetchQuestData();
        fetchParticipants();
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to select winners",
      });
    }
  };

  const exportParticipants = () => {
    const csvContent = [
      ['Username', 'Name', 'Email', 'Status', 'Tasks Completed', 'Joined At', 'Completed At', 'Is Winner', 'Wallet Address'],
      ...participants.map(p => [
        p.userId.username,
        p.userId.name,
        p.userId.email,
        p.status,
        p.totalTasksCompleted,
        new Date(p.joinedAt).toLocaleDateString(),
        p.completedAt ? new Date(p.completedAt).toLocaleDateString() : '',
        p.isWinner ? 'Yes' : 'No',
        p.walletAddress || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quest-${questId}-participants.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getParticipantStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-600";
      case "winner": return "bg-purple-600";
      case "disqualified": return "bg-red-600";
      case "in_progress": return "bg-blue-600";
      default: return "bg-gray-600";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!quest) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const winnerCount = participants.filter(p => p.isWinner).length;
  const completedCount = participants.filter(p => p.status === 'completed' || p.status === 'winner').length;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/comms-admin/quests/${questId}`)}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quest
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Quest Participants</h1>
            <p className="text-gray-400 mt-1">{quest.title}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={exportParticipants}
            variant="outline"
            className="border-gray-600 text-gray-400"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {quest.status === 'ended' && !quest.winnersSelected && completedCount > 0 && (
            <Button
              onClick={handleSelectWinners}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              Select Winners
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{quest.totalParticipants}</p>
                <p className="text-sm text-gray-400">Total Participants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{completedCount}</p>
                <p className="text-sm text-gray-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{winnerCount}</p>
                <p className="text-sm text-gray-400">Winners Selected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{quest.participantLimit}</p>
                <p className="text-sm text-gray-400">Winner Limit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search participants by username, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="winner">Winners</SelectItem>
                <SelectItem value="disqualified">Disqualified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="joinedAt">Join Date</SelectItem>
                <SelectItem value="completedAt">Completion Date</SelectItem>
                <SelectItem value="totalTasksCompleted">Tasks Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="desc">Newest</SelectItem>
                <SelectItem value="asc">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Participants List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-black/60 backdrop-blur-xl border-purple-800/30 animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-12 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : participants.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {participants
              .filter(p =>
                searchTerm === "" ||
                p.userId.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.userId.email.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((participant) => (
                <Card key={participant._id} className="bg-black/60 backdrop-blur-xl border-purple-800/30 hover:border-purple-700/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Image
                          src={participant.userId.profilePic || '/default-avatar.png'}
                          alt={participant.userId.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-white">{participant.userId.name || participant.userId.username}</p>
                          <p className="text-sm text-gray-400">@{participant.userId.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {participant.isWinner && <Crown className="h-4 w-4 text-yellow-400" />}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-600">
                            <DropdownMenuItem
                              onClick={() => viewParticipantDetails(participant)}
                              className="text-white hover:bg-gray-700"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-600" />
                            <DropdownMenuItem
                              onClick={() => disqualifyParticipant(participant._id, "Manual disqualification")}
                              className="text-red-400 hover:bg-gray-700"
                              disabled={participant.status === 'disqualified'}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Disqualify
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Status:</span>
                        <Badge className={`${getParticipantStatusColor(participant.status)} text-white text-xs`}>
                          {participant.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Tasks:</span>
                        <span className="text-white">
                          {participant.totalTasksCompleted} / {quest.tasks?.length || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Joined:</span>
                        <span className="text-gray-300 text-xs">
                          {formatDate(participant.joinedAt)}
                        </span>
                      </div>
                      {participant.completedAt && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Completed:</span>
                          <span className="text-green-400 text-xs">
                            {formatDate(participant.completedAt)}
                          </span>
                        </div>
                      )}
                      {participant.walletAddress && (
                        <div className="text-xs text-gray-500 font-mono truncate">
                          {participant.walletAddress}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card className="bg-black/60 backdrop-blur-xl border-purple-800/30">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Participants Found</h3>
            <p className="text-gray-400">
              {statusFilter !== 'all' ? `No participants with status "${statusFilter}"` : 'No participants have joined this quest yet.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Participant Details Modal */}
      <Dialog open={!!selectedParticipant} onOpenChange={() => setSelectedParticipant(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">Participant Details</DialogTitle>
            <DialogDescription className="text-gray-300">
              View detailed information about this participant
            </DialogDescription>
          </DialogHeader>
          {selectedParticipant && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Image
                  src={selectedParticipant.userId.profilePic || '/default-avatar.png'}
                  alt={selectedParticipant.userId.username}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedParticipant.userId.name || selectedParticipant.userId.username}
                  </h3>
                  <p className="text-gray-400">@{selectedParticipant.userId.username}</p>
                  <p className="text-sm text-gray-500">{selectedParticipant.userId.email}</p>
                  {selectedParticipant.walletAddress && (
                    <p className="text-xs text-gray-500 font-mono mt-1">{selectedParticipant.walletAddress}</p>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Badge className={`${getParticipantStatusColor(selectedParticipant.status)} text-white`}>
                    {selectedParticipant.status}
                  </Badge>
                  {selectedParticipant.isWinner && <Crown className="h-5 w-5 text-yellow-400" />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Joined At:</span>
                  <p className="text-white">{formatDate(selectedParticipant.joinedAt)}</p>
                </div>
                {selectedParticipant.completedAt && (
                  <div>
                    <span className="text-gray-400">Completed At:</span>
                    <p className="text-white">{formatDate(selectedParticipant.completedAt)}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Tasks Completed:</span>
                  <p className="text-white">{selectedParticipant.totalTasksCompleted} / {quest.tasks?.length || 0}</p>
                </div>
                <div>
                  <span className="text-gray-400">Winner Status:</span>
                  <p className={selectedParticipant.isWinner ? "text-yellow-400" : "text-gray-400"}>
                    {selectedParticipant.isWinner ? "Winner" : "Not selected"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Reward Status:</span>
                  <p className={selectedParticipant.rewardClaimed ? "text-green-400" : "text-gray-400"}>
                    {selectedParticipant.rewardClaimed ? "Claimed" : "Not claimed"}
                  </p>
                </div>
              </div>

              {selectedParticipant.submissions && selectedParticipant.submissions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Task Submissions:</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedParticipant.submissions.map((submission, index) => (
                      <div key={index} className="bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {submission.taskType}
                          </Badge>
                          <Badge className={`text-xs ${submission.status === 'approved' ? 'bg-green-600' :
                            submission.status === 'rejected' ? 'bg-red-600' :
                              submission.status === 'auto_verified' ? 'bg-blue-600' :
                                'bg-yellow-600'
                            }`}>
                            {submission.status}
                          </Badge>
                        </div>
                        <p className="text-white text-sm">{submission.taskTitle}</p>
                        {submission.submissionData?.text && (
                          <p className="text-gray-400 text-xs mt-1">{submission.submissionData.text}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                          Submitted: {formatDate(new Date(submission.submittedAt))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedParticipant(null)}
              className="border-gray-600 text-gray-400"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}