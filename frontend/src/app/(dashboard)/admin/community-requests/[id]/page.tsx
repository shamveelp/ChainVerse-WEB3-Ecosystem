"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Users, Mail, Shield, Globe, MessageSquare, ExternalLink, Check, X, Clock, Calendar, User, FileText, Image, Link, AlertCircle, Loader2, MapPin, Hash, CreditCard as Edit3 } from 'lucide-react';
import { getCommunityRequestById, approveCommunityRequest, rejectCommunityRequest } from '@/services/adminApiService';
import { toast } from '@/hooks/use-toast';
import { CommunityRequest } from '@/types/community';

export default function CommunityRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<CommunityRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  const fetchRequestDetails = async () => {
    setLoading(true);
    try {
      const result = await getCommunityRequestById(requestId);
      if (result.success) {
        setRequest(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch request details");
      }
    } catch (error: any) {
      console.error('Fetch request details error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch community request details",
        variant: "destructive"
      });
      router.push('/admin/community-requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!request) return;
    
    setActionLoading('approve');
    try {
      const result = await approveCommunityRequest(request._id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Community request approved successfully! Approval email has been sent.",
          className: "bg-green-900/90 border-green-500/50 text-green-100"
        });
        fetchRequestDetails(); // Refresh the data
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

  const handleReject = async () => {
    if (!request || !rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    setActionLoading('reject');
    try {
      const result = await rejectCommunityRequest(request._id, rejectReason);
      if (result.success) {
        toast({
          title: "Success",
          description: "Community request rejected successfully! Rejection email has been sent.",
          className: "bg-red-900/90 border-red-500/50 text-red-100"
        });
        setRejectReason('');
        fetchRequestDetails(); // Refresh the data
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <Check className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-red-400 mx-auto" />
          <span className="text-slate-400">Loading community request details...</span>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-slate-600 mx-auto" />
          <p className="text-slate-400">Community request not found</p>
          <Button
            onClick={() => router.push('/admin/community-requests')}
            variant="outline"
            className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/admin/community-requests')}
            variant="outline"
            className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-red-400/50 text-slate-300 hover:text-red-400"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              Community Application Details
            </h1>
            <p className="text-slate-400">
              Review and manage community application
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Community Overview */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader className="pb-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24 border-2 border-slate-700/50">
                  <AvatarImage src={request.logo} alt={request.communityName} />
                  <AvatarFallback className="bg-slate-800 text-slate-300 text-2xl font-bold">
                    {request.communityName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <CardTitle className="text-3xl font-bold text-white">
                      {request.communityName}
                    </CardTitle>
                    <Badge className={`${getStatusColor(request.status)} border flex items-center gap-1 text-sm px-3 py-1`}>
                      {getStatusIcon(request.status)}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail className="h-4 w-4" />
                      <span>{request.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <User className="h-4 w-4" />
                      <span>@{request.username}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(request.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Hash className="h-4 w-4" />
                      <span>{request.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Community Description */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-400" />
                Community Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-800/50 p-6 rounded-lg">
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Why Choose Us */}
          {request.whyChooseUs && (
            <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                  Why They Chose ChainVerse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-800/50 p-6 rounded-lg">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {request.whyChooseUs}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Community Rules */}
          {request.rules && request.rules.length > 0 && (
            <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-400" />
                  Community Rules ({request.rules.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {request.rules.map((rule, index) => (
                    <div key={index} className="bg-slate-800/50 p-4 rounded-lg flex items-start gap-4">
                      <span className="text-red-400 font-bold text-lg flex-shrink-0 mt-1">
                        {index + 1}.
                      </span>
                      <p className="text-slate-300 leading-relaxed">{rule}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Social Media Links */}
          {request.socialLinks && Object.keys(request.socialLinks).some(key => request.socialLinks[key as keyof typeof request.socialLinks]) && (
            <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Link className="h-5 w-5 text-purple-400" />
                  Social Media Presence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {request.socialLinks.twitter && (
                    <a
                      href={request.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors group"
                    >
                      <MessageSquare className="h-5 w-5 text-blue-400" />
                      <div className="flex-1">
                        <p className="text-blue-400 font-medium">Twitter/X</p>
                        <p className="text-slate-400 text-sm truncate">{request.socialLinks.twitter}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-blue-400" />
                    </a>
                  )}
                  {request.socialLinks.discord && (
                    <a
                      href={request.socialLinks.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors group"
                    >
                      <MessageSquare className="h-5 w-5 text-purple-400" />
                      <div className="flex-1">
                        <p className="text-purple-400 font-medium">Discord</p>
                        <p className="text-slate-400 text-sm truncate">{request.socialLinks.discord}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-purple-400" />
                    </a>
                  )}
                  {request.socialLinks.telegram && (
                    <a
                      href={request.socialLinks.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors group"
                    >
                      <MessageSquare className="h-5 w-5 text-blue-400" />
                      <div className="flex-1">
                        <p className="text-blue-400 font-medium">Telegram</p>
                        <p className="text-slate-400 text-sm truncate">{request.socialLinks.telegram}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-blue-400" />
                    </a>
                  )}
                  {request.socialLinks.website && (
                    <a
                      href={request.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors group"
                    >
                      <Globe className="h-5 w-5 text-green-400" />
                      <div className="flex-1">
                        <p className="text-green-400 font-medium">Website</p>
                        <p className="text-slate-400 text-sm truncate">{request.socialLinks.website}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-green-400" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visual Assets */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Image className="h-5 w-5 text-orange-400" />
                Visual Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {request.logo && (
                  <div className="space-y-3">
                    <h5 className="text-slate-400 font-medium">Community Logo</h5>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <img
                        src={request.logo}
                        alt="Community Logo"
                        className="w-full h-64 object-contain rounded-lg bg-slate-900"
                      />
                    </div>
                  </div>
                )}
                {request.banner && (
                  <div className="space-y-3">
                    <h5 className="text-slate-400 font-medium">Community Banner</h5>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <img
                        src={request.banner}
                        alt="Community Banner"
                        className="w-full h-64 object-cover rounded-lg bg-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rejection Reason (if rejected) */}
          {request.status === 'rejected' && request.rejectionReason && (
            <Card className="bg-red-900/20 border-red-700/30">
              <CardHeader>
                <CardTitle className="text-red-300 flex items-center gap-2">
                  <X className="h-5 w-5" />
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-lg">
                  <p className="text-red-100">{request.rejectionReason}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5 text-blue-400" />
                Application Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-400 text-sm">Status:</span>
                  <Badge className={`ml-2 ${getStatusColor(request.status)} border`}>
                    {getStatusIcon(request.status)}
                    <span className="ml-1">{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-400 text-sm">Applied on:</span>
                  <p className="text-white text-sm">{formatDate(request.createdAt)}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-sm">Last updated:</span>
                  <p className="text-white text-sm">{formatDate(request.updatedAt)}</p>
                </div>
                {request.walletAddress && (
                  <div>
                    <span className="text-slate-400 text-sm">Wallet Address:</span>
                    <p className="text-white text-xs font-mono break-all mt-1 bg-slate-800/50 p-2 rounded">
                      {request.walletAddress}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {request.status === 'pending' && (
            <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-green-400" />
                  Review Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleApprove}
                  disabled={actionLoading === 'approve'}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading === 'approve' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Approve Community
                </Button>

                <Separator className="bg-slate-700/50" />

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">
                    Rejection Reason:
                  </label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please provide a detailed reason for rejection. This will be sent to the applicant via email."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 min-h-[120px]"
                    rows={4}
                  />
                  <Button
                    onClick={handleReject}
                    disabled={actionLoading === 'reject' || !rejectReason.trim()}
                    variant="destructive"
                    className="w-full"
                  >
                    {actionLoading === 'reject' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Reject Application
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Application History */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                Application Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-white text-sm font-medium">Application Submitted</p>
                    <p className="text-slate-400 text-xs">{formatDate(request.createdAt)}</p>
                  </div>
                </div>
                {request.status !== 'pending' && (
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      request.status === 'approved' ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        Application {request.status === 'approved' ? 'Approved' : 'Rejected'}
                      </p>
                      <p className="text-slate-400 text-xs">{formatDate(request.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}