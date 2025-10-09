"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const whoToFollow = [
  {
    name: "Ethereum Foundation",
    username: "ethereum",
    avatar:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100",
    verified: true,
  },
  {
    name: "OpenSea",
    username: "opensea",
    avatar:
      "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100",
    verified: true,
  },
];

export default function RightSidebar() {
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);

  const handleFollow = (username: string) => {
    setFollowedUsers((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  };

  return (
    <aside className="hidden xl:block fixed right-0 top-0 w-72 pt-20 border-l border-slate-700/50 bg-slate-950 h-screen z-30">
      <div className="h-full overflow-y-auto scrollbar-hidden">
        <div className="p-3 space-y-4">
          {/* Who to Follow */}
          <Card className="bg-slate-900/60 border-slate-700/40">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-yellow-400" />
                <h3 className="text-base font-semibold text-white">
                  Who to Follow
                </h3>
              </div>
              <div className="space-y-2">
                {whoToFollow.map((u) => (
                  <div
                    key={u.username}
                    className="flex items-center gap-2 hover:bg-slate-800/30 rounded-md p-2 cursor-pointer"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={u.avatar} alt={u.name} />
                      <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{u.name}</p>
                      <p className="text-xs text-slate-400">@{u.username}</p>
                    </div>
                    <Button
                      size="sm"
                      className="text-xs px-2 py-1"
                      variant={
                        followedUsers.includes(u.username)
                          ? "secondary"
                          : "outline"
                      }
                      onClick={() => handleFollow(u.username)}
                    >
                      {followedUsers.includes(u.username)
                        ? "Following"
                        : "Follow"}
                    </Button>
                  </div>
                ))}
              </div>
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
