"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, Menu, User, LogOut, Bell, Wallet, CircleDollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// Redux imports
import { useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { useAuthActions } from "@/lib/auth-actions"
import { useToast } from "@/hooks/use-toast"
import { COMMON_ROUTES, USER_ROUTES } from "@/routes"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  // Using Redux state for user and loading
  const { user, loading } = useSelector((state: RootState) => state.userAuth)
  const { logout } = useAuthActions()
  const { toast } = useToast()

  const avatarUrl = user
    ? user.profileImage ||
    user.profilePicture ||
    user.profilePic ||
    `https://api.dicebear.com/9.x/adventurer/svg?seed=${user.username}`
    : ""

  const handleLogout = async () => {
    await logout()
  }

  return (
    <TooltipProvider>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 pointer-events-none">
        <nav className="pointer-events-auto w-full max-w-7xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl px-2 sm:px-6 py-2">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <div className="flex-shrink-0 ml-2">
              <Link
                href={COMMON_ROUTES.HOME}
                className="text-2xl font-bold bg-gradient-to-r from-indigo-300 via-purple-400 to-pink-400 bg-clip-text text-transparent hover:brightness-125 transition-all"
              >
                ChainVerse
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="flex items-baseline space-x-2">
                <Link
                  href={COMMON_ROUTES.MARKET}
                  className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300"
                >
                  Market
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 flex items-center gap-1 focus:outline-none">
                    Trade <ChevronDown className="h-4 w-4 opacity-70" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-black/80 backdrop-blur-xl border-white/10 text-gray-300 rounded-xl mt-2 w-40 p-1">
                    <DropdownMenuItem className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">
                      <Link href={COMMON_ROUTES.SWAP} className="w-full">Swap</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">
                      <Link href={COMMON_ROUTES.LIQUIDITY} className="w-full">Liquidity</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">
                      <Link href={COMMON_ROUTES.BRIDGE} className="w-full">Bridge</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">
                      <Link href={COMMON_ROUTES.BUY} className="w-full">Buy</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link
                  href={USER_ROUTES.COMMUNITY}
                  className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300"
                >
                  Community
                </Link>
                <Link
                  href={USER_ROUTES.NFT_MARKET}
                  className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300"
                >
                  NFTs
                </Link>
                <Link
                  href={USER_ROUTES.QUESTS}
                  className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300"
                >
                  Quests
                </Link>
                <Link
                  href={COMMON_ROUTES.ABOUT}
                  className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300"
                >
                  About Us
                </Link>
              </div>
            </div>

            {/* Desktop Right Side Icons & Auth Buttons / User Menu */}
            <div className="hidden md:flex items-center space-x-2 mr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={USER_ROUTES.PROFILE_POINTS}>
                    <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full w-10 h-10">
                      <CircleDollarSign className="h-5 w-5" />
                      <span className="sr-only">Daily Check-in</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-black/80 border-white/10 text-white rounded-lg">Daily Check-in</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={USER_ROUTES.NOTIFICATIONS}>
                    <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full w-10 h-10">
                      <Bell className="h-5 w-5" />
                      <span className="sr-only">Notifications</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-black/80 border-white/10 text-white rounded-lg">Notifications</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full w-10 h-10">
                    <Wallet className="h-5 w-5" />
                    <span className="sr-only">Connect Wallet</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-black/80 border-white/10 text-white rounded-lg">Connect Wallet</TooltipContent>
              </Tooltip>

              {loading ? (
                <div className="w-9 h-9 bg-white/10 rounded-full animate-pulse ml-2"></div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center space-x-2 text-gray-300 hover:text-white ml-2 focus:outline-none group">
                    <Avatar className="w-9 h-9 border-2 border-transparent group-hover:border-blue-500 transition-all">
                      <AvatarImage src={avatarUrl} alt={user.username} />
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-black/80 backdrop-blur-xl border-white/10 text-gray-300 rounded-xl w-56 p-2 mt-2 mr-4">
                    <div className="px-2 py-1.5 text-sm font-semibold text-white truncate">
                      @{user.username}
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">
                      <Link href={USER_ROUTES.PROFILE} className="flex items-center w-full">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      className="text-red-400 focus:text-red-300 focus:bg-red-500/10 rounded-lg cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="ml-4 flex items-center space-x-3">
                  <Link href={USER_ROUTES.LOGIN}>
                    <Button
                      variant="ghost"
                      className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href={USER_ROUTES.REGISTER}>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full px-6 shadow-lg shadow-blue-500/20">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center mr-2">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-black/95 backdrop-blur-xl border-white/10 w-[300px] sm:w-[350px]">
                  <div className="flex flex-col space-y-6 mt-8">
                    <Link
                      href={USER_ROUTES.MARKET}
                      className="text-xl font-medium text-gray-300 hover:text-white transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Market
                    </Link>
                    <div className="space-y-4">
                      <div className="text-xl font-medium text-gray-300">Trade</div>
                      <div className="pl-4 space-y-3 border-l border-white/10 bg-white/5 py-4 rounded-r-xl">
                        <Link
                          href={USER_ROUTES.SWAP}
                          className="block text-gray-400 hover:text-white text-lg transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          Swap
                        </Link>
                        <Link href={USER_ROUTES.BRIDGE} className="block text-gray-400 hover:text-white text-lg transition-colors" onClick={() => setIsOpen(false)}>
                          Bridge
                        </Link>
                        <Link href={USER_ROUTES.BUY} className="block text-gray-400 hover:text-white text-lg transition-colors" onClick={() => setIsOpen(false)}>
                          Buy
                        </Link>
                        <Link href={USER_ROUTES.SELL} className="block text-gray-400 hover:text-white text-lg transition-colors" onClick={() => setIsOpen(false)}>
                          Sell
                        </Link>
                      </div>
                    </div>
                    <Link href={USER_ROUTES.NFT_MARKET} className="text-xl font-medium text-gray-300 hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
                      NFTs
                    </Link>
                    <Link
                      href={USER_ROUTES.COMMUNITY}
                      className="text-xl font-medium text-gray-300 hover:text-white transition-colors" onClick={() => setIsOpen(false)}
                    >
                      Community
                    </Link>
                    <Link href={USER_ROUTES.QUESTS} className="text-xl font-medium text-gray-300 hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
                      Quests
                    </Link>
                    <Link href={COMMON_ROUTES.ABOUT} className="text-xl font-medium text-gray-300 hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
                      About Us
                    </Link>

                    {/* Mobile Auth Section */}
                    <div className="pt-6 border-t border-white/10 space-y-3">
                      {user ? (
                        <>
                          <div className="flex items-center space-x-3 mb-4 bg-white/5 p-3 rounded-xl">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={avatarUrl} alt={user.username} />
                              <AvatarFallback className="bg-blue-600 text-white">
                                {user.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-white font-medium text-lg px-2">{user.username}</span>
                          </div>
                          <Link href={USER_ROUTES.PROFILE} onClick={() => setIsOpen(false)}>
                            <Button
                              variant="ghost"
                              className="w-full text-gray-300 hover:text-white hover:bg-white/10 justify-start h-12 text-lg"
                            >
                              <User className="mr-3 h-5 w-5" />
                              Profile
                            </Button>
                          </Link>
                          <Button
                            onClick={() => {
                              handleLogout()
                              setIsOpen(false)
                            }}
                            variant="ghost"
                            className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-start h-12 text-lg"
                          >
                            <LogOut className="mr-3 h-5 w-5" />
                            Logout
                          </Button>
                        </>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <Link href={USER_ROUTES.LOGIN} onClick={() => setIsOpen(false)}>
                            <Button
                              variant="outline"
                              className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent h-12"
                            >
                              Login
                            </Button>
                          </Link>
                          <Link href={USER_ROUTES.REGISTER} onClick={() => setIsOpen(false)}>
                            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12">
                              Register
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </div>
    </TooltipProvider>
  )
}
