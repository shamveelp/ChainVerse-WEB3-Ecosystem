"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Coins,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  RefreshCw,
  Eye,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Filter
} from "lucide-react";
import { adminPointsConversionApiService } from "@/services/points/pointsConversionApiService";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import Image from "next/image";

interface ConversionStats {
  totalConversions: number;
  totalPointsConverted: number;
  totalCVCGenerated: number;
  totalClaimed: number;
  totalPending: number;
}

interface Conversion {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
    profilePic?: string;
  };
  pointsConverted: number;
  cvcAmount: number;
  conversionRate: number;
  status: string;
  transactionHash?: string;
  claimFee: number;
  walletAddress?: string;
  adminNote?: string;
  approvedBy?: string;
  approvedAt?: string;
  claimedAt?: string;
  createdAt: string;
}

interface ConversionRate {
  pointsPerCVC: number;
  minimumPoints: number;
  minimumCVC: number;
  claimFeeETH: string;
}

export default function AdminPointsConversionPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedConversion, setSelectedConversion] = useState<Conversion | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNote, setAdminNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [currentRate, setCurrentRate] = useState<ConversionRate | null>(null);
  const [newRate, setNewRate] = useState({
    pointsPerCVC: 100,
    minimumPoints: 100,
    minimumCVC: 1,
    claimFeeETH: '0.001'
  });

  const fetchConversionStats = useCallback(async () => {
    try {
      const result = await adminPointsConversionApiService.getConversionStats();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        toast.error("Failed to Load Statistics", {
          description: result.error || "Could not fetch conversion statistics.",
        });
      }
    } catch (error) {
      console.error("Fetch stats error:", error);
      toast.error("Error Loading Statistics", {
        description: "Failed to load conversion statistics. Please try again.",
      });
    }
  }, []);

  const fetchConversions = useCallback(async () => {
    try {
      const result = await adminPointsConversionApiService.getAllConversions(
        page,
        10,
        statusFilter
      );
      if (result.success && result.data) {
        setConversions(result.data.conversions);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      } else {
        toast.error("Failed to Load Conversions", {
          description: result.error || "Could not fetch conversion requests.",
        });
      }
    } catch (error) {
      console.error("Fetch conversions error:", error);
      toast.error("Error Loading Conversions", {
        description: "Failed to load conversion requests. Please try again.",
      });
    }
  }, [page, statusFilter]);

  const fetchCurrentRate = useCallback(async () => {
    try {
      const result = await adminPointsConversionApiService.getCurrentRate();
      if (result.success && result.data) {
        setCurrentRate(result.data);
        setNewRate({
          pointsPerCVC: result.data.pointsPerCVC,
          minimumPoints: result.data.minimumPoints,
          minimumCVC: result.data.minimumCVC,
          claimFeeETH: result.data.claimFeeETH
        });
      }
    } catch (error) {
      console.error("Error loading current rate:", error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchConversionStats(),
        fetchConversions(),
        fetchCurrentRate()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchConversionStats, fetchConversions, fetchCurrentRate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApproveConversion = async (conversion: Conversion) => {
    setSelectedConversion(conversion);
    setActionType('approve');
    setAdminNote('');
    setShowActionModal(true);
  };

  const handleRejectConversion = async (conversion: Conversion) => {
    setSelectedConversion(conversion);
    setActionType('reject');
    setRejectionReason('');
    setShowActionModal(true);
  };

  const executeAction = async () => {
    if (!selectedConversion) return;

    try {
      setProcessing(true);
      let result;

      if (actionType === 'approve') {
        result = await adminPointsConversionApiService.approveConversion(
          selectedConversion.id,
          adminNote
        );
      } else {
        if (!rejectionReason.trim()) {
          toast.error("Rejection Reason Required", {
            description: "Please provide a reason for rejecting this conversion request.",
          });
          return;
        }
        result = await adminPointsConversionApiService.rejectConversion(
          selectedConversion.id,
          rejectionReason
        );
      }

      if (result.success) {
        toast.success(
          actionType === 'approve'
            ? "Conversion Approved Successfully! ✅"
            : "Conversion Rejected Successfully! ❌",
          {
            description: actionType === 'approve'
              ? `User can now claim ${selectedConversion.cvcAmount} CVC tokens.`
              : "The conversion request has been rejected.",
            duration: 5000,
          }
        );
        setShowActionModal(false);
        setSelectedConversion(null);
        await fetchConversions();
        await fetchConversionStats();
      } else {
        toast.error(
          actionType === 'approve' ? "Approval Failed" : "Rejection Failed",
          {
            description: result.error || `Failed to ${actionType} the conversion request.`,
          }
        );
      }
    } catch (error) {
      console.error("Action error:", error);
      const err = error as Error;
      toast.error(
        actionType === 'approve' ? "Approval Error" : "Rejection Error",
        {
          description: err.message || `An error occurred while ${actionType}ing the conversion.`,
        }
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateRate = async () => {
    try {
      setProcessing(true);
      const result = await adminPointsConversionApiService.updateConversionRate(newRate);

      if (result.success) {
        toast.success("Conversion Rate Updated! 🎉", {
          description: `New rate: ${newRate.pointsPerCVC} points = 1 CVC. Claim fee: ${newRate.claimFeeETH} ETH.`,
          duration: 6000,
        });
        setShowRateModal(false);
        await fetchCurrentRate();
      } else {
        toast.error("Update Failed", {
          description: result.error || "Failed to update conversion rate. Please try again.",
        });
      }
    } catch (error) {
      console.error("Update rate error:", error);
      const err = error as Error;
      toast.error("Update Error", {
        description: err.message || "An error occurred while updating the conversion rate.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const viewConversionDetails = async (conversion: Conversion) => {
    setSelectedConversion(conversion);
    setShowDetailsModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'claimed':
        return <Coins className="h-4 w-4 text-blue-400" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900/50 text-yellow-300';
      case 'approved':
        return 'bg-green-900/50 text-green-300';
      case 'claimed':
        return 'bg-blue-900/50 text-blue-300';
      case 'rejected':
        return 'bg-red-900/50 text-red-300';
      default:
        return 'bg-gray-900/50 text-gray-300';
    }
  };

  if (loading) {
    return <AdminConversionSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Points Conversion Management
          </h1>
          <p className="text-slate-400 mt-2">Manage user points to CVC conversions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchData}
            variant="outline"
            className="border-blue-800/30 text-blue-300 hover:bg-blue-700/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowRateModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Update Rate
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-md border-blue-800/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                Total Conversions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalConversions}</div>
              <p className="text-blue-300 text-sm">All Time</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-md border-purple-800/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                Points Converted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalPointsConverted.toLocaleString()}</div>
              <p className="text-purple-300 text-sm">Total Points</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-md border-emerald-800/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                <Coins className="h-4 w-4 text-emerald-400" />
                CVC Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalCVCGenerated.toLocaleString()}</div>
              <p className="text-emerald-300 text-sm">CVC Tokens</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-md border-green-800/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                CVC Claimed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalClaimed.toLocaleString()}</div>
              <p className="text-green-300 text-sm">Claimed Tokens</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-md border-amber-800/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalPending}</div>
              <p className="text-amber-300 text-sm">Awaiting Review</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Rate Display */}
      {currentRate && (
        <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-cyan-400" />
              Current Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-white">{currentRate.pointsPerCVC}</div>
                <div className="text-slate-400 text-sm">Points per CVC</div>
              </div>
              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-white">{currentRate.minimumPoints}</div>
                <div className="text-slate-400 text-sm">Minimum Points</div>
              </div>
              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-white">{currentRate.minimumCVC}</div>
                <div className="text-slate-400 text-sm">Minimum CVC</div>
              </div>
              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-white">{currentRate.claimFeeETH}</div>
                <div className="text-slate-400 text-sm">ETH Claim Fee</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversions Table with Tabs */}
      <Tabs defaultValue="conversions" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full bg-slate-800/50">
          <TabsTrigger value="conversions" className="text-slate-300 data-[state=active]:text-white">
            All Conversions
          </TabsTrigger>
          <TabsTrigger value="claimed" className="text-slate-300 data-[state=active]:text-white">
            Claiming History
          </TabsTrigger>
          <TabsTrigger value="users" className="text-slate-300 data-[state=active]:text-white">
            Users Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversions">
          <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Conversion Requests
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                      // Fetch will be triggered by useEffect
                    }}
                    className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-1 text-white text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="claimed">Claimed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {conversions.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-slate-300 mb-2">No Conversions Found</h3>
                  <p className="text-slate-400">No conversion requests match the current filter</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversions.map((conversion) => (
                    <div
                      key={conversion.id}
                      className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/50 hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-800 rounded-lg">
                          {getStatusIcon(conversion.status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <button
                              onClick={() => router.push(`/admin/user-management/${conversion.user.id}`)}
                              className="text-white font-medium hover:text-blue-400 hover:underline transition-colors"
                            >
                              {conversion.user.username}
                            </button>
                            <Badge className={`${getStatusColor(conversion.status)} text-xs`}>
                              {conversion.status}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm">
                            {conversion.pointsConverted} Points → {conversion.cvcAmount} CVC
                          </p>
                          <p className="text-slate-500 text-xs">
                            {format(new Date(conversion.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                          </p>
                          {conversion.user.email && (
                            <p className="text-slate-500 text-xs mt-1">
                              {conversion.user.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => viewConversionDetails(conversion)}
                          size="sm"
                          variant="outline"
                          className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {conversion.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => handleApproveConversion(conversion)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleRejectConversion(conversion)}
                              size="sm"
                              variant="destructive"
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {total > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                      <p className="text-slate-400 text-sm">
                        Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} {statusFilter ? `${statusFilter} ` : ''}conversions
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            setPage(1);
                            fetchConversions();
                          }}
                          disabled={page === 1}
                          variant="outline"
                          size="sm"
                          className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                        >
                          First
                        </Button>
                        <Button
                          onClick={() => {
                            setPage(prev => Math.max(1, prev - 1));
                          }}
                          disabled={page === 1}
                          variant="outline"
                          size="sm"
                          className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                        >
                          Previous
                        </Button>
                        <span className="text-slate-400 text-sm px-3">
                          Page {page} of {totalPages}
                        </span>
                        <Button
                          onClick={() => {
                            setPage(prev => Math.min(totalPages, prev + 1));
                          }}
                          disabled={page === totalPages}
                          variant="outline"
                          size="sm"
                          className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                        >
                          Next
                        </Button>
                        <Button
                          onClick={() => {
                            setPage(totalPages);
                            fetchConversions();
                          }}
                          disabled={page === totalPages}
                          variant="outline"
                          size="sm"
                          className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claimed">
          <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Coins className="h-5 w-5 text-green-400" />
                Claiming History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversions.filter(c => c.status === 'claimed').length === 0 ? (
                <div className="text-center py-12">
                  <Coins className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-slate-300 mb-2">No Claims Yet</h3>
                  <p className="text-slate-400">No CVC tokens have been claimed yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversions
                    .filter(c => c.status === 'claimed')
                    .map((conversion) => (
                      <div
                        key={conversion.id}
                        className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/50 hover:bg-slate-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-green-800/30 rounded-lg">
                            <Coins className="h-5 w-5 text-green-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <button
                                onClick={() => router.push(`/admin/user-management/${conversion.user.id}`)}
                                className="text-white font-medium hover:text-green-400 hover:underline transition-colors"
                              >
                                {conversion.user.username}
                              </button>
                              <Badge className="bg-green-900/50 text-green-300 text-xs">
                                Claimed
                              </Badge>
                            </div>
                            <p className="text-slate-400 text-sm">
                              {conversion.pointsConverted} Points → {conversion.cvcAmount} CVC
                            </p>
                            {conversion.user.email && (
                              <p className="text-slate-500 text-xs">
                                {conversion.user.email}
                              </p>
                            )}
                            {conversion.claimedAt && (
                              <p className="text-slate-500 text-xs">
                                Claimed: {format(new Date(conversion.claimedAt), "MMM dd, yyyy 'at' HH:mm")}
                              </p>
                            )}
                            {conversion.walletAddress && (
                              <p className="text-slate-500 text-xs font-mono">
                                Wallet: {conversion.walletAddress.slice(0, 6)}...{conversion.walletAddress.slice(-4)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {conversion.transactionHash && (
                            <a
                              href={`https://sepolia.etherscan.io/tx/${conversion.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm underline"
                            >
                              View TX
                            </a>
                          )}
                          <Button
                            onClick={() => viewConversionDetails(conversion)}
                            size="sm"
                            variant="outline"
                            className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                Users with Conversions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversions.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-slate-300 mb-2">No Users Found</h3>
                  <p className="text-slate-400">No users have made conversion requests yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from(new Map(conversions.map(c => [c.user.id, c.user])).values()).map((user) => {
                    const userConversions = conversions.filter(c => c.user.id === user.id);
                    const totalPoints = userConversions.reduce((sum, c) => sum + c.pointsConverted, 0);
                    const totalCVC = userConversions.reduce((sum, c) => sum + c.cvcAmount, 0);
                    const claimedCount = userConversions.filter(c => c.status === 'claimed').length;

                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/50 hover:bg-slate-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {user.profilePic ? (
                            <Image
                              src={user.profilePic}
                              alt={user.username}
                              width={48}
                              height={48}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-purple-600/30 flex items-center justify-center">
                              <Users className="h-6 w-6 text-purple-400" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <button
                                onClick={() => router.push(`/admin/user-management/${user.id}`)}
                                className="text-white font-medium hover:text-purple-400 hover:underline transition-colors"
                              >
                                {user.username}
                              </button>
                              <Badge className="bg-purple-900/50 text-purple-300 text-xs">
                                {userConversions.length} {userConversions.length === 1 ? 'Conversion' : 'Conversions'}
                              </Badge>
                            </div>
                            <p className="text-slate-400 text-sm">{user.email}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                              <span>{totalPoints} Points</span>
                              <span>→</span>
                              <span>{totalCVC} CVC</span>
                              {claimedCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-400">{claimedCount} Claimed</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => router.push(`/admin/user-management/${user.id}`)}
                          size="sm"
                          variant="outline"
                          className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View User
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Modal */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionType === 'approve' ? 'Approve' : 'Reject'} Conversion
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {actionType === 'approve'
                ? 'Approve this conversion request. The user will be able to claim CVC tokens.'
                : 'Reject this conversion request and provide a reason.'}
            </DialogDescription>
          </DialogHeader>

          {selectedConversion && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">User:</span>
                  <span className="text-white">{selectedConversion.user.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Points:</span>
                  <span className="text-white">{selectedConversion.pointsConverted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CVC Amount:</span>
                  <span className="text-white">{selectedConversion.cvcAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rate:</span>
                  <span className="text-white">{selectedConversion.conversionRate} points/CVC</span>
                </div>
              </div>

              {actionType === 'approve' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Admin Note (Optional)</label>
                  <Textarea
                    placeholder="Add a note for the user..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Rejection Reason *</label>
                  <Textarea
                    placeholder="Provide a reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 border-slate-600 text-slate-300"
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={executeAction}
                  disabled={processing || (actionType === 'reject' && !rejectionReason.trim())}
                  className={`flex-1 ${actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                    } text-white`}
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    actionType === 'approve' ? 'Approve' : 'Reject'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Conversion Details</DialogTitle>
          </DialogHeader>

          {selectedConversion && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-1">User Information</h4>
                    <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Username:</span>
                        <button
                          onClick={() => {
                            setShowDetailsModal(false);
                            router.push(`/admin/user-management/${selectedConversion.user.id}`);
                          }}
                          className="text-white hover:text-blue-400 hover:underline transition-colors"
                        >
                          {selectedConversion.user.username}
                        </button>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="text-white text-sm">{selectedConversion.user.email}</span>
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={() => {
                            setShowDetailsModal(false);
                            router.push(`/admin/user-management/${selectedConversion.user.id}`);
                          }}
                          size="sm"
                          variant="outline"
                          className="border-blue-600/50 text-blue-300 hover:bg-blue-700/20"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View User Profile
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-1">Conversion Details</h4>
                    <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Points Converted:</span>
                        <span className="text-white">{selectedConversion.pointsConverted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">CVC Amount:</span>
                        <span className="text-white">{selectedConversion.cvcAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Conversion Rate:</span>
                        <span className="text-white">{selectedConversion.conversionRate} points/CVC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Claim Fee:</span>
                        <span className="text-white">{selectedConversion.claimFee} ETH</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-1">Status Information</h4>
                    <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Status:</span>
                        <Badge className={getStatusColor(selectedConversion.status)}>
                          {selectedConversion.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Created:</span>
                        <span className="text-white text-sm">
                          {format(new Date(selectedConversion.createdAt), "MMM dd, yyyy HH:mm")}
                        </span>
                      </div>
                      {selectedConversion.approvedAt && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Processed:</span>
                          <span className="text-white text-sm">
                            {format(new Date(selectedConversion.approvedAt), "MMM dd, yyyy HH:mm")}
                          </span>
                        </div>
                      )}
                      {selectedConversion.claimedAt && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Claimed:</span>
                          <span className="text-white text-sm">
                            {format(new Date(selectedConversion.claimedAt), "MMM dd, yyyy HH:mm")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(selectedConversion.walletAddress || selectedConversion.transactionHash) && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-1">Blockchain Details</h4>
                      <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                        {selectedConversion.walletAddress && (
                          <div>
                            <span className="text-slate-400 text-sm">Wallet:</span>
                            <p className="text-white font-mono text-xs break-all">
                              {selectedConversion.walletAddress}
                            </p>
                          </div>
                        )}
                        {selectedConversion.transactionHash && (
                          <div>
                            <span className="text-slate-400 text-sm">Transaction:</span>
                            <a
                              href={`https://sepolia.etherscan.io/tx/${selectedConversion.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 font-mono text-xs break-all underline block"
                            >
                              {selectedConversion.transactionHash}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedConversion.adminNote && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Admin Note</h4>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-white text-sm">{selectedConversion.adminNote}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rate Update Modal */}
      <Dialog open={showRateModal} onOpenChange={setShowRateModal}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Update Conversion Rate</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update the points to CVC conversion rate and fees
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Points per CVC</label>
                <Input
                  type="number"
                  value={newRate.pointsPerCVC}
                  onChange={(e) => setNewRate(prev => ({ ...prev, pointsPerCVC: parseInt(e.target.value) }))}
                  className="bg-slate-800/50 border-slate-600/50 text-white"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Minimum Points</label>
                <Input
                  type="number"
                  value={newRate.minimumPoints}
                  onChange={(e) => setNewRate(prev => ({ ...prev, minimumPoints: parseInt(e.target.value) }))}
                  className="bg-slate-800/50 border-slate-600/50 text-white"
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Minimum CVC</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newRate.minimumCVC}
                  onChange={(e) => setNewRate(prev => ({ ...prev, minimumCVC: parseFloat(e.target.value) }))}
                  className="bg-slate-800/50 border-slate-600/50 text-white"
                  min="0.01"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Claim Fee (ETH)</label>
                <Input
                  type="text"
                  value={newRate.claimFeeETH}
                  onChange={(e) => setNewRate(prev => ({ ...prev, claimFeeETH: e.target.value }))}
                  className="bg-slate-800/50 border-slate-600/50 text-white"
                  placeholder="0.001"
                />
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Preview</h4>
              <p className="text-slate-300 text-sm">
                With this rate, {newRate.pointsPerCVC * 10} points will convert to 10 CVC tokens.
                Users will pay {newRate.claimFeeETH} ETH fee when claiming.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRateModal(false)}
                className="flex-1 border-slate-600 text-slate-300"
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRate}
                disabled={processing}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Rate'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminConversionSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-12 w-96 bg-slate-700" />
          <Skeleton className="h-6 w-64 bg-slate-700 mt-2" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24 bg-slate-700" />
          <Skeleton className="h-10 w-32 bg-slate-700" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="bg-slate-800/50">
            <CardHeader>
              <Skeleton className="h-5 w-32 bg-slate-700" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 bg-slate-700 mb-2" />
              <Skeleton className="h-4 w-24 bg-slate-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}