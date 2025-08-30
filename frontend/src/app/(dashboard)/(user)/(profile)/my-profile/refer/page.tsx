"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Copy, 
  Share2, 
  Users, 
  Gift, 
  TrendingUp, 
  Calendar,
  ExternalLink
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { userApiService } from "@/services/userApiServices";
import { format } from "date-fns";

interface ReferralData {
  totalReferrals: number;
  totalPointsEarned: number;
  referralCode: string;
  referralLink: string;
}

interface ReferralHistoryItem {
  _id: string;
  referred: {
    _id: string;
    username: string;
    name: string;
    email: string;
    createdAt: string;
  };
  pointsAwarded: number;
  createdAt: string;
}

export default function ReferPage() {
  const { profile } = useSelector((state: RootState) => state.userProfile);
  const [referralStats, setReferralStats] = useState<ReferralData | null>(null);
  const [referralHistory, setReferralHistory] = useState<ReferralHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 5;

  useEffect(() => {
    fetchReferralStats();
    fetchReferralHistory(1);
  }, []);

  const fetchReferralStats = async () => {
    try {
      const result = await userApiService.getReferralStats();
      if (result.success) {
        setReferralStats(result.data!);
      } else {
        toast.error("Failed to load referral stats", { description: result.error });
      }
    } catch (error) {
      toast.error("Error loading referral data");
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralHistory = async (pageNum: number) => {
    try {
      setHistoryLoading(true);
      const result = await userApiService.getReferralHistory(pageNum, limit);
      if (result.success) {
        if (pageNum === 1) {
          setReferralHistory(result.data.referrals);
        } else {
          setReferralHistory(prev => [...prev, ...result.data.referrals]);
        }
        setTotal(result.data.total);
        setPage(pageNum);
      } else {
        toast.error("Failed to load referral history", { description: result.error });
      }
    } catch (error) {
      toast.error("Error loading referral history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join ChainVerse with my referral',
        text: 'Join me on ChainVerse and we both earn bonus points!',
        url: referralStats?.referralLink,
      });
    } else {
      copyToClipboard(referralStats?.referralLink || '', 'Referral link');
    }
  };

  if (loading) {
    return <ReferSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Refer & Earn
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Invite friends to ChainVerse and earn 100 points for each successful referral!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md border-blue-800/30 shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <div className="text-3xl font-bold text-white">{referralStats?.totalReferrals || 0}</div>
            <div className="text-slate-400">Total Referrals</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-600/20 to-teal-600/20 backdrop-blur-md border-green-800/30 shadow-lg hover:shadow-green-500/20 transition-all duration-300">
          <CardContent className="p-6 text-center">
            <Gift className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <div className="text-3xl font-bold text-white">{referralStats?.totalPointsEarned || 0}</div>
            <div className="text-slate-400">Points Earned</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-600/20 to-yellow-600/20 backdrop-blur-md border-orange-800/30 shadow-lg hover:shadow-orange-500/20 transition-all duration-300">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <div className="text-3xl font-bold text-white">100</div>
            <div className="text-slate-400">Points Per Referral</div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code & Link */}
      <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30 shadow-lg shadow-blue-500/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Your Referral Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referral Code */}
          <div className="space-y-3">
            <h3 className="text-slate-300 font-medium">Referral Code</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-900/50 border border-blue-800/30 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-blue-400 tracking-wider">
                    {referralStats?.referralCode}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => copyToClipboard(referralStats?.referralCode || '', 'Referral code')}
                className="bg-blue-600 hover:bg-blue-700 px-4"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="space-y-3">
            <h3 className="text-slate-300 font-medium">Referral Link</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-900/50 border border-blue-800/30 rounded-lg p-3">
                <div className="text-sm text-slate-300 break-all font-mono">
                  {referralStats?.referralLink}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(referralStats?.referralLink || '', 'Referral link')}
                  variant="outline"
                  className="border-blue-800/30 text-blue-300 hover:bg-blue-700/20"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  onClick={shareReferralLink}
                  variant="outline"
                  className="border-green-800/30 text-green-300 hover:bg-green-700/20"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg p-4 border border-blue-800/20">
            <h4 className="text-white font-medium mb-3">How Referrals Work</h4>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">1</div>
                <span>Share your referral code or link with friends</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">2</div>
                <span>They sign up using your referral code</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full text-xs flex items-center justify-center font-bold">3</div>
                <span>You both earn 100 bonus points!</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30 shadow-lg shadow-blue-500/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          {referralHistory.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-300 mb-2">No Referrals Yet</h3>
              <p className="text-slate-400 mb-6">Start inviting friends to earn points!</p>
              <Button 
                onClick={shareReferralLink}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Referral Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {referralHistory.map((referral) => (
                <div
                  key={referral._id}
                  className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/50 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-slate-700 text-white">
                        {referral.referred.name?.charAt(0)?.toUpperCase() || 
                         referral.referred.username?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-white font-medium">{referral.referred.name || referral.referred.username}</h4>
                      <p className="text-slate-400 text-sm">@{referral.referred.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        <span className="text-xs text-slate-500">
                          Joined {format(new Date(referral.createdAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-900/50 text-green-300 mb-2">
                      +{referral.pointsAwarded} Points
                    </Badge>
                    <div className="text-xs text-slate-500">
                      {format(new Date(referral.createdAt), "MMM dd")}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Load More Button */}
              {referralHistory.length < total && (
                <div className="text-center pt-4">
                  <Button
                    onClick={() => fetchReferralHistory(page + 1)}
                    disabled={historyLoading}
                    variant="outline"
                    className="border-blue-800/30 text-blue-300 hover:bg-blue-700/20"
                  >
                    {historyLoading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReferSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-64 mx-auto bg-slate-700" />
        <Skeleton className="h-6 w-96 mx-auto bg-slate-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-slate-800/50">
            <CardContent className="p-6 text-center">
              <Skeleton className="h-12 w-12 mx-auto mb-4 bg-slate-700" />
              <Skeleton className="h-8 w-16 mx-auto mb-2 bg-slate-700" />
              <Skeleton className="h-4 w-24 mx-auto bg-slate-700" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-800/50">
        <CardHeader>
          <Skeleton className="h-6 w-48 bg-slate-700" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full bg-slate-700" />
          <Skeleton className="h-16 w-full bg-slate-700" />
        </CardContent>
      </Card>
    </div>
  );
}