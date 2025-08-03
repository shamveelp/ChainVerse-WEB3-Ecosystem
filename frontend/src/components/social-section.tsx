import { MessageCircle, Share2, Trophy, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function SocialSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-900/50 to-blue-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ChainVerse Social
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Connect with fellow Web3 enthusiasts, share your achievements, and build your reputation in our
            decentralized social ecosystem.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <Card className="bg-slate-800/50 border-blue-800/30 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="bg-blue-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Community Chat</h3>
              <p className="text-gray-400 text-sm">Join discussions about DeFi, NFTs, and Web3 trends</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-800/30 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="bg-cyan-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Share Achievements</h3>
              <p className="text-gray-400 text-sm">Showcase your trading wins and NFT collections</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-800/30 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="bg-yellow-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Leaderboards</h3>
              <p className="text-gray-400 text-sm">Compete with others and climb the rankings</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-800/30 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="bg-purple-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Instant Updates</h3>
              <p className="text-gray-400 text-sm">Real-time notifications for market movements</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8"
          >
            Join Community
          </Button>
        </div>
      </div>
    </section>
  )
}
