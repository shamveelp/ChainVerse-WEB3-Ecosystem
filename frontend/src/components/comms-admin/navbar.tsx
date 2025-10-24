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
import { Bell, Search, LogOut, User, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCommunityAdminAuthActions } from "@/lib/communityAdminAuthActions";
import { cn } from "@/lib/utils";
import type { RootState } from "@/redux/store";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { logout } = useCommunityAdminAuthActions();
  const { communityAdmin } = useSelector((state: RootState) => state.communityAdminAuth);

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
        "sticky top-0 z-50 w-full bg-gray-800/80 backdrop-blur-xl border-b border-blue-500/30",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xs sm:max-w-sm md:max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members, posts, quests..."
              className="pl-10 bg-gray-700/50 border-blue-500/30 text-white placeholder:text-gray-400 focus:border-blue-600 focus:ring-blue-600/20"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="relative text-gray-400 hover:text-white hover:bg-blue-600/30"
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
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold">
                    {communityAdmin?.name ? getInitials(communityAdmin.name) : "CA"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-800 border-blue-500/30" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-white">
                    {communityAdmin?.name || "Community Admin"}
                  </p>
                  <p className="text-xs text-gray-400">{communityAdmin?.email || "admin@example.com"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-blue-500/30" />
              <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-blue-600/30 cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-blue-600/30 cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-blue-500/30" />
              <DropdownMenuItem
                className="text-red-400 hover:text-red-300 hover:bg-red-600/30 cursor-pointer"
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