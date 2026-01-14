"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp, Menu, User, LogOut, Bell, Wallet, CircleDollarSign } from "lucide-react"
import { ConnectButton } from "thirdweb/react"
import { client } from "@/lib/thirdweb-client"
import { supportedChains } from "@/lib/thirdweb-config"

// Helper component for mobile collapsible menu
function CollapsibleMenu({ title, onItemClick }: { title: string; onItemClick: () => void }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between text-2xl font-medium text-gray-300 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-all w-full text-left"
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Animated Height Container */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
          }`}
      >
        <div className="flex flex-col space-y-2 pl-4 border-l-2 border-white/10 ml-4">
          <Link
            href={COMMON_ROUTES.SWAP}
            className="block text-gray-400 hover:text-white text-lg py-2 pl-4 rounded-lg hover:bg-white/5 transition-colors"
            onClick={onItemClick}
          >
            Swap
          </Link>
          <Link
            href={COMMON_ROUTES.LIQUIDITY}
            className="block text-gray-400 hover:text-white text-lg py-2 pl-4 rounded-lg hover:bg-white/5 transition-colors"
            onClick={onItemClick}
          >
            Liquidity
          </Link>
          <Link
            href={COMMON_ROUTES.BRIDGE}
            className="block text-gray-400 hover:text-white text-lg py-2 pl-4 rounded-lg hover:bg-white/5 transition-colors"
            onClick={onItemClick}
          >
            Bridge
          </Link>
          <Link
            href={COMMON_ROUTES.BUY}
            className="block text-gray-400 hover:text-white text-lg py-2 pl-4 rounded-lg hover:bg-white/5 transition-colors"
            onClick={onItemClick}
          >
            Buy
          </Link>
        </div>
      </div>
    </div>
  )
}
import ShinyText from "@/components/ui/shiny-text"
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navLinksRef = useRef<HTMLDivElement>(null)

  // Measure nav height to determine if we should collapse
  useEffect(() => {
    const checkOverflow = () => {
      if (navLinksRef.current) {
        // If height > 80px (approx 2 lines), Force collapse
        setIsCollapsed(navLinksRef.current.offsetHeight > 80)
      }
    }

    // Initial check
    checkOverflow()

    // Add resize listener
    window.addEventListener("resize", checkOverflow)
    return () => window.removeEventListener("resize", checkOverflow)
  }, [])
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
          <div className="flex flex-wrap lg:flex-nowrap justify-between items-center min-h-[56px] gap-2">
            {/* Logo */}
            <div className="flex-shrink-0 ml-2">
              <Link
                href={COMMON_ROUTES.HOME}
                className="text-2xl font-bold transition-all hover:tracking-wide"
              >
                <ShinyText
                  text="ChainVerse"
                  speed={3}
                  yoyo={true}
                  color="#b5b5b5"
                  shineColor="#ffffff"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className={`hidden lg:block flex-1 mx-4 ${isCollapsed ? "!hidden" : ""}`}>
              <div ref={navLinksRef} className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 lg:gap-x-1">
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
                  className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap"
                >
                  About Us
                </Link>
              </div>
            </div>

            {/* Desktop Right Side Icons & Auth Buttons / User Menu */}
            <div className="hidden lg:flex items-center space-x-2 mr-2">
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
                    <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-6 transition-colors font-medium">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className={`${isCollapsed ? "flex" : "lg:hidden flex"} items-center mr-2`}>
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white h-12 w-12">
                    <Menu className="h-8 w-8" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full h-full border-none bg-black/90 backdrop-blur-3xl p-0 sm:max-w-full">
                  <div className="flex flex-col h-full bg-gradient-to-b from-indigo-950/20 to-black/80 p-6 overflow-y-auto">
                    {/* Mobile Header with Logo */}
                    <div className="flex items-center justify-between mb-8">
                      <Link
                        href={COMMON_ROUTES.HOME}
                        className="text-2xl font-bold transition-all hover:tracking-wide"
                        onClick={() => setIsOpen(false)}
                      >
                        <ShinyText
                          text="ChainVerse"
                          speed={3}
                          yoyo={true}
                          color="#b5b5b5"
                          shineColor="#ffffff"
                        />
                      </Link>
                      {/* Close button is handled by Sheet primitive */}
                    </div>

                    <div className="flex flex-col space-y-2 flex-1">
                      <Link
                        href={COMMON_ROUTES.MARKET}
                        className="text-2xl font-medium text-gray-300 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-all"
                        onClick={() => setIsOpen(false)}
                      >
                        Market
                      </Link>

                      {/* Collapsible Trade Section */}
                      <CollapsibleMenu
                        title="Trade"
                        onItemClick={() => setIsOpen(false)}
                      />

                      <Link
                        href={USER_ROUTES.NFT_MARKET}
                        className="text-2xl font-medium text-gray-300 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-all"
                        onClick={() => setIsOpen(false)}
                      >
                        NFTs
                      </Link>
                      <Link
                        href={USER_ROUTES.COMMUNITY}
                        className="text-2xl font-medium text-gray-300 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-all"
                        onClick={() => setIsOpen(false)}
                      >
                        Community
                      </Link>
                      <Link
                        href={USER_ROUTES.QUESTS}
                        className="text-2xl font-medium text-gray-300 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-all"
                        onClick={() => setIsOpen(false)}
                      >
                        Quests
                      </Link>
                      <Link
                        href={COMMON_ROUTES.ABOUT}
                        className="text-2xl font-medium text-gray-300 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-all"
                        onClick={() => setIsOpen(false)}
                      >
                        About Us
                      </Link>
                    </div>

                    {/* Mobile Auth Section */}
                    <div className="pt-8 border-t border-white/10 space-y-4 mt-auto">
                      <div className="flex justify-center mb-4">
                        <ConnectButton
                          client={client}
                          chains={supportedChains}
                          theme={"dark"}
                          connectButton={{
                            label: "Connect Wallet",
                          }}
                        />
                      </div>
                      {user ? (
                        <>
                          <div className="flex items-center space-x-4 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                            <Avatar className="w-12 h-12 border-2 border-blue-500/30">
                              <AvatarImage src={avatarUrl} alt={user.username} />
                              <AvatarFallback className="bg-blue-600 text-white text-lg font-bold">
                                {user.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-white font-semibold text-lg">{user.name || user.username}</span>
                              <span className="text-gray-400 text-sm">@{user.username}</span>
                            </div>
                          </div>
                          <Link href={USER_ROUTES.PROFILE} onClick={() => setIsOpen(false)}>
                            <Button
                              variant="ghost"
                              className="w-full text-white bg-white/10 hover:bg-white/20 justify-start h-14 text-lg rounded-xl mb-3"
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
                            className="w-full text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 justify-start h-14 text-lg rounded-xl"
                          >
                            <LogOut className="mr-3 h-5 w-5" />
                            Logout
                          </Button>
                        </>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <Link href={USER_ROUTES.LOGIN} onClick={() => setIsOpen(false)}>
                            <Button
                              variant="outline"
                              className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent h-14 text-lg rounded-xl"
                            >
                              Login
                            </Button>
                          </Link>
                          <Link href={USER_ROUTES.REGISTER} onClick={() => setIsOpen(false)}>
                            <Button className="w-full bg-white text-black hover:bg-gray-200 h-14 text-lg rounded-xl transition-colors font-medium border-none">
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
      </div >
    </TooltipProvider >
  )
}
