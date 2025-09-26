"use client"

import { useState } from 'react'
import { MessageCircle, User, Search, Clock, TrendingUp } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Post from './post'
import CreatePost from './create-post'
import ExploreContent from './explore-content'
import NotificationsContent from './notification-content'
import CommunitiesContent from './communities-content'
import MessagesContent from './messages-content'
import ProfileContent from './profile-content'
import BookmarksContent from './bookmarks-content'

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
  },
  {
    id: '5',
    author: {
      name: 'Crypto Analyst',
      username: 'cryptoanalyst',
      avatar: 'https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    content: 'Market analysis: BTC showing strong support levels. Alt season might be approaching. Always DYOR and manage your risk! 📊\n\nWhat are your thoughts on the current market sentiment?',
    timestamp: '12h',
    likes: 1567,
    comments: 289,
    reposts: 445
  },
  {
    id: '6',
    author: {
      name: 'Web3 Builder',
      username: 'web3builder',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    content: 'Building the future, one smart contract at a time. Just deployed a new protocol that will revolutionize how we think about decentralized governance.',
    timestamp: '1d',
    likes: 892,
    comments: 156,
    reposts: 321,
    image: 'https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
]

interface FeedProps {
  activeTab: string
}

export default function Feed({ activeTab }: FeedProps) {
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
              <h2 className="text-2xl font-bold text-white">Home</h2>
              <p className="text-slate-400">Stay updated with your Web3 community</p>
            </div>
            <div className="px-4">
              <CreatePost />
            </div>
            <div className="px-4 space-y-6">
              {mockPosts.map((post) => (
                <Post key={post.id} {...post} />
              ))}
            </div>
          </div>
        )
      
      case 'explore':
        return <ExploreContent />
      
      case 'notifications':
        return <NotificationsContent />
      
      case 'communities':
        return <CommunitiesContent />
      
      case 'messages':
        return <MessagesContent />
      
      case 'bookmarks':
        return <BookmarksContent />
      
      case 'profile':
        return <ProfileContent />
      
      default:
        return null
    }
  }

  return (
    <main className="flex-1 lg:ml-80 min-h-screen bg-slate-950">
      <div className="max-w-2xl mx-auto">
        {renderContent()}
      </div>
    </main>
  )
}