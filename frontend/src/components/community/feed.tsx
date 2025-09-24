"use client"

import { MessageCircle, User } from 'lucide-react'
import Post from './post'

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
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Home Feed</h2>
              <p className="text-slate-400">Stay updated with the latest from your Web3 community</p>
            </div>
            {mockPosts.map((post) => (
              <Post key={post.id} {...post} />
            ))}
          </div>
        )
      case 'explore':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Explore</h2>
              <p className="text-slate-400">Discover trending topics and new voices in Web3</p>
            </div>
            {mockPosts.filter(post => post.trending).map((post) => (
              <Post key={post.id} {...post} />
            ))}
          </div>
        )
      case 'communities':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Communities</h2>
              <p className="text-slate-400">Connect with like-minded Web3 enthusiasts</p>
            </div>
            <div className="grid gap-4">
              {['DeFi Builders', 'NFT Creators', 'Smart Contract Developers', 'Crypto Traders'].map((community) => (
                <div key={community} className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-colors cursor-pointer">
                  <h3 className="text-lg font-semibold text-white">{community}</h3>
                  <p className="text-slate-400 text-sm">Active community discussing the latest trends</p>
                </div>
              ))}
            </div>
          </div>
        )
      case 'messages':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Messages</h2>
              <p className="text-slate-400">Your private conversations</p>
            </div>
            <div className="text-center py-12 text-slate-400">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No messages yet</p>
              <p className="text-sm">Start a conversation with someone from the community</p>
            </div>
          </div>
        )
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Profile</h2>
              <p className="text-slate-400">Manage your Web3 identity</p>
            </div>
            <div className="text-center py-12 text-slate-400">
              <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Profile settings coming soon</p>
              <p className="text-sm">Customize your Web3 presence</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <main className="flex-1 lg:ml-80 min-h-screen bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {renderContent()}
      </div>
    </main>
  )
}