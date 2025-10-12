import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Mail,
  Shield,
  Globe,
  MessageSquare,
  ExternalLink,
  Check,
  X,
  Clock,
  Calendar,
  User,
  FileText,
  Image,
  Link,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { CommunityRequest } from '@/types/community';

interface CommunityRequestDetailModalProps {
  request: CommunityRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string, reason: string) => void;
  actionLoading?: string | null;
}

export function CommunityRequestDetailModal({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
  actionLoading
}: CommunityRequestDetailModalProps) {
  const [rejectReason, setRejectReason] = useState('');

  if (!request) return null;

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

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    onReject?.(request._id, rejectReason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 text-white max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-2 border-slate-700/50">
              <AvatarImage src={request.logo} alt={request.communityName} />
              <AvatarFallback className="bg-slate-800 text-slate-300 text-xl font-bold">
                {request.communityName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3 mb-2">
                {request.communityName}
                <Badge className={`${getStatusColor(request.status)} border flex items-center gap-1`}>
                  {getStatusIcon(request.status)}
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </DialogTitle>
              <p className="text-slate-400 text-lg">Community Application Details</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Information
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 text-sm">Email:</span>
                      <p className="text-white font-medium">{request.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 text-sm">Username:</span>
                      <p className="text-white font-medium">@{request.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 text-sm">Wallet Address:</span>
                      <p className="text-white font-mono text-sm break-all">
                        {request.walletAddress || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Application Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <span className="text-slate-400 text-sm">Category:</span>
                    <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {request.category}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">Applied on:</span>
                    <p className="text-white">{formatDate(request.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">Last updated:</span>
                    <p className="text-white">{formatDate(request.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-700/50" />

          {/* Description */}
          <div>
            <h4 className="font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Community Description
            </h4>
            <div className="bg-slate-800/50 p-6 rounded-lg">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {request.description}
              </p>
            </div>
          </div>

          {/* Why Choose Us */}
          {request.whyChooseUs && (
            <div>
              <h4 className="font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Why They Chose ChainVerse
              </h4>
              <div className="bg-slate-800/50 p-6 rounded-lg">
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {request.whyChooseUs}
                </p>
              </div>
            </div>
          )}

          {/* Community Rules */}
          {request.rules && request.rules.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Community Rules ({request.rules.length})
              </h4>
              <div className="space-y-3">
                {request.rules.map((rule, index) => (
                  <div key={index} className="bg-slate-800/50 p-4 rounded-lg flex items-start gap-3">
                    <span className="text-red-400 font-bold text-lg flex-shrink-0 mt-1">
                      {index + 1}.
                    </span>
                    <p className="text-slate-300 leading-relaxed">{rule}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Media Links */}
          {request.socialLinks && Object.keys(request.socialLinks).some(key => request.socialLinks[key as keyof typeof request.socialLinks]) && (
            <div>
              <h4 className="font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
                <Link className="h-4 w-4" />
                Social Media Presence
              </h4>
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
            </div>
          )}

          {/* Visual Assets */}
          <div>
            <h4 className="font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
              <Image className="h-4 w-4" />
              Visual Assets
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {request.logo && (
                <div className="space-y-3">
                  <h5 className="text-slate-400 font-medium">Community Logo</h5>
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <img
                      src={request.logo}
                      alt="Community Logo"
                      className="w-full h-48 object-contain rounded-lg bg-slate-900"
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
                      className="w-full h-48 object-cover rounded-lg bg-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rejection Reason (if rejected) */}
          {request.status === 'rejected' && request.rejectionReason && (
            <div>
              <h4 className="font-semibold text-red-300 mb-4 border-b border-red-700/50 pb-2 flex items-center gap-2">
                <X className="h-4 w-4" />
                Rejection Reason
              </h4>
              <div className="bg-red-900/20 border border-red-700/30 p-4 rounded-lg">
                <p className="text-red-100">{request.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          {request.status === 'pending' && onApprove && onReject && (
            <div className="pt-6 border-t border-slate-700">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    onClick={() => onApprove(request._id)}
                    disabled={actionLoading === request._id}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  >
                    {actionLoading === request._id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Approve Community
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">
                    Rejection Reason (required for rejection):
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
                    disabled={actionLoading === request._id || !rejectReason.trim()}
                    variant="destructive"
                    className="w-full"
                  >
                    {actionLoading === request._id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Reject Application
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}