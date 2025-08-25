"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSelector, useDispatch } from "react-redux"
import { BarChart3, Calendar, Home, Package, Settings, ShoppingCart, Users, FileText, ChevronUp, LogOut, User, Coins, TrendingUp, Shield, Wallet, Activity, Database, Zap, ChartBar } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { logout } from '@/redux/slices/adminAuthSlice'
import type { RootState } from "@/redux/store"

// Web3 themed menu items
const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: Home,
    isActive: true,
  },
  {
    title: "Users",
    url: "/admin/user-management",
    icon: Users,
    // badge: "2.8K",
  },
  {
    title: "Market",
    url: "/admin/market-management",
    icon: ChartBar,
    // badge: "2.8K",
  },
  {
    title: "Community Requests",
    url: "/admin/community-requests",
    icon: Database,
    // badge: "1.2K",
  },
  {
    title: "Wallets",
    url: "/admin/wallet-management",
    icon: Wallet,
    badge: "1.2K",
  },
  {
    title: "Coins",
    url: "/admin/coins",
    icon: Coins,
    // badge: "1.2K",
  },
  {
    title: "NFTs",
    url: "/admin/coins",
    icon: FileText,
    // badge: "1.2K",
  },
  {
    title: "Quests",
    url: "/admin/coins",
    icon: Calendar,
    // badge: "1.2K",
  },
]

export function AppSidebar() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { admin } = useSelector((state: RootState) => state.adminAuth)

  const handleLogout = () => {
    dispatch(logout())
    router.push("/admin/login")
  }

  return (
    <Sidebar collapsible="icon" className="bg-slate-950/95 backdrop-blur-xl border-slate-800/50">
      <SidebarHeader className="border-b border-slate-800/50">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-400 to-purple-600 relative">
            <div className="h-4 w-4 bg-slate-900 rounded-sm" />
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse" />
          </div>
          <div className="font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent">
            ChainVerse
          </div>
        </div>
      </SidebarHeader>
            
      <SidebarContent className="bg-slate-950/50">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 text-xs font-medium tracking-wider">
            WEB3 NAVIGATION
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    tooltip={item.title}
                    className=" text-white hover:bg-slate-800/50 hover:text-cyan-400 data-[active=true]:bg-gradient-to-r data-[active=true]:from-cyan-500/20 data-[active=true]:to-purple-500/20 data-[active=true]:text-cyan-400 data-[active=true]:border-r-2 data-[active=true]:border-cyan-400"
                  >
                    <Link href={item.url} className="flex items-center gap-3 w-full">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto bg-slate-800 text-cyan-400 border-slate-700">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
            
      <SidebarFooter className="border-t border-slate-800/50 bg-slate-950/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-slate-800/50 data-[state=open]:text-cyan-400 hover:bg-slate-800/50 hover:text-cyan-400"
                >
                  <Avatar className="h-8 w-8 rounded-lg border-2 border-slate-700">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Admin" />
                    <AvatarFallback className="rounded-lg bg-gradient-to-r from-cyan-400 to-purple-600 text-slate-900 font-bold">
                      {admin?.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-slate-200">
                      {admin?.name || 'Admin User'}
                    </span>
                    <span className="truncate text-xs text-slate-400">
                      {admin?.email || 'admin@chainverse.com'}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-slate-900/95 backdrop-blur-xl border-slate-700/50"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem className="hover:bg-slate-800/50 hover:text-cyan-400">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700/50" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="hover:bg-red-900/20 hover:text-red-400 text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
