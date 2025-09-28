"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Chrome as Home, Search, Users, MessageCircle, User, Settings, LogOut, Menu, X, Bell, Bookmark, Loader2, AlertCircle } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useCommunityProfile } from '@/hooks/useCommunityProfile'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { communityApiService } from '@/services/communityApiService'

const navigationItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/user/community' },
  { id: 'explore', label: 'Explore', icon: Search, path: '/user/community/explore' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/user/community/notifications' },
  { id: 'communities', label: 'My Communities', icon: Users, path: '/user/community/communities' },
  { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/user/community/messages' },
  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, path: '/user/community/bookmarks' },
  { id: 'profile', label: 'Profile', icon: User, path: '/user/community/profile' },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Fetch profile data
  const storeState = useSelector((state: RootState) => state)
  const { profile, loading, error, fetchCommunityProfile, clearError, retry } = useCommunityProfile()

  // Fetch profile on mount
  useEffect(() => {
    if (!profile && !loading) {
      console.log('Fetching own community profile...')
      fetchCommunityProfile()
    }
  }, [profile, loading, fetchCommunityProfile])

  const handleLogout = () => {
    router.push('/')
    setIsMobileMenuOpen(false)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    setIsMobileMenuOpen(false)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Loading State */}
      {loading && (
        <div className="p-3 border-b border-slate-700/50 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto" />
          <p className="text-slate-400 text-sm mt-2">Loading profile...</p>
        </div>
      )}

      {/* Error State */}
      {error && !profile && (
        <div className="p-3 border-b border-slate-700/50">
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300 text-sm">{error}</AlertDescription>
          </Alert>
          <Button
            onClick={retry}
            variant="outline"
            className="w-full mt-2 border-slate-600 hover:bg-slate-800 text-sm"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* User Profile Card */}
      {profile && !loading && !error && (
        <div className="p-3 border-b border-slate-700/50">
          <div
            className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer"
            onClick={() => handleNavigation('/user/community/profile')}
          >
            <Avatar className="w-10 h-10 ring-2 ring-cyan-400/30">
              <AvatarImage src={profile.profilePic || ''} alt={profile.name} />
              <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
                {profile.name?.charAt(0)?.toUpperCase() || profile.username?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-semibold text-sm text-white truncate">{profile.name}</p>
                {profile.isVerified && (
                  <div className="w-3.5 h-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-slate-400 text-xs">@{profile.username}</p>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <div className="text-center">
              <p className="font-semibold text-white">
                {communityApiService.formatStats(profile.followingCount)}
              </p>
              <p className="text-slate-400">Following</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-white">
                {communityApiService.formatStats(profile.followersCount)}
              </p>
              <p className="text-slate-400">Followers</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path
          const hasNotifications = item.id === 'notifications' || item.id === 'messages'

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left p-3 h-auto group transition-all duration-200 relative",
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}
              onClick={() => handleNavigation(item.path)}
            >
              <div className="relative">
                <Icon className={cn(
                  "h-5 w-5 mr-3 transition-colors",
                  isActive ? "text-cyan-400" : "group-hover:text-cyan-400"
                )} />
                {hasNotifications && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-base font-medium">{item.label}</span>
            </Button>
          )
        })}
      </nav>

      {/* Create Post & Settings */}
      <div className="p-3 border-t border-slate-700/50">
        <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-2 rounded-full mb-3 text-sm">
          Create Post
        </Button>

        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm"
            onClick={() => handleNavigation('/user/community/settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings & Privacy
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
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
        className="lg:hidden fixed top-3 left-3 z-50 bg-slate-800/80 backdrop-blur-sm"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 w-72 pt-20 bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 h-screen z-40 overflow-y-auto scrollbar-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative w-72 pt-20 bg-slate-900/95 backdrop-blur-xl h-full overflow-y-auto scrollbar-hidden">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}