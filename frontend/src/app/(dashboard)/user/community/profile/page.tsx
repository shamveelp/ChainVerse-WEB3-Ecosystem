"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Link2, MessageCircle, MoveHorizontal as MoreHorizontal, Settings } from 'lucide-react'
import Post from '@/components/community/post'
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"

const profileData = {
  name: 'Alex Chen',
  username: 'alexchen_dev',
  bio: 'Full-stack Web3 developer building the future of DeFi 🚀 | Smart Contract Auditor | Open Source Contributor | Based in SF',
  location: 'San Francisco, CA',
  website: 'https://alexchen.dev',
  joinDate: 'December 2022',
  verified: true,
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
  banner: 'https://images.pexels.com/photos/924824/pexels-photo-924824.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300',
  stats: {
    followers: '2.4K',
    following: '1.2K',
    posts: '847',
    likes: '12.3K'
  }
}

const userPosts = [
  {
    id: '1',
    author: {
      name: 'Alex Chen',
      username: 'alexchen_dev',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
      verified: true
    },
    content: 'Just deployed a new smart contract audit tool that can detect 95% of common vulnerabilities automatically. Open sourcing it next week! 🔐\n\n#SmartContracts #Security #Web3',
    timestamp: '4h',
    likes: 342,
    comments: 28,
    reposts: 67,
    image: 'https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('posts')
  const [isFollowing, setIsFollowing] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
        <div className="max-w-2xl mx-auto h-screen overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
          <div className="space-y-0">
            {/* Header */}
            <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{profileData.name}</h2>
                  <p className="text-slate-400">{profileData.stats.posts} posts</p>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Banner */}
            <div className="relative h-48 md:h-64">
              <img
                src={profileData.banner}
                alt="Profile banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
            </div>

            {/* Profile Info */}
            <div className="px-4 pb-4">
              <div className="relative -mt-16 md:-mt-20 mb-4">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 ring-4 ring-slate-950 bg-slate-950">
                  <AvatarImage src={profileData.avatar} alt={profileData.name} />
                  <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-4xl">
                    {profileData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-white">{profileData.name}</h1>
                      {profileData.verified && (
                        <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-400 mb-2">@{profileData.username}</p>
                  </div>

                  <p className="text-white text-lg leading-relaxed max-w-2xl">{profileData.bio}</p>

                  <div className="flex flex-wrap gap-4 text-slate-400">
                    {profileData.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{profileData.location}</span>
                      </div>
                    )}
                    {profileData.website && (
                      <div className="flex items-center gap-1">
                        <Link2 className="w-4 h-4" />
                        <a href={profileData.website} className="text-sm text-cyan-400 hover:text-cyan-300">
                          {profileData.website.replace('https://', '')}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Joined {profileData.joinDate}</span>
                    </div>
                  </div>

                  <div className="flex gap-6 text-sm">
                    <div className="hover:underline cursor-pointer">
                      <span className="font-semibold text-white">{profileData.stats.following}</span>
                      <span className="text-slate-400 ml-1">Following</span>
                    </div>
                    <div className="hover:underline cursor-pointer">
                      <span className="font-semibold text-white">{profileData.stats.followers}</span>
                      <span className="text-slate-400 ml-1">Followers</span>
                    </div>
                    <div>
                      <span className="font-semibold text-white">{profileData.stats.likes}</span>
                      <span className="text-slate-400 ml-1">Likes Received</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="border-slate-600 hover:bg-slate-800">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={`${
                      isFollowing
                        ? 'bg-slate-800 text-white hover:bg-red-600 hover:text-white border border-slate-600'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button variant="outline" size="icon" className="border-slate-600 hover:bg-slate-800">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 border border-slate-700/50">
                  <TabsTrigger value="posts" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    Posts
                  </TabsTrigger>
                  <TabsTrigger value="replies" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    Replies
                  </TabsTrigger>
                  <TabsTrigger value="media" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    Media
                  </TabsTrigger>
                  <TabsTrigger value="likes" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    Likes
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6 pb-6">
                  <TabsContent value="posts" className="space-y-6">
                    {userPosts.map((post) => (
                      <Post key={post.id} {...post} />
                    ))}
                  </TabsContent>

                  <TabsContent value="replies" className="space-y-6">
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                      <p className="text-lg text-slate-400">No replies yet</p>
                      <p className="text-sm text-slate-500">Replies to other posts will appear here</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="aspect-square rounded-xl overflow-hidden">
                        <img
                          src="https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?auto=compress&cs=tinysrgb&w=400"
                          alt="Media"
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="likes" className="space-y-6">
                    {userPosts.map((post) => (
                      <Post key={post.id} {...post} />
                    ))}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  )
}