"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, Star, Zap, Users, ChartBar as BarChart3, Shield, Sparkles, Check, ArrowRight, TrendingUp, Award, Clock, CircleAlert as AlertCircle, RefreshCw } from "lucide-react";
import { communityAdminProfileApiService } from "@/services/communityAdmin/communityAdminProfileApiService";
import { communityAdminSubscriptionApiService } from "@/services/communityAdmin/communityAdminSubscriptionApiService";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { setSubscription, setChainCastAccess } from "@/redux/slices/communityAdminAuthSlice";
import { toast } from "@/components/ui/use-toast";

const premiumFeatures = [
  {
    icon: Crown,
    title: "Blue Tick Verification",
    description: "Get a verified blue tick to boost your community's credibility",
    status: "available",
  },
  {
    icon: Zap,
    title: "ChainCast Feature",
    description: "Access exclusive ChainCast features for live community engagement",
    status: "available",
  },
  {
    icon: Shield,
    title: "Community Boost",
    description: "Increase your community's visibility and attract more members",
    status: "available",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Deep insights into community engagement and member behavior"
  },
  {
    icon: Users,
    title: "Unlimited Members",
    description: "Remove member limits and scale your community without restrictions",
    status: "available",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Moderation",
    description: "Advanced AI tools for automatic content moderation and spam detection",
    status: "coming-soon",
  },
];

const currentPlan = {
  name: "Community Standard",
  price: "Free",
  limits: {
    members: { current: 1247, max: 2000 },
    quests: { current: 28, max: 50 },
    storage: { current: 2.1, max: 5 }, // in GB
    chainCasts: { current: 15, max: 25 },
  },
};

export default function PremiumPage() {
  const dispatch = useDispatch();
  const { communityAdmin, subscription } = useSelector((state: RootState) => state.communityAdminAuth);
  const [loading, setLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{minutes: number, seconds: number} | null>(null);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Fetch subscription status
    const fetchSubscription = async () => {
      if (communityAdmin) {
        const response = await communityAdminSubscriptionApiService.getSubscription();
        if (response.success && response.data) {
          dispatch(setSubscription(response.data));
          dispatch(setChainCastAccess(response.data.status === 'active'));
        }
      }
    };
    fetchSubscription();
  }, [communityAdmin, dispatch]);

  useEffect(() => {
    // Timer for failed/pending subscriptions
    let interval: NodeJS.Timeout;
    
    if (subscription && ['pending', 'failed'].includes(subscription.status)) {
      const updateTimer = async () => {
        const response = await communityAdminSubscriptionApiService.getTimeRemaining();
        if (response.success && response.data) {
          setTimeRemaining(response.data);
          if (response.data.minutes === 0 && response.data.seconds === 0) {
            // Time expired, refetch subscription
            const subResponse = await communityAdminSubscriptionApiService.getSubscription();
            if (subResponse.success && subResponse.data) {
              dispatch(setSubscription(subResponse.data));
            }
          }
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [subscription, dispatch]);

  const handleUpgrade = async () => {
    if (!communityAdmin?.communityId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Community ID not found",
      });
      return;
    }

    setLoading(true);
    try {
      const orderResponse = await communityAdminSubscriptionApiService.createOrder(communityAdmin.communityId);
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.error || "Failed to create order");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_your_key_id",
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: "ChainVerse Premium",
        description: "Lifetime Premium Subscription",
        image: "/logo.png",
        order_id: orderResponse.data.orderId,
        handler: async (response: any) => {
          const paymentData = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          };

          const verifyResponse = await communityAdminSubscriptionApiService.verifyPayment(paymentData);
          if (verifyResponse.success && verifyResponse.data) {
            dispatch(setSubscription(verifyResponse.data));
            dispatch(setChainCastAccess(true));
            toast({
              title: "Success!",
              description: "Premium subscription activated successfully! ChainCast is now enabled.",
            });
          } else {
            throw new Error(verifyResponse.error || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: async () => {
            // Payment was cancelled or failed
            // Refetch subscription to get updated status
            const subResponse = await communityAdminSubscriptionApiService.getSubscription();
            if (subResponse.success && subResponse.data) {
              dispatch(setSubscription(subResponse.data));
            }
          }
        },
        prefill: {
          name: communityAdmin.name,
          email: communityAdmin.email,
        },
        theme: {
          color: "#F4D03F",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process payment",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    setRetryLoading(true);
    try {
      const retryResponse = await communityAdminSubscriptionApiService.retryPayment();
      if (!retryResponse.success || !retryResponse.data) {
        throw new Error(retryResponse.error || "Failed to retry payment");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_your_key_id",
        amount: retryResponse.data.amount,
        currency: retryResponse.data.currency,
        name: "ChainVerse Premium",
        description: "Lifetime Premium Subscription - Retry",
        image: "/logo.png",
        order_id: retryResponse.data.orderId,
        handler: async (response: any) => {
          const paymentData = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          };

          const verifyResponse = await communityAdminSubscriptionApiService.verifyPayment(paymentData);
          if (verifyResponse.success && verifyResponse.data) {
            dispatch(setSubscription(verifyResponse.data));
            dispatch(setChainCastAccess(true));
            toast({
              title: "Success!",
              description: "Premium subscription activated successfully! ChainCast is now enabled.",
            });
          } else {
            throw new Error(verifyResponse.error || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: async () => {
            // Refetch subscription status
            const subResponse = await communityAdminSubscriptionApiService.getSubscription();
            if (subResponse.success && subResponse.data) {
              dispatch(setSubscription(subResponse.data));
            }
          }
        },
        prefill: {
          name: communityAdmin?.name,
          email: communityAdmin?.email,
        },
        theme: {
          color: "#F4D03F",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to retry payment",
      });
    } finally {
      setRetryLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="text-center space-y-4 animate-fade-in">
        <div className="flex items-center justify-center">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-full flex items-center justify-center animate-pulse">
            <Crown className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
          Unlock Premium Power
        </h1>
        <p className="text-gray-300 text-xl max-w-3xl mx-auto">
          Elevate your community with a lifetime premium subscription for just ₹899. Get verified, access ChainCast, boost visibility, and more!       
        </p>
      </div>

      {/* Payment Status Alert */}
      {subscription && ['pending', 'failed', 'expired'].includes(subscription.status) && (
        <Card className={`${
          subscription.status === 'failed' 
            ? 'bg-gradient-to-r from-red-950/50 to-yellow-950/50 border-red-600/40' 
            : subscription.status === 'expired'
            ? 'bg-gradient-to-r from-gray-950/50 to-red-950/50 border-gray-600/40'
            : 'bg-gradient-to-r from-blue-950/50 to-yellow-950/50 border-blue-600/40'
        } backdrop-blur-xl`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                subscription.status === 'failed' 
                  ? 'bg-red-600/20' 
                  : subscription.status === 'expired'
                  ? 'bg-gray-600/20'
                  : 'bg-blue-600/20'
              }`}>
                {subscription.status === 'failed' ? (
                  <AlertCircle className="h-6 w-6 text-red-400" />
                ) : subscription.status === 'expired' ? (
                  <Clock className="h-6 w-6 text-gray-400" />
                ) : (
                  <Clock className="h-6 w-6 text-blue-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {subscription.status === 'failed' && 'Payment Failed'}
                  {subscription.status === 'pending' && 'Payment Pending'}
                  {subscription.status === 'expired' && 'Payment Window Expired'}
                </h3>
                <p className="text-gray-300 mb-4">
                  {subscription.status === 'failed' && 'Your payment failed, but you still have time to retry.'}
                  {subscription.status === 'pending' && 'Complete your payment to unlock all premium features.'}
                  {subscription.status === 'expired' && 'Your payment window has expired. You can create a new subscription.'}
                </p>
                
                {timeRemaining && subscription.status !== 'expired' && (
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400 font-mono font-semibold">
                      {timeRemaining.minutes.toString().padStart(2, '0')}:
                      {timeRemaining.seconds.toString().padStart(2, '0')}
                    </span>
                    <span className="text-gray-400 text-sm">remaining</span>
                  </div>
                )}

                <div className="flex gap-3">
                  {subscription.status !== 'expired' && (
                    <Button
                      onClick={handleRetryPayment}
                      disabled={retryLoading || (timeRemaining?.minutes === 0 && timeRemaining?.seconds === 0)}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white"
                    >
                      {retryLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry Payment
                        </>
                      )}
                    </Button>
                  )}
                  
                  {(subscription.status === 'expired' || (timeRemaining?.minutes === 0 && timeRemaining?.seconds === 0)) && (
                    <Button
                      onClick={handleUpgrade}
                      disabled={loading}
                      className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white"
                    >
                      {loading ? (
                        "Processing..."
                      ) : (
                        <>
                          <Crown className="h-4 w-4 mr-2" />
                          Create New Subscription
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plan */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-gradient-to-b from-yellow-950/50 to-black/80 backdrop-blur-2xl border-yellow-600/60 relative shadow-2xl">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-4 py-1">
              Lifetime Deal
            </Badge>
          </div>
          <CardContent className="p-8 text-center space-y-6">
            <h3 className="text-3xl font-bold text-white">Premium Lifetime</h3>
            <div className="space-y-2">
              <div className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                ₹899
              </div>
              <p className="text-sm text-gray-300">One-time payment</p>
            </div>
            <div className="space-y-4 text-left max-w-md mx-auto">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <Check className="h-5 w-5 text-yellow-400" />
                  <span className="text-gray-200">{feature.title}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={handleUpgrade}
              disabled={loading || subscription?.status === "active" || (subscription && ['pending', 'failed'].includes(subscription.status) && timeRemaining && timeRemaining.minutes > 0)}
              className={`w-full py-3 text-lg font-semibold ${
                subscription?.status === "active"
                  ? "bg-gray-600 cursor-not-allowed"
                  : (subscription && ['pending', 'failed'].includes(subscription.status) && timeRemaining && timeRemaining.minutes > 0)
                  ? "bg-blue-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white"
              }`}
            >
              {loading ? (
                "Processing..."
              ) : subscription?.status === "active" ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Already Subscribed
                </>
              ) : (subscription && ['pending', 'failed'].includes(subscription.status) && timeRemaining && timeRemaining.minutes > 0) ? (
                "Complete Pending Payment Above"
              ) : (
                <>
                  <Crown className="h-5 w-5 mr-2" />
                  Upgrade to Premium
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Success Stories */}
      <Card className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-2xl border-yellow-800/40 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-white text-center flex items-center justify-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-400" />
            Success Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-green-400">300%</div>
              <p className="text-gray-300">Average member growth after upgrading</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-blue-400">85%</div>
              <p className="text-gray-300">Higher engagement with premium features</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-yellow-400">24/7</div>
              <p className="text-gray-300">Priority support response time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-yellow-950/50 to-red-950/50 backdrop-blur-2xl border-yellow-600/40 shadow-xl">
        <CardContent className="p-8 text-center space-y-6">
          <h3 className="text-3xl font-bold text-white">Ready to Transform Your Community?</h3>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Join thousands of community leaders who have unlocked the full potential of their communities with a one-time premium subscription.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleUpgrade}
              disabled={loading || subscription?.status === "active" || (subscription && ['pending', 'failed'].includes(subscription.status) && timeRemaining && timeRemaining.minutes > 0)}
              className={`py-3 px-6 text-lg font-semibold ${
                subscription?.status === "active"
                  ? "bg-gray-600 cursor-not-allowed"
                  : (subscription && ['pending', 'failed'].includes(subscription.status) && timeRemaining && timeRemaining.minutes > 0)
                  ? "bg-blue-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white"
              }`}
            >
              {loading ? (
                "Processing..."
              ) : subscription?.status === "active" ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Already Subscribed
                </>
              ) : (subscription && ['pending', 'failed'].includes(subscription.status) && timeRemaining && timeRemaining.minutes > 0) ? (
                "Complete Pending Payment Above"
              ) : (
                <>
                  <Crown className="h-5 w-5 mr-2" />
                  Get Premium Now
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="py-3 px-6 text-lg border-yellow-600/50 text-yellow-400 hover:bg-yellow-950/30"
            >
              Schedule Demo
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}