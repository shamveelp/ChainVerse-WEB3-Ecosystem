"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, LogOut, User, Settings, Menu, Chrome as Home, Users, MessageSquare, HousePlug, Trophy, Crown, ChartBar as BarChart3, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCommunityAdminAuthActions } from "@/lib/communityAdminAuthActions";
import { cn } from "@/lib/utils";
import type { RootState } from "@/redux/store";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { COMMUNITY_ADMIN_ROUTES } from "@/routes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter, usePathname } from "next/navigation";

interface NavbarProps {
  className?: string;
}

const sidebarItems = [
  { title: "Dashboard", href: COMMUNITY_ADMIN_ROUTES.DASHBOARD, icon: Home },
  { title: "Community", href: COMMUNITY_ADMIN_ROUTES.COMMUNITY, icon: MessageSquare },
  { title: "Feed", href: COMMUNITY_ADMIN_ROUTES.FEED, icon: HousePlug },
  { title: "Profile", href: COMMUNITY_ADMIN_ROUTES.PROFILE, icon: User },
  { title: "Settings", href: COMMUNITY_ADMIN_ROUTES.SETTINGS, icon: Settings },
  { title: "Members", href: COMMUNITY_ADMIN_ROUTES.MEMBERS, icon: Users },
  { title: "ChainCast", href: COMMUNITY_ADMIN_ROUTES.CHAINCAST, icon: BarChart3, requiresPremium: true },
  { title: "Quests", href: COMMUNITY_ADMIN_ROUTES.QUESTS, icon: Trophy, requiresPremium: true },
  { title: "Premium", href: COMMUNITY_ADMIN_ROUTES.PREMIUM, icon: Crown },
];

export function Navbar({ className }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { logout } = useCommunityAdminAuthActions();
  const { communityAdmin, chainCastAccess, questAccess, subscription } = useSelector((state: RootState) => state.communityAdminAuth);
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Mobile Menu Trigger */}
        <div className="md:hidden mr-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-slate-950 border-r border-slate-800 p-0">
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white tracking-tight">ChainVerse</h2>
                <p className="text-xs text-slate-400 font-medium">Community Admin</p>
              </div>
              <ScrollArea className="h-[calc(100vh-5rem)]">
                <div className="p-4 space-y-2">
                  {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    const IconComponent = item.icon;
                    const isLocked = item.requiresPremium && (
                      (item.title === "ChainCast" && !chainCastAccess) ||
                      (item.title === "Quests" && !questAccess)
                    );

                    if (isLocked) {
                      return (
                        <Button
                          key={item.href}
                          variant="ghost"
                          className="w-full justify-start gap-3 h-10 opacity-50 cursor-not-allowed text-slate-400"
                          disabled
                        >
                          <div className="relative">
                            <IconComponent className="h-5 w-5 mr-2" />
                            <Lock className="h-3 w-3 absolute -top-1 -right-0.5 text-yellow-400" />
                          </div>
                          <span className="font-medium">{item.title}</span>
                        </Button>
                      )
                    }

                    return (
                      <Button
                        key={item.href}
                        onClick={() => {
                          router.push(item.href);
                          setIsOpen(false);
                        }}
                        variant={isActive ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 h-10",
                          isActive
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                        )}
                      >
                        <IconComponent className="h-5 w-5 mr-2" />
                        <span className="font-medium">{item.title}</span>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xs sm:max-w-sm md:max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-10 bg-slate-900/50 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 transition-all duration-300"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="relative text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:flex"
          >
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-xs">
              3
            </Badge>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-semibold">
                    {communityAdmin?.name ? getInitials(communityAdmin.name) : "CA"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-slate-700 text-slate-200" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-white">
                    {communityAdmin?.name || "Community Admin"}
                  </p>
                  <p className="text-xs text-slate-400">{communityAdmin?.email || "admin@example.com"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer focus:bg-slate-800 focus:text-white">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer focus:bg-slate-800 focus:text-white">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer focus:bg-red-500/10 focus:text-red-300"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}