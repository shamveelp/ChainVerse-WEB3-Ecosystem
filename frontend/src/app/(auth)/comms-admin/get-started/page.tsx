"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Home, Shield } from 'lucide-react'
import type { RootState } from "@/redux/store"
import { COMMUNITY_ADMIN_ROUTES, COMMON_ROUTES } from '@/routes'

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.userAuth)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black flex items-center justify-center relative">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/30 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-600/20 to-red-800/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-red-500/10 to-red-700/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-50">
        <Button
          onClick={() => router.push(COMMON_ROUTES.HOME)}
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-800/30 backdrop-blur-sm"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center space-y-8 max-w-3xl mx-auto px-4">
        {/* Main Heading */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-red-400 animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
              ChainVerse Community
            </h1>
            <Sparkles className="h-6 w-6 text-red-400 animate-pulse" />
          </div>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Build, manage, and grow your Web3 community with cutting-edge tools.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => router.push(COMMUNITY_ADMIN_ROUTES.CREATE_COMMUNITY)}
            className="group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-3 text-base font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Create Community
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => router.push(COMMUNITY_ADMIN_ROUTES.CREATE_COMMUNITY)}
            className="group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-3 text-base font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            onClick={() => router.push(COMMUNITY_ADMIN_ROUTES.LOGIN)}
            variant="outline"
            className="px-6 py-3 text-base font-semibold rounded-lg border-2 border-red-600/50 text-red-400 hover:text-red-300 hover:border-red-500 hover:bg-red-950/30 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
          >
            <Shield className="h-4 w-4 mr-2" />
            Login
          </Button>
        </div>
      </div>
    </div>
  )
}