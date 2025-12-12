"use client"

import { useState } from "react"
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
import { ThemeToggle } from "./theme-toggle"

// Redux imports (placeholders - you need to implement your Redux store and auth actions)
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
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
  }

  return (
    <TooltipProvider>
      <nav className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link
                href={COMMON_ROUTES.HOME}
                className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
              >
                ChainVerse
              </Link>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link
                  href={COMMON_ROUTES.MARKET}
                  className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  Market
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1">
                    Trade <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-popover border-border">
                    <DropdownMenuItem className="text-foreground hover:text-primary hover:bg-accent">
                      <Link href={COMMON_ROUTES.SWAP}>Swap</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-foreground hover:text-primary hover:bg-accent">
                      <Link href={COMMON_ROUTES.LIQUIDITY}>Liquidity</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-foreground hover:text-primary hover:bg-accent">
                      <Link href={COMMON_ROUTES.BRIDGE}>Bridge</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-foreground hover:text-primary hover:bg-accent">
                      <Link href={COMMON_ROUTES.BUY}>Buy</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link
                  href={USER_ROUTES.COMMUNITY}
                  className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  Community
                </Link>
                <Link
                  href={USER_ROUTES.NFT_MARKET}
                  className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  NFTs
                </Link>
                <Link
                  href={USER_ROUTES.QUESTS}
                  className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  Quests
                </Link>
                <Link
                  href={COMMON_ROUTES.ABOUT}
                  className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  About Us
                </Link>
              </div>
            </div>
            {/* Desktop Right Side Icons & Auth Buttons / User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={USER_ROUTES.PROFILE_POINTS}>
                    <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                      <CircleDollarSign className="h-5 w-5" />
                      <span className="sr-only">Daily Check-in</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Daily Check-in</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={USER_ROUTES.NOTIFICATIONS}>
                  <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                  </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                    <Wallet className="h-5 w-5" />
                    <span className="sr-only">Connect Wallet</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Connect Wallet</TooltipContent>
              </Tooltip>

              <ThemeToggle />

              {loading ? (
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center space-x-2 text-foreground hover:text-primary">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={avatarUrl} alt={user.username} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user.username}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.username}</span>
                    <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-popover border-border w-48">
                    <DropdownMenuItem className="text-foreground hover:text-primary hover:bg-accent">
                      <Link href={USER_ROUTES.PROFILE} className="flex items-center w-full">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="ml-4 flex items-center space-x-4">
                  <Link href={USER_ROUTES.LOGIN}>
                    <Button
                      variant="ghost"
                      className="text-foreground hover:text-primary hover:bg-accent cursor-pointer"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href={USER_ROUTES.REGISTER}>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-foreground">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-background border-border">
                  <div className="flex flex-col space-y-4 mt-8">
                    <Link
                      href={USER_ROUTES.MARKET}
                      className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium"
                    >
                      Market
                    </Link>
                    <div className="px-3 py-2">
                      <div className="text-foreground text-sm font-medium mb-2">Trade</div>
                      <div className="ml-4 space-y-2">
                        <Link
                          href={USER_ROUTES.SWAP}
                          className="block text-muted-foreground hover:text-primary text-sm"
                        >
                          Swap
                        </Link>
                        <Link href={USER_ROUTES.BRIDGE} className="block text-muted-foreground hover:text-primary text-sm">
                          Bridge
                        </Link>
                        <Link href={USER_ROUTES.BUY} className="block text-muted-foreground hover:text-primary text-sm">
                          Buy
                        </Link>
                        <Link href={USER_ROUTES.SELL} className="block text-muted-foreground hover:text-primary text-sm">
                          Sell
                        </Link>
                      </div>
                    </div>
                    <Link href={USER_ROUTES.NFT_MARKET} className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium">
                      NFTs
                    </Link>
                    <Link
                      href={USER_ROUTES.COMMUNITY}
                      className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium"
                    >
                      Community
                    </Link>
                    <Link href={USER_ROUTES.QUESTS} className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium">
                      Quests
                    </Link>
                    <Link href={COMMON_ROUTES.ABOUT} className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium">
                      About Us
                    </Link>
                    {/* Mobile Auth Section */}
                    <div className="pt-4 space-y-2">
                      {user ? (
                        <>
                          <div className="px-3 py-2 border-t border-border">
                            <div className="flex items-center space-x-2 mb-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={avatarUrl} alt={user.username} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  {user.username}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-foreground text-sm font-medium">{user.username}</span>
                            </div>
                          </div>
                          <Link href={USER_ROUTES.PROFILE}>
                            <Button
                              variant="ghost"
                              className="w-full text-foreground hover:text-primary hover:bg-accent justify-start"
                            >
                              <User className="mr-2 h-4 w-4" />
                              Profile
                            </Button>
                          </Link>
                          <Button
                            onClick={handleLogout}
                            variant="ghost"
                            className="w-full text-destructive hover:text-destructive-foreground hover:bg-destructive/90 justify-start"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </Button>
                        </>
                      ) : (
                        <>
                          <Link href={USER_ROUTES.LOGIN}>
                            <Button
                              variant="ghost"
                              className="w-full text-foreground hover:text-primary hover:bg-accent"
                            >
                              Login
                            </Button>
                          </Link>
                          <Link href={USER_ROUTES.REGISTER}>
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                              Register
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  )
}
