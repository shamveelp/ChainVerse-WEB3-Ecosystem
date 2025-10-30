"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Chrome as Home, Users, User, Settings, Crown, ChevronLeft, ChevronRight, ChartBar as BarChart3, Zap, MessageSquare, Trophy, HousePlug, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMMUNITY_ADMIN_ROUTES } from "@/routes";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const sidebarItems = [
  { title: "Dashboard", href: COMMUNITY_ADMIN_ROUTES.DASHBOARD, icon: Home },
  { title: "Community", href: COMMUNITY_ADMIN_ROUTES.COMMUNITY, icon: MessageSquare },
  { title: "Feed", href: COMMUNITY_ADMIN_ROUTES.FEED, icon: HousePlug },
  { title: "Profile", href: COMMUNITY_ADMIN_ROUTES.PROFILE, icon: User },
  { title: "Members", href: COMMUNITY_ADMIN_ROUTES.MEMBERS, icon: Users },
  { title: "ChainCast", href: COMMUNITY_ADMIN_ROUTES.CHAINCAST, icon: BarChart3, requiresPremium: true },
  { title: "Quests", href: COMMUNITY_ADMIN_ROUTES.QUESTS, icon: Trophy },
  { title: "Premium", href: COMMUNITY_ADMIN_ROUTES.PREMIUM, icon: Crown },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { chainCastAccess, subscription } = useSelector((state: RootState) => state.communityAdminAuth);

  return (
    <TooltipProvider>
      <div
        className={cn(
          "relative flex flex-col h-full bg-gray-800 backdrop-blur-xl border-r border-blue-500/50 shadow-lg shadow-blue-500/20 z-20 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64 sm:w-72",
          className
        )}
      >
        {/* Collapse Toggle */}
        <Button
          onClick={() => setIsCollapsed(!isCollapsed)}
          variant="ghost"
          size="sm"
          className="absolute -right-3 top-6 z-50 h-8 w-8 rounded-full bg-gray-800 border border-blue-500/50 text-blue-400 hover:text-blue-300 hover:bg-blue-600/30"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        {/* Logo */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-white">ChainVerse</h2>
                <p className="text-xs text-blue-400">Community Admin</p>
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-blue-500/50" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              const IconComponent = item.icon;
              const isLocked = item.requiresPremium && !chainCastAccess;

              if (isLocked) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-10 opacity-50 cursor-not-allowed",
                          isCollapsed && "px-2 justify-center"
                        )}
                        disabled
                      >
                        <div className="relative">
                          <IconComponent className={cn("h-5 w-5", isCollapsed ? "mx-0" : "mr-2")} />
                          <Lock className="h-3 w-3 absolute -top-1 -right-1 text-yellow-400" />
                        </div>
                        {!isCollapsed && <span className="font-medium">{item.title}</span>}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side={isCollapsed ? "right" : "top"}
                      className="bg-gray-900 text-white border border-blue-500/50"
                    >
                      <div className="text-center">
                        <p className="font-medium">Premium Feature</p>
                        <p className="text-sm text-gray-300">Subscribe to unlock {item.title}</p>
                        {subscription?.status === 'failed' || subscription?.status === 'pending' ? (
                          <p className="text-xs text-yellow-400 mt-1">Complete your pending payment</p>
                        ) : (
                          <p className="text-xs text-blue-400 mt-1">Click Premium to upgrade</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-blue-600/30",
                    isCollapsed && "px-2 justify-center"
                  )}
                >
                  <IconComponent className={cn("h-5 w-5", isCollapsed ? "mx-0" : "mr-2")} />
                  {!isCollapsed && <span className="font-medium">{item.title}</span>}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}