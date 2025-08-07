"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, Users, Shield, Home } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
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
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/30 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-600/20 to-red-800/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-red-500/10 to-red-700/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-red-900/5 to-red-600/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-500/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-50">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-800/30 backdrop-blur-sm"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center animate-pulse">
                <Users className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-400 to-red-600 rounded-full animate-bounce">
                <Sparkles className="h-4 w-4 text-white m-1" />
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent animate-pulse">
              Expand Your
            </h1>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">
              Community
            </h1>
          </div>

          {/* Description */}
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Build, manage, and grow your Web3 community with cutting-edge tools. 
            Connect with like-minded individuals and shape the future of decentralized collaboration.
          </p>

          {/* Feature Icons */}
          <div className="flex justify-center gap-8 py-8">
            <div className="flex flex-col items-center space-y-2 group">
              <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center group-hover:bg-red-800/40 transition-all duration-300">
                <Zap className="h-6 w-6 text-red-400" />
              </div>
              <span className="text-sm text-gray-400">Lightning Fast</span>
            </div>
            <div className="flex flex-col items-center space-y-2 group">
              <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center group-hover:bg-red-800/40 transition-all duration-300">
                <Shield className="h-6 w-6 text-red-400" />
              </div>
              <span className="text-sm text-gray-400">Secure</span>
            </div>
            <div className="flex flex-col items-center space-y-2 group">
              <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center group-hover:bg-red-800/40 transition-all duration-300">
                <Users className="h-6 w-6 text-red-400" />
              </div>
              <span className="text-sm text-gray-400">Community Driven</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            <Button
              onClick={() => router.push('/create-community')}
              className="group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl shadow-red-900/50 hover:shadow-red-800/60 transition-all duration-300 transform hover:scale-105"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-red-600/50 text-red-400 hover:text-red-300 hover:border-red-500 hover:bg-red-950/30 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
            >
              Already have a community? Login
            </Button>
          </div>

          {/* Bottom Stats */}
          <div className="pt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-red-400">10K+</div>
              <div className="text-sm text-gray-400">Communities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-red-400">500K+</div>
              <div className="text-sm text-gray-400">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-red-400">24/7</div>
              <div className="text-sm text-gray-400">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
