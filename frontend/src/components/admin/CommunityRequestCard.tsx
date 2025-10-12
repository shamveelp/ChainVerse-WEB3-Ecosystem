import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Mail, 
  Users, 
  Clock, 
  Check, 
  X, 
  Eye, 
  Shield,
  Globe,
  MessageSquare,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { CommunityRequest } from '@/types/community';

interface CommunityRequestCardProps {
  request: CommunityRequest;
  onView: (request: CommunityRequest) => void;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  actionLoading?: string | null;
}

export function CommunityRequestCard({ 
  request, 
  onView, 
  onApprove, 
  onReject, 
  actionLoading 
}: CommunityRequestCardProps) {
  const router = useRouter();

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
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/30 transition-all duration-300 hover:border-red-400/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Logo/Avatar */}
            <Avatar className="h-16 w-16 border-2 border-slate-700/50">
              <AvatarImage src={request.logo} alt={request.communityName} />
              <AvatarFallback className="bg-slate-800 text-slate-300 text-lg font-semibold">
                {request.communityName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xl font-semibold text-white line-clamp-1">
                  {request.communityName}
                </h3>
                <Badge className={`${getStatusColor(request.status)} border flex items-center gap-1`}>
                  {getStatusIcon(request.status)}
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </div>

              {/* Meta Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm truncate">{request.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">@{request.username}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{formatDate(request.createdAt)}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-300 text-sm mb-4 line-clamp-2 leading-relaxed">
                {request.description}
              </p>

              {/* Additional Info */}
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  {request.category}
                </Badge>
                {request.walletAddress && (
                  <div className="flex items-center gap-1 text-slate-500">
                    <Shield className="h-3 w-3" />
                    <span className="font-mono text-xs">
                      {request.walletAddress.slice(0, 6)}...{request.walletAddress.slice(-4)}
                    </span>
                  </div>
                )}
              </div>

              {/* Social Links Preview */}
              {Object.keys(request.socialLinks || {}).length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-slate-500">Social:</span>
                  <div className="flex items-center gap-1">
                    {request.socialLinks.website && (
                      <Globe className="h-3 w-3 text-green-400" />
                    )}
                    {request.socialLinks.twitter && (
                      <MessageSquare className="h-3 w-3 text-blue-400" />
                    )}
                    {request.socialLinks.discord && (
                      <MessageSquare className="h-3 w-3 text-purple-400" />
                    )}
                    {request.socialLinks.telegram && (
                      <MessageSquare className="h-3 w-3 text-blue-400" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 ml-4">
            <Button
              onClick={() => router.push(`/admin/community-requests/${request._id}`)}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-red-400/50 hover:text-red-400"
            >
              <Eye className="h-4 w-4 mr-1" />
              View Full Details
            </Button>

            {request.status === 'pending' && onApprove && onReject && (
              <div className="flex gap-1">
                <Button
                  onClick={() => onApprove(request._id)}
                  disabled={actionLoading === request._id}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  {actionLoading === request._id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-white" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={() => onReject(request._id)}
                  disabled={actionLoading === request._id}
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}