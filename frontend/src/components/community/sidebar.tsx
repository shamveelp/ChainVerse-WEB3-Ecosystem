"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Chrome as Home, Search, Users, MessageCircle, User, Settings, LogOut, Menu, X, Bell, Bookmark } from 'lucide-react'
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navigationItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'explore', label: 'Explore', icon: Search },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'communities', label: 'My Communities', icon: Users },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  { id: 'profile', label: 'Profile', icon: User },
]

const userData = {
  name: 'Alex Chen',
  username: 'alexchen_dev',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
  verified: true,
  followers: '2.4K',
  following: '1.2K'
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    router.push('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          ChainVerse
        </h2>
      </div>

      {/* User Profile Card */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer">
          <Avatar className="w-12 h-12 ring-2 ring-cyan-400/30">
            <AvatarImage src={userData.avatar} alt={userData.name} />
            <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
              {userData.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-white truncate">{userData.name}</p>
              {userData.verified && (
                <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-slate-400 text-sm">@{userData.username}</p>
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-3 text-sm">
          <div className="text-center">
            <p className="font-semibold text-white">{userData.following}</p>
            <p className="text-slate-400">Following</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-white">{userData.followers}</p>
            <p className="text-slate-400">Followers</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const hasNotifications = item.id === 'notifications' || item.id === 'messages'
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left p-4 h-auto group transition-all duration-200 relative",
                activeTab === item.id
                  ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}
              onClick={() => {
                onTabChange(item.id)
                setIsMobileMenuOpen(false)
              }}
            >
              <div className="relative">
                <Icon className={cn(
                  "h-6 w-6 mr-4 transition-colors",
                  activeTab === item.id ? "text-cyan-400" : "group-hover:text-cyan-400"
                )} />
                {hasNotifications && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-lg font-medium">{item.label}</span>
            </Button>
          )
        })}
      </nav>

      {/* Tweet Button */}
      <div className="p-4 border-t border-slate-700/50">
        <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 rounded-full mb-4">
          Create Post
        </Button>
        
        {/* Settings & Logout */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800/50"
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings & Privacy
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-800/80 backdrop-blur-sm"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-80 bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative w-80 bg-slate-900/95 backdrop-blur-xl h-full">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}