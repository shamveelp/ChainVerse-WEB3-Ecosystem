"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Search,
  Clock,
  Check,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { CommunityRequestCard } from '@/components/admin/CommunityRequestCard';
import { CommunityRequestDetailModal } from '@/components/admin/CommunityRequestDetailModal';
import { getAllCommunityRequests, approveCommunityRequest, rejectCommunityRequest } from '@/services/adminApiService';
import { toast } from '@/hooks/use-toast';
import { CommunityRequest, CommunityRequestFilters } from '@/types/community';

export default function CommunityRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CommunityRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState<CommunityRequestFilters>({
    page: 1,
    limit: 12,
    search: '',
    status: 'all'
  });
  const [searchInput, setSearchInput] = useState('');

  // Pagination
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const searchParam = filters.status === 'all' ? filters.search : `${filters.search} status:${filters.status}`;
      const result = await getAllCommunityRequests(filters.page, filters.limit, searchParam);

      if (result.success) {
        setRequests(result.data || []);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 1);
      } else {
        throw new Error(result.error || "Failed to fetch requests");
      }
    } catch (error) {
      const err = error as Error;
      console.error('Fetch requests error:', error);
      toast({
        title: "Error",
        description: err.message || "Failed to fetch community requests",
        variant: "destructive"
      });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.search, filters.status, filters.limit]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput.trim(), page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status: status as 'pending' | 'approved' | 'rejected' | 'all', page: 1 }));
  };

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const result = await approveCommunityRequest(requestId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Community request approved successfully! Approval email has been sent.",
          className: "bg-green-900/90 border-green-500/50 text-green-100"
        });
        fetchRequests();
        if (selectedRequest?._id === requestId) {
          setDetailModalOpen(false);
          setSelectedRequest(null);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to approve request",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    setActionLoading(requestId);
    try {
      const result = await rejectCommunityRequest(requestId, reason);
      if (result.success) {
        toast({
          title: "Success",
          description: "Community request rejected successfully! Rejection email has been sent.",
          className: "bg-red-900/90 border-red-500/50 text-red-100"
        });
        fetchRequests();
        if (selectedRequest?._id === requestId) {
          setDetailModalOpen(false);
          setSelectedRequest(null);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to reject request",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (request: CommunityRequest) => {
    router.push(`/admin/community-requests/${request._id}`);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setFilters(prev => ({ ...prev, page }));
    }
  };

  const getStatsData = () => {
    return {
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      total
    };
  };

  const stats = getStatsData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-orange-500 to-red-600 bg-clip-text text-transparent flex items-center gap-3">
            <Users className="h-8 w-8 text-red-400" />
            Community Applications
          </h1>
          <p className="text-slate-400 text-lg">
            Review and manage community applications with detailed insights
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{total}</p>
            <p className="text-sm text-slate-400">Total Applications</p>
          </div>
          <Button
            onClick={fetchRequests}
            variant="outline"
            disabled={loading}
            className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-red-400/50 text-slate-300 hover:text-red-400"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-yellow-950/50 to-yellow-900/30 border-yellow-800/30 hover:from-yellow-900/60 hover:to-yellow-800/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-yellow-400 text-sm font-medium">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-950/50 to-green-900/30 border-green-800/30 hover:from-green-900/60 hover:to-green-800/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Check className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.approved}</p>
                <p className="text-green-400 text-sm font-medium">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-950/50 to-red-900/30 border-red-800/30 hover:from-red-900/60 hover:to-red-800/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <X className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.rejected}</p>
                <p className="text-red-400 text-sm font-medium">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 border-blue-800/30 hover:from-blue-900/60 hover:to-blue-800/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{total}</p>
                <p className="text-blue-400 text-sm font-medium">Total Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-400/70 group-focus-within:text-red-400 transition-colors" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by community name, email, username, or category..."
                className="pl-10 bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-red-400/50 focus:ring-red-400/20"
              />
            </div>

            {/* Status Filter */}
            <Select value={filters.status} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-slate-600/50 text-slate-100">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-slate-100">All Status</SelectItem>
                <SelectItem value="pending" className="text-yellow-400">Pending</SelectItem>
                <SelectItem value="approved" className="text-green-400">Approved</SelectItem>
                <SelectItem value="rejected" className="text-red-400">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-400 hover:to-orange-500 text-white font-semibold px-6"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
        <CardHeader className="border-b border-slate-700/50">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-400" />
              Applications
              {filters.status !== 'all' && (
                <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {(filters.status ?? 'all').charAt(0).toUpperCase() + (filters.status ?? 'all').slice(1)}
                </Badge>
              )}
            </div>
            <div className="text-sm text-slate-400 font-normal">
              {loading ? "Loading..." : `Page ${filters.page} of ${totalPages} • ${total} total`}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-red-400 mx-auto" />
                <span className="text-slate-400">Loading community applications...</span>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <AlertCircle className="h-12 w-12 text-slate-600 mx-auto" />
              <div>
                <p className="text-slate-400 text-lg">
                  {filters.search || filters.status !== 'all'
                    ? "No applications found matching your criteria"
                    : "No community applications found"
                  }
                </p>
                {(filters.search || filters.status !== 'all') && (
                  <Button
                    onClick={() => {
                      setFilters({ page: 1, limit: 12, search: '', status: 'all' });
                      setSearchInput('');
                    }}
                    variant="outline"
                    className="mt-4 bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  {requests.map((request) => (
                    <CommunityRequestCard
                      key={request._id}
                      request={request}
                      onView={handleViewDetails}
                      onApprove={handleApprove}
                      onReject={(id) => {
                        // For quick reject, we'll need a modal or use the detail modal
                        setSelectedRequest(request);
                        setDetailModalOpen(true);
                      }}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-6 border-t border-slate-700/50 bg-slate-800/20">
                  <div className="text-sm text-slate-400">
                    Page {filters.page} of {totalPages} • Total {total} applications
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page === 1}
                      className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-red-400/50 text-slate-300 hover:text-red-400"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, filters.page - 2)) + i;
                        return (
                          <Button
                            key={pageNum}
                            variant={filters.page === pageNum ? "default" : "outline"}
                            onClick={() => handlePageChange(pageNum)}
                            className={filters.page === pageNum
                              ? "bg-gradient-to-r from-red-500 to-orange-600 text-white"
                              : "bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-red-400/50 text-slate-300 hover:text-red-400"
                            }
                            size="sm"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page === totalPages}
                      className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-red-400/50 text-slate-300 hover:text-red-400"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <CommunityRequestDetailModal
        request={selectedRequest}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedRequest(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        actionLoading={actionLoading}
      />
    </div>
  );
}