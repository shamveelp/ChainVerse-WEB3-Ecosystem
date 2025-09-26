"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogIn, Shield, Plus, Sparkles } from 'lucide-react'
import type { RootState } from "@/redux/store"
import Navbar from "@/components/home/navbar"
import Sidebar from "@/components/community/sidebar"
import Feed from "@/components/community/feed"

export default function CommunityPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.userAuth)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('home')

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = () => {
    router.push('/user/login')
  }

  const handleAdminLogin = () => {
    router.push('/comms-admin/login')
  }

  const handleCreateCommunity = () => {
    router.push('/comms-admin/get-started')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {!isAuthenticated ? (
        <>

          {/* Animated Background */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20" />
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Not Logged In View */}
              <div className="text-center space-y-12">
                {/* Hero Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent">
                      ChainVerse Community
                    </h1>
                    <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
                  </div>
                  <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                    Join the most vibrant Web3 community where builders, traders, and innovators connect,
                    share knowledge, and shape the future of decentralized technology.
                  </p>
                </div>

                {/* Call to Action */}
                <div className="space-y-8">
                  <h2 className="text-3xl font-bold text-white">Ready to Join the Revolution?</h2>
                  <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                    <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 p-8 max-w-md hover:border-cyan-400/30 transition-all duration-300 group">
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
                    <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 p-8 max-w-md hover:border-purple-400/30 transition-all duration-300 group">
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
                          Login as a Community Admin / Create
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Logged In Twitter-like View
        <div className="flex">
          {/* Sidebar */}
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          
          {/* Main Content Feed */}
          <Feed activeTab={activeTab} />
          
          {/* Right Sidebar (Optional - for trending/suggestions) */}
          <aside className="hidden xl:block w-80 p-6 space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Trending in Web3</h3>
              <div className="space-y-3">
                {['#DeFi', '#NFTs', '#Ethereum', '#Bitcoin', '#Web3'].map((tag) => (
                  <div key={tag} className="text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors">
                    {tag}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Suggested Communities</h3>
              <div className="space-y-3">
                {['DeFi Builders', 'NFT Artists', 'Crypto Traders'].map((community) => (
                  <div key={community} className="text-slate-300 hover:text-white cursor-pointer transition-colors text-sm">
                    {community}
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreateCommunity}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Community
            </Button>
          </aside>
        </div>
      )}
    </div>
  )
}