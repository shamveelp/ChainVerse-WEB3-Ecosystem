"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, Shield, Sparkles } from "lucide-react";
import type { RootState } from "@/redux/store";
import CreatePost from "@/components/community/posts/create-posts";
import PostsFeed from "@/components/community/posts/posts-feed";
import ChainCastJoinButton from "@/components/chainCast/chainCastJoinButton";
import { Post } from "@/services/postsApiService";
import { COMMUNITY_ADMIN_ROUTES, USER_ROUTES } from "@/routes";

export default function CommunityPage() {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.userAuth);
  const [mounted, setMounted] = useState(false);
  const [feedKey, setFeedKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = () => {
    router.push(USER_ROUTES.LOGIN);
  };

  const handleAdminLogin = () => {
    router.push(COMMUNITY_ADMIN_ROUTES.GET_STARTED);
  };

  const handlePostCreated = () => {
    setFeedKey(prev => prev + 1);
  };

  const handlePostClick = (post: Post) => {
    router.push(`${USER_ROUTES.COMMUNITY_POST}/${post._id}`);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-12">
            {/* Hero Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent">
                  ChainVerse Community
                </h1>
                <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
              </div>
              <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto">
                Join the most vibrant Web3 community where builders, traders,
                and innovators connect, share knowledge, and shape the future
                of decentralized technology.
              </p>
            </div>

            {/* Call to Action */}
            <div className="space-y-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Ready to Join the Revolution?
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 p-6 sm:p-8 hover:border-cyan-400/30 transition-all duration-300 group">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <LogIn className="h-8 w-8 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Join as Member
                    </h3>
                    <p className="text-slate-400">
                      Connect with fellow Web3 enthusiasts, share insights,
                      and stay updated with the latest trends.
                    </p>
                    <Button
                      onClick={handleLogin}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  </div>
                </Card>
                <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 p-6 sm:p-8 hover:border-purple-400/30 transition-all duration-300 group">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Shield className="h-8 w-8 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Become Community Admin
                    </h3>
                    <p className="text-slate-400">
                      Lead your own community, moderate discussions, and help
                      shape the Web3 ecosystem.
                    </p>
                    <Button
                      onClick={handleAdminLogin}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Login as Community Admin
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Home Page
  return (
    <div className="w-full min-h-screen">
      <div className="space-y-4">
        {/* Live ChainCasts Banner */}
        <div className="px-4 pt-[29px]">
          <ChainCastJoinButton
            variant="card"
            showDetails={true}
            className="w-full"
          />
        </div>

        {/* Create Post */}
        <div className="px-4 py-2 border-b border-white/5">
          <CreatePost onPostCreated={handlePostCreated} />
        </div>

        {/* Posts Feed */}
        <div className="pb-6">
          <PostsFeed
            key={feedKey}
            type="feed"
            onPostClick={handlePostClick}
          />
        </div>
      </div>
    </div>
  );
}