"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
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
        const response = await communityExploreApiService.getPopularCommunities(undefined, 2);
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
    <aside className="hidden xl:block fixed right-0 top-0 w-72 pt-20 border-l border-slate-700/50 bg-slate-950 h-screen z-30">
      <div className="h-full overflow-y-auto scrollbar-hidden">
        <div className="p-3 space-y-4">
          {/* Popular Communities */}
          <Card className="bg-slate-900/60 border-slate-700/40">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-violet-400" />
                <h3 className="text-base font-semibold text-white">
                  Popular Communities
                </h3>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
                </div>
              ) : topCommunities.length > 0 ? (
                <div className="space-y-2">
                  {topCommunities.map((community) => (
                    <div
                      key={community._id}
                      className="flex items-center gap-2 hover:bg-slate-800/30 rounded-md p-2 transition-colors"
                    >
                      <Link href={`/user/community/c/${community.username}`} className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="w-8 h-8 border border-slate-700">
                          <AvatarImage src={community.logo} alt={community.communityName} />
                          <AvatarFallback className="bg-slate-800 text-slate-200 text-xs">
                            {community.communityName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate font-medium">
                            {community.communityName}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {communityExploreApiService.formatMemberCount(community.memberCount)} members
                          </p>
                        </div>
                      </Link>
                      <Button
                        size="sm"
                        className={`text-xs px-3 h-7 ${community.isMember
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                          : "bg-violet-600 hover:bg-violet-700 text-white"
                          }`}
                        variant={community.isMember ? "outline" : "default"}
                        onClick={() => handleJoinToggle(community)}
                        disabled={actionLoading === community._id}
                      >
                        {actionLoading === community._id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : community.isMember ? (
                          "Leave"
                        ) : (
                          "Join"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-2">
                  No communities found
                </p>
              )}
            </div>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative max-w-md mx-auto p-[2px] rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 shadow-xl hover:shadow-pink-400/50 transition-shadow duration-500"
          >
            <div className="relative rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 flex flex-col items-center text-center z-10">
              <h2 className="text-2xl font-bold text-white mb-3">
                Become a Community Admin
              </h2>
              <p className="text-gray-400 mb-6">
                Lead your own community, manage members, and build an engaging
                space for everyone.
              </p>

              <Link href="/comms-admin/get-started" passHref>
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 25px rgba(236, 72, 153, 0.5)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="px-6 py-3 text-lg font-semibold rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white shadow-md hover:shadow-fuchsia-500/50 transition-all duration-300"
                >
                  Be a Community Admin
                </motion.button>
              </Link>
            </div>

            {/* Glow border effect */}
            <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-br from-violet-500 via-pink-500 to-red-500 blur opacity-30 animate-pulse"></div>
          </motion.div>
        </div>
      </div>
    </aside>
  );
}
