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

interface ReferralHistoryResponse {
  referrals: ReferralHistoryItem[];
  total: number;
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
      if (result.success && result.data) {
        setReferralStats(result.data as ReferralData);
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
      if (result.success && result.data) {
        const data = result.data as unknown as ReferralHistoryResponse;
        if (pageNum === 1) {
          setReferralHistory(data.referrals || []);
        } else {
          setReferralHistory(prev => [...prev, ...(data.referrals || [])]);
        }
        setTotal(data.total || 0);
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
        <h1 className="text-4xl font-bold text-white">
          Refer & Earn
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Invite friends to ChainVerse and earn 100 points for each successful referral!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 transition-all duration-300">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-white mx-auto mb-4 opacity-80" />
            <div className="text-3xl font-bold text-white">{referralStats?.totalReferrals || 0}</div>
            <div className="text-slate-400">Total Referrals</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 transition-all duration-300">
          <CardContent className="p-6 text-center">
            <Gift className="h-12 w-12 text-white mx-auto mb-4 opacity-80" />
            <div className="text-3xl font-bold text-white">{referralStats?.totalPointsEarned || 0}</div>
            <div className="text-slate-400">Points Earned</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 transition-all duration-300">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-12 w-12 text-white mx-auto mb-4 opacity-80" />
            <div className="text-3xl font-bold text-white">100</div>
            <div className="text-slate-400">Points Per Referral</div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code & Link */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Your Referral Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referral Code */}
          <div className="space-y-3">
            <h3 className="text-slate-300 font-medium">Referral Code</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-white tracking-wider">
                    {referralStats?.referralCode}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => copyToClipboard(referralStats?.referralCode || '', 'Referral code')}
                className="bg-white text-black hover:bg-slate-200 px-4"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="space-y-3">
            <h3 className="text-slate-300 font-medium">Referral Link</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg p-3">
                <div className="text-sm text-slate-300 break-all font-mono">
                  {referralStats?.referralLink}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(referralStats?.referralLink || '', 'Referral link')}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/10"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  onClick={shareReferralLink}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/10"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
            <h4 className="text-white font-medium mb-3">How Referrals Work</h4>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white text-black rounded-full text-xs flex items-center justify-center font-bold">1</div>
                <span>Share your referral code or link with friends</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white text-black rounded-full text-xs flex items-center justify-center font-bold">2</div>
                <span>They sign up using your referral code</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white text-black rounded-full text-xs flex items-center justify-center font-bold">3</div>
                <span>You both earn 100 bonus points!</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10">
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
                className="bg-white text-black hover:bg-slate-200"
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
                  className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-white/10 hover:bg-slate-800/50 transition-colors"
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
                    <Badge className="bg-white/10 text-white border border-white/10 mb-2">
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
                    className="border-white/10 text-white hover:bg-white/10"
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