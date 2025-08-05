"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, Menu, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext" // Changed import to useAuth from AuthContext

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, isLoading, logout } = useAuth() // Uses the useAuth hook
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      })
    }
  }

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-blue-800/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
            >
              ChainVerse
            </Link>
          </div>
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link
                href="/user/market"
                className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
              >
                Market
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1">
                  Trade <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-blue-800/30">
                  <DropdownMenuItem className="text-gray-300 hover:text-blue-400 hover:bg-slate-700">
                    <Link href="/swap">Swap</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:text-blue-400 hover:bg-slate-700">
                    <Link href="/bridge">Bridge</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:text-blue-400 hover:bg-slate-700">
                    <Link href="/buy">Buy</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:text-blue-400 hover:bg-slate-700">
                    <Link href="/sell">Sell</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link
                href="/nft"
                className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
              >
                NFT
              </Link>
              <Link
                href="/community"
                className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
              >
                Community
              </Link>
              <Link
                href="/quests"
                className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
              >
                Quests
              </Link>
            </div>
          </div>
          {/* Desktop Auth Buttons / User Menu */}
          <div className="hidden md:block">
            {isLoading ? (
              <div className="w-8 h-8 bg-slate-700 rounded-full animate-pulse"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-2 text-gray-300 hover:text-blue-400">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-blue-800/30 w-48">
                  <DropdownMenuItem className="text-gray-300 hover:text-blue-400 hover:bg-slate-700">
                    <Link href="/profile" className="flex items-center w-full">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem
                    className="text-red-400 hover:text-red-300 hover:bg-slate-700 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="ml-4 flex items-center space-x-4">
                <Link href="/user/login">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-blue-400 hover:bg-slate-800 cursor-pointer"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/user/register">
                  <Button className="bg-gradient-to-r cur from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-300">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-slate-900 border-blue-800/30">
                <div className="flex flex-col space-y-4 mt-8">
                  <Link href="/market" className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium">
                    Market
                  </Link>
                  <div className="px-3 py-2">
                    <div className="text-gray-300 text-sm font-medium mb-2">Trade</div>
                    <div className="ml-4 space-y-2">
                      <Link href="/swap" className="block text-gray-400 hover:text-blue-400 text-sm">
                        Swap
                      </Link>
                      <Link href="/bridge" className="block text-gray-400 hover:text-blue-400 text-sm">
                        Bridge
                      </Link>
                      <Link href="/buy" className="block text-gray-400 hover:text-blue-400 text-sm">
                        Buy
                      </Link>
                      <Link href="/sell" className="block text-gray-400 hover:text-blue-400 text-sm">
                        Sell
                      </Link>
                    </div>
                  </div>
                  <Link href="/nft" className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium">
                    NFT
                  </Link>
                  <Link href="/community" className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium">
                    Community
                  </Link>
                  <Link href="/quests" className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium">
                    Quests
                  </Link>
                  {/* Mobile Auth Section */}
                  <div className="pt-4 space-y-2">
                    {user ? (
                      <>
                        <div className="px-3 py-2 border-t border-slate-700">
                          <div className="flex items-center space-x-2 mb-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="bg-blue-600 text-white text-xs">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-gray-300 text-sm font-medium">{user.name}</span>
                          </div>
                        </div>
                        <Link href="/profile">
                          <Button
                            variant="ghost"
                            className="w-full text-gray-300 hover:text-blue-400 hover:bg-slate-800 justify-start"
                          >
                            <User className="mr-2 h-4 w-4" />
                            Profile
                          </Button>
                        </Link>
                        <Button
                          onClick={handleLogout}
                          variant="ghost"
                          className="w-full text-red-400 hover:text-red-300 hover:bg-slate-800 justify-start"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link href="/user/login">
                          <Button
                            variant="ghost"
                            className="w-full text-gray-300 hover:text-blue-400 hover:bg-slate-800"
                          >
                            Login
                          </Button>
                        </Link>
                        <Link href="/user/register">
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
  )
}
