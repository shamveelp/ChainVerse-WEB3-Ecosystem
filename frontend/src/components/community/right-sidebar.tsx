"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Loader2, Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { COMMUNITY_ADMIN_ROUTES, USER_ROUTES } from "@/routes";
import { communityExploreApiService, type Community } from "@/services/userCommunityServices/communityExploreApiService";
import { useCommunityExplore } from "@/hooks/useCommunityExplore";
import { toast } from "sonner";

export default function RightSidebar() {
  const [topCommunities, setTopCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { joinCommunity, leaveCommunity } = useCommunityExplore();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopCommunities = async () => {
      try {
        const response = await communityExploreApiService.getPopularCommunities(undefined, 3); // Increased to 3 for better fill
        setTopCommunities(response.communities);
      } catch (error) {
        console.error("Failed to fetch popular communities", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopCommunities();
  }, []);

  const handleJoinToggle = async (community: Community) => {
    if (actionLoading) return;

    setActionLoading(community._id);
    try {
      let success = false;
      if (community.isMember) {
        success = await leaveCommunity(community.username);
      } else {
        success = await joinCommunity(community.username);
      }

      if (success) {
        setTopCommunities((prev) =>
          prev.map((c) => {
            if (c._id === community._id) {
              const newIsMember = !c.isMember;
              const newCount = newIsMember ? c.memberCount + 1 : Math.max(0, c.memberCount - 1);
              return { ...c, isMember: newIsMember, memberCount: newCount };
            }
            return c;
          })
        );
      }
    } catch (error) {
      console.error("Failed to update membership", error);
      toast.error("Failed to update membership");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <aside className="hidden xl:flex fixed right-0 top-[4.5rem] w-80 h-[calc(100vh-4.5rem)] border-l border-white/5 bg-slate-950/50 backdrop-blur-xl z-30">
      <div className="h-full w-full overflow-y-auto no-scrollbar px-6 py-6 space-y-8">

        {/* Popular Communities Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white tracking-tight">
              Popular
            </h3>
            <Link href={USER_ROUTES.COMMUNITY_EXPLORE} className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              View all
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 text-slate-500 animate-spin" />
            </div>
          ) : topCommunities.length > 0 ? (
            <div className="space-y-4">
              {topCommunities.map((community) => (
                <motion.div
                  key={community._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="group"
                >
                  <div className="flex items-start gap-3">
                    <Link href={`${USER_ROUTES.COMMUNITY}/c/${community.username}`} className="shrink-0">
                      <Avatar className="w-10 h-10 ring-2 ring-transparent group-hover:ring-cyan-500/30 transition-all rounded-xl">
                        <AvatarImage src={community.logo} alt={community.communityName} />
                        <AvatarFallback className="bg-slate-800 text-slate-200 text-xs font-bold rounded-xl">
                          {community.communityName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <Link href={`${USER_ROUTES.COMMUNITY}/c/${community.username}`} className="block mb-1">
                        <p className="text-[15px] font-semibold text-slate-200 group-hover:text-white transition-colors truncate leading-none">
                          {community.communityName}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          {communityExploreApiService.formatMemberCount(community.memberCount)} members
                        </p>
                      </Link>
                    </div>
                  </div>

                  <div className="mt-3 pl-[3.25rem]">
                    <Button
                      size="sm"
                      className={`w-full text-xs h-8 rounded-lg font-medium transition-all duration-300 ${community.isMember
                        ? "bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-slate-400"
                        : "bg-slate-100 hover:bg-white text-slate-900 shadow-lg shadow-white/5"
                        }`}
                      variant={community.isMember ? "ghost" : "default"}
                      onClick={() => handleJoinToggle(community)}
                      disabled={actionLoading === community._id}
                    >
                      {actionLoading === community._id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : community.isMember ? (
                        "Joined"
                      ) : (
                        "Join Community"
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4 bg-white/5 rounded-xl">
              No communities found
            </p>
          )}
        </section>

        {/* Admin Promo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative rounded-2xl overflow-hidden group cursor-pointer border border-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 group-hover:opacity-100 opacity-50 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

            <div className="relative p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg shadow-lg shadow-violet-500/20">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg">Admin Access</h3>
              </div>

              <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                Unlock tools to manage, grow, and monetize your own Web3 community.
              </p>

              <Link href={COMMUNITY_ADMIN_ROUTES.GET_STARTED} className="block">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white border border-white/10 group-hover:border-violet-500/50 transition-all">
                  Get Started <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Footer Links */}
        <section className="pt-4 border-t border-white/5">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
            <Link href="#" className="hover:underline hover:text-slate-400">Terms of Service</Link>
            <Link href="#" className="hover:underline hover:text-slate-400">Privacy Policy</Link>
            <Link href="#" className="hover:underline hover:text-slate-400">Cookie Policy</Link>
            <span>© 2024 ChainVerse</span>
          </div>
        </section>
      </div>
    </aside>
  );
}
