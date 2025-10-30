"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Lock, Zap, ArrowRight } from "lucide-react";
import { communityAdminSubscriptionApiService } from "@/services/communityAdmin/communityAdminSubscriptionApiService";
import { Skeleton } from "@/components/ui/skeleton";

interface ChainCastAccessGuardProps {
  children: React.ReactNode;
}

export function ChainCastAccessGuard({ children }: ChainCastAccessGuardProps) {
  const router = useRouter();
  const { chainCastAccess, subscription, communityAdmin } = useSelector((state: RootState) => state.communityAdminAuth);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // First check Redux state
        if (chainCastAccess) {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // If not in Redux, check with API
        const response = await communityAdminSubscriptionApiService.checkChainCastAccess();
        if (response.success && response.data?.hasAccess) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Error checking ChainCast access:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [chainCastAccess, communityAdmin]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-4">
          <Skeleton className="h-20 w-20 rounded-full mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-black/60 backdrop-blur-xl border-red-800/30">
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-6 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-r from-red-600/20 to-yellow-600/20 rounded-full flex items-center justify-center mx-auto border-2 border-red-500/30">
            <Lock className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent">
            ChainCast Locked
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            ChainCast is a premium feature that allows you to create live streams and engage with your community in real-time.
          </p>
        </div>

        {/* Feature Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-600/50 transition-all">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Live Streaming</h3>
              <p className="text-gray-400 text-sm">Host live video streams for your community members</p>
            </CardContent>
          </Card>

          <Card className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-600/50 transition-all">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Interactive Features</h3>
              <p className="text-gray-400 text-sm">Real-time chat, reactions, and audience participation</p>
            </CardContent>
          </Card>

          <Card className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-600/50 transition-all">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Advanced Analytics</h3>
              <p className="text-gray-400 text-sm">Track engagement and viewer insights</p>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status */}
        {subscription && (subscription.status === 'pending' || subscription.status === 'failed') ? (
          <Card className="bg-gradient-to-r from-yellow-950/50 to-red-950/50 backdrop-blur-xl border-yellow-600/40">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                {subscription.status === 'pending' ? 'Payment Pending' : 'Payment Failed'}
              </h3>
              <p className="text-gray-300 mb-4">
                {subscription.status === 'pending' 
                  ? 'You have a pending payment. Complete it to unlock ChainCast.'
                  : 'Your previous payment failed. You can retry or create a new subscription.'
                }
              </p>
              <Button
                onClick={() => router.push('/comms-admin/premium')}
                className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white"
              >
                <Crown className="h-4 w-4 mr-2" />
                Complete Payment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-r from-red-950/50 to-yellow-950/50 backdrop-blur-xl border-yellow-600/40">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Unlock ChainCast Today</h3>
              <p className="text-gray-300 mb-4">
                Get lifetime access to ChainCast and all premium features for just ₹899
              </p>
              <Button
                onClick={() => router.push('/comms-admin/premium')}
                className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        <Card className="bg-black/60 backdrop-blur-xl border-gray-800/30">
          <CardHeader>
            <CardTitle className="text-center text-white">Why Choose Premium?</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Blue Tick Verification</p>
                  <p className="text-gray-400">Build trust with verified community status</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Unlimited Members</p>
                  <p className="text-gray-400">Scale your community without limits</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Advanced Analytics</p>
                  <p className="text-gray-400">Deep insights into community engagement</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Priority Support</p>
                  <p className="text-gray-400">Get help when you need it most</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}