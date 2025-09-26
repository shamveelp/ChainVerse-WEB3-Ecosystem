"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogIn, Shield, Sparkles } from 'lucide-react'
import type { RootState } from "@/redux/store"
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"
import CreatePost from "@/components/community/create-post"
import Post from '@/components/community/post'

const mockPosts = [
  {
    id: '1',
    author: {
      name: 'Vitalik Buterin',
      username: 'vitalikbuterin',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
      verified: true
    },
    content: 'Excited to announce the latest Ethereum improvements! Layer 2 scaling solutions are showing incredible promise. The future of DeFi is looking brighter than ever! 🚀\n\n#Ethereum #Web3 #DeFi',
    timestamp: '2h',
    likes: 2847,
    comments: 342,
    reposts: 1205,
    trending: true
  },
  {
    id: '2',
    author: {
      name: 'ChainLink Oracle',
      username: 'chainlinkoracle',
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=400',
      verified: true
    },
    content: 'Real-world data is now seamlessly integrated into smart contracts. Our latest update brings enterprise-grade reliability to DeFi protocols.',
    timestamp: '4h',
    likes: 1823,
    comments: 198,
    reposts: 567,
    image: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: '3',
    author: {
      name: 'NFT Creator',
      username: 'nftartist',
      avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    content: 'Just dropped my latest NFT collection! Each piece represents the intersection of art and blockchain technology. What do you think about the future of digital art?',
    timestamp: '6h',
    likes: 945,
    comments: 87,
    reposts: 234,
    image: 'https://images.pexels.com/photos/1547813/pexels-photo-1547813.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: '4',
    author: {
      name: 'DeFi Protocol',
      username: 'defiprotocol',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
      verified: true
    },
    content: 'Our liquidity pools have reached $1B TVL! Thank you to our amazing community for making this milestone possible. Here\'s to the next billion! 💎',
    timestamp: '8h',
    likes: 3421,
    comments: 512,
    reposts: 1876,
    trending: true
  }
]

export default function CommunityPage() {
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.userAuth)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = () => {
    router.push('/user/login')
  }

  const handleAdminLogin = () => {
    router.push('/comms-admin/login')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20" />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center space-y-12">
              {/* Hero Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent">
                    ChainVerse Community
                  </h1>
                  <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
                </div>
                <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto">
                  Join the most vibrant Web3 community where builders, traders, and innovators connect,
                  share knowledge, and shape the future of decentralized technology.
                </p>
              </div>

              {/* Call to Action */}
              <div className="space-y-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to Join the Revolution?</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 p-6 sm:p-8 hover:border-cyan-400/30 transition-all duration-300 group">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <LogIn className="h-8 w-8 text-cyan-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Join as Member</h3>
                      <p className="text-slate-400">
                        Connect with fellow Web3 enthusiasts, share insights, and stay updated with the latest trends.
                      </p>
                      <Button
                        onClick={handleLogin}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Login
                      </Button>
                    </div>
                  </Card>
                  <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 p-6 sm:p-8 hover:border-purple-400/30 transition-all duration-300 group">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Shield className="h-8 w-8 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Become Community Admin</h3>
                      <p className="text-slate-400">
                        Lead your own community, moderate discussions, and help shape the Web3 ecosystem.
                      </p>
                      <Button
                        onClick={handleAdminLogin}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Login as Community Admin
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Authenticated Home Page
  return (
    <div className="flex min-h-screen bg-slate-950 relative">
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
        <div className="max-w-2xl mx-auto h-screen overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
          <div className="space-y-6">
            {/* Header */}
            <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
              <h2 className="text-2xl font-bold text-white">Home</h2>
              <p className="text-slate-400">Stay updated with your Web3 community</p>
            </div>
            
            {/* Create Post */}
            <div className="px-4">
              <CreatePost />
            </div>
            
            {/* Posts */}
            <div className="px-4 space-y-6 pb-6">
              {mockPosts.map((post) => (
                <Post key={post.id} {...post} />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  )
}