"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Zap, Calendar, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface QuestAccessGuardProps {
  children: React.ReactNode;
}

// Mock subscription check - replace with actual API call
const useSubscriptionStatus = () => {
  const [status, setStatus] = useState<{
    hasAccess: boolean;
    subscriptionType: string | null;
    expiresAt: Date | null;
    loading: boolean;
  }>({
    hasAccess: true, // Set to true for demo - change to false to test paywall
    subscriptionType: 'premium',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    loading: false
  });

  return status;
};

export function QuestAccessGuard({ children }: QuestAccessGuardProps) {
  const { hasAccess, subscriptionType, expiresAt, loading } = useSubscriptionStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto" />
          <p className="text-gray-400">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
          <CardContent className="p-8 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Lock className="h-4 w-4 text-black" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Quest System - Premium Feature
            </h2>
            
            <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
              Unlock the power of community quests! Create engaging challenges, reward your members, 
              and grow your community with our advanced quest system.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-black/40 rounded-lg p-4 border border-purple-800/30">
                <Zap className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white mb-2">AI Quest Generation</h3>
                <p className="text-gray-400 text-sm">Create quests instantly with our AI assistant</p>
              </div>
              
              <div className="bg-black/40 rounded-lg p-4 border border-purple-800/30">
                <Crown className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white mb-2">Advanced Rewards</h3>
                <p className="text-gray-400 text-sm">Token, NFT, and custom reward systems</p>
              </div>
              
              <div className="bg-black/40 rounded-lg p-4 border border-purple-800/30">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white mb-2">Auto-Verification</h3>
                <p className="text-gray-400 text-sm">Smart verification for community tasks</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Premium Subscription Required</h3>
              <p className="text-purple-100 mb-4">
                Get access to Quest System and all premium features
              </p>
              <div className="flex items-center justify-center gap-4 text-white">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Monthly Plan</span>
                </div>
                <Badge className="bg-white/20 text-white">
                  $29.99/month
                </Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                onClick={() => {
                  // Navigate to subscription page
                  window.location.href = '/comms-admin/subscription';
                }}
              >
                <Crown className="h-5 w-5 mr-2" />
                Upgrade to Premium
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-950/30"
                onClick={() => {
                  // Open external link or documentation
                  window.open('https://chainverse.com/pricing', '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Pricing
              </Button>
            </div>

            <p className="text-gray-500 text-sm mt-6">
              Questions? Contact our support team for a demo or custom pricing.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}