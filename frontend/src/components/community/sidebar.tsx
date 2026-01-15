"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Chrome as Home, Search, Users, MessageCircle, User, Settings, LogOut, Bell, Shield, PenSquare, MoreHorizontal } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useCommunityProfile } from '@/hooks/useCommunityProfile'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/redux/store'
import { communityApiService } from '@/services/communityApiService'
import { logout } from '@/redux/slices/userAuthSlice'
import { COMMON_ROUTES, USER_ROUTES, COMMUNITY_ADMIN_ROUTES } from '@/routes'
import Link from 'next/link'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'

const navigationItems = [
  { id: 'home', label: 'Home', icon: Home, path: USER_ROUTES.COMMUNITY },
  { id: 'explore', label: 'Explore', icon: Search, path: USER_ROUTES.COMMUNITY_EXPLORE },
  { id: 'communities', label: 'Communities', icon: Users, path: USER_ROUTES.COMMUNITY_MY_COMMUNITIES },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: USER_ROUTES.COMMUNITY_NOTIFICATIONS },
  { id: 'messages', label: 'Messages', icon: MessageCircle, path: USER_ROUTES.COMMUNITY_MESSAGES },
  { id: 'profile', label: 'Profile', icon: User, path: '' }, // Profile path handled dynamically
]

export default function Sidebar() {
  const router = useRouter()
  const dispatch = useDispatch()
  const pathname = usePathname()
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false)

  // Get current user from auth state
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)
  const { profile, loading, error, fetchCommunityProfile, clearProfileData, retry } = useCommunityProfile()

  // Fetch profile on mount and when user changes
  useEffect(() => {
    if (currentUser && (!profile || profile.username !== currentUser.username)) {
      fetchCommunityProfile(true) // Force refresh
    }
  }, [currentUser?._id, currentUser?.username, fetchCommunityProfile])

  const handleLogout = () => {
    clearProfileData()
    dispatch(logout())
    router.push(COMMON_ROUTES.HOME)
  }

  const handleNavigation = (path: string) => {
    if (path) router.push(path)
  }

  const handleProfileClick = () => {
    if (currentUser?.username) {
      handleNavigation(`${USER_ROUTES.COMMUNITY}/${currentUser.username}`)
    }
  }

  const handleCreatePost = () => {
    router.push(`/user/community/compose/tweet`)
    setIsProfileSheetOpen(false)
  }

  // Scroll detection for mobile navbar using framer-motion
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const DesktopSidebarContent = () => (
    <div className="flex flex-col h-full px-4 xl:px-6 overflow-y-auto no-scrollbar">
      {/* Navigation */}
      <nav className="flex-1 py-6 space-y-2">
        {navigationItems.filter(item => item.id !== 'profile').map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path
          const hasNotifications = item.id === 'notifications' || item.id === 'messages'

          return (
            <Link key={item.id} href={item.path} className="block group">
              <div className={cn(
                "flex items-center gap-5 px-4 py-3.5 rounded-3xl transition-all duration-300 w-fit xl:w-full group-hover:scale-105",
                isActive ? "bg-white/10 text-white font-semibold backdrop-blur-md shadow-lg shadow-black/5" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}>
                <div className="relative">
                  <Icon className={cn(
                    "h-[26px] w-[26px] transition-colors",
                    isActive ? "text-white" : "text-current"
                  )} />
                  {hasNotifications && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-500 rounded-full border-2 border-slate-950" />
                  )}
                </div>
                <span className="hidden xl:block text-xl tracking-wide">
                  {item.label}
                </span>
              </div>
            </Link>
          )
        })}

        {/* Profile Link Desktop */}
        <div onClick={handleProfileClick} className="cursor-pointer group block">
          <div className={cn(
            "flex items-center gap-5 px-4 py-3.5 rounded-3xl transition-all duration-300 w-fit xl:w-full group-hover:scale-105",
            pathname === `${USER_ROUTES.COMMUNITY}/${currentUser?.username}` ? "bg-white/10 text-white font-semibold backdrop-blur-md" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          )}>
            <User className={cn(
              "h-[26px] w-[26px] transition-colors",
              pathname === `${USER_ROUTES.COMMUNITY}/${currentUser?.username}` ? "text-white" : "text-current"
            )} />
            <span className="hidden xl:block text-xl tracking-wide">
              Profile
            </span>
          </div>
        </div>

        {/* More/Settings - simplified for now */}
        <Link href={USER_ROUTES.COMMUNITY_SETTINGS} className="block group">
          <div className="flex items-center gap-5 px-4 py-3.5 rounded-3xl text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-300 w-fit xl:w-full group-hover:scale-105">
            <Settings className="h-[26px] w-[26px]" />
            <span className="hidden xl:block text-xl tracking-wide">Settings</span>
          </div>
        </Link>

        {/* Tweet Button via CSS for responsiveness */}
        <div className="mt-8 px-2 xl:w-full">
          <Button
            onClick={handleCreatePost}
            className="w-14 h-14 xl:w-full xl:h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white p-0 flex items-center justify-center shadow-lg shadow-cyan-900/20 transition-all hover:scale-105 hover:shadow-cyan-500/30"
          >
            <PenSquare className="h-6 w-6 xl:hidden" />
            <span className="hidden xl:block text-lg font-bold">Post</span>
          </Button>
        </div>
      </nav>

      {/* User Profile Bottom */}
      {currentUser && (
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3 p-3 rounded-full hover:bg-white/5 transition-all cursor-pointer w-full xl:justify-start justify-center group" onClick={handleProfileClick}>
            <Avatar className="w-11 h-11 ring-2 ring-transparent group-hover:ring-slate-700 transition-all">
              <AvatarImage src={profile?.profilePic || ''} />
              <AvatarFallback className="bg-slate-800 text-slate-200 font-bold">
                {currentUser.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden xl:block flex-1 min-w-0">
              <p className="font-bold text-white text-[15px] truncate leading-tight">{currentUser.name || currentUser.username}</p>
              <p className="text-slate-400 text-sm truncate">@{currentUser.username}</p>
            </div>
            <MoreHorizontal className="hidden xl:block h-5 w-5 text-slate-500 group-hover:text-slate-300" />
          </div>
        </div>
      )}
    </div>
  )

  const MobileBottomNav = () => (
    <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
      <motion.div
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: "150%", opacity: 0 },
        }}
        initial="visible"
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="pointer-events-auto w-full max-w-md bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl shadow-purple-900/20 px-2 h-20 flex items-center justify-around overflow-hidden"
      >
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path

          if (item.id === 'profile') {
            return (
              <Sheet key={item.id} open={isProfileSheetOpen} onOpenChange={setIsProfileSheetOpen}>
                <SheetTrigger asChild>
                  <div className="relative flex flex-col items-center justify-center cursor-pointer group w-14 h-14">
                    <div className={cn(
                      "relative z-10 p-3 transition-colors duration-300",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 rounded-t-[2.5rem] pb-10">
                  <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-8 mt-2" />
                  <div className="flex flex-col gap-2 px-2">
                    <Button variant="ghost" className="justify-start gap-4 text-lg h-16 rounded-2xl hover:bg-white/5 transition-all active:scale-95" onClick={() => {
                      handleProfileClick();
                      setIsProfileSheetOpen(false);
                    }}>
                      <User className="h-6 w-6" /> Profile
                    </Button>
                    <Button variant="ghost" className="justify-start gap-4 text-lg h-16 rounded-2xl hover:bg-white/5 transition-all active:scale-95" onClick={() => {
                      handleNavigation(USER_ROUTES.COMMUNITY_SETTINGS);
                      setIsProfileSheetOpen(false);
                    }}>
                      <Settings className="h-6 w-6" /> Settings
                    </Button>
                    <Button variant="ghost" className="justify-start gap-4 text-lg h-16 rounded-2xl hover:bg-white/5 transition-all active:scale-95" onClick={handleCreatePost}>
                      <PenSquare className="h-6 w-6" /> Create Post
                    </Button>
                    <Button variant="ghost" className="justify-start gap-4 text-lg h-16 rounded-2xl hover:bg-white/5 text-purple-400 hover:text-purple-300 transition-all active:scale-95" onClick={() => {
                      handleNavigation(COMMUNITY_ADMIN_ROUTES.GET_STARTED);
                      setIsProfileSheetOpen(false);
                    }}>
                      <Shield className="h-6 w-6" /> Be a Community Admin
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            )
          }

          return (
            <Link key={item.id} href={item.path} className="w-14 flex justify-center">
              <div className="relative flex flex-col items-center justify-center group w-14 h-14">
                <div className={cn(
                  "relative z-10 p-3 transition-colors duration-300",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                )}>
                  <Icon className="h-6 w-6" />
                  {(item.id === 'notifications' || item.id === 'messages') && (
                    <div className="absolute top-2 right-2.5 w-2 h-2 bg-cyan-500 rounded-full border-2 border-slate-900" />
                  )}
                </div>

                {isActive && (
                  <motion.div
                    layoutId="community-bubble"
                    className="absolute inset-0 bg-white/10 rounded-2xl -z-0 shadow-inner"
                    transition={{
                      type: 'spring',
                      bounce: 0.2,
                      duration: 0.6,
                    }}
                  />
                )}
              </div>
            </Link>
          )
        })}
      </motion.div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed left-0 top-[4.5rem] h-[calc(100vh-4.5rem)] w-[88px] xl:w-[275px] border-r border-white/5 bg-slate-950/50 backdrop-blur-xl z-40">
        <DesktopSidebarContent />
      </aside>

      <div className="lg:hidden">
        <MobileBottomNav />
      </div>
    </>
  )
}