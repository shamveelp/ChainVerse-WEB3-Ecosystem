import { ArrowRight, Palette, TrendingUp, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export default function NFTSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              NFT Marketplace
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Discover, collect, and trade unique digital assets in our curated NFT marketplace. From art to gaming items,
            find your next digital treasure.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left - Features */}
          <div className="space-y-8">
            <div className="grid gap-6">
              <div className="flex items-start space-x-4">
                <div className="bg-purple-600/20 p-3 rounded-lg">
                  <Palette className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-200 mb-2">Curated Collections</h3>
                  <p className="text-gray-400">Handpicked NFT collections from top artists and creators worldwide.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-600/20 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-200 mb-2">Real-time Analytics</h3>
                  <p className="text-gray-400">
                    Track floor prices, volume, and trends with advanced market analytics.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-pink-600/20 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-200 mb-2">Creator Royalties</h3>
                  <p className="text-gray-400">
                    Support artists with automatic royalty distribution on secondary sales.
                  </p>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Right - NFT Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <Card
                key={item}
                className="bg-slate-800/50 border-slate-700/50 hover:border-purple-500/50 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg mb-3 flex items-center justify-center">
                    <Image
                      src={`/placeholder.svg?height=150&width=150&query=NFT artwork ${item}`}
                      alt={`NFT ${item}`}
                      width={150}
                      height={150}
                      className="rounded-lg"
                    />
                  </div>
                  <h4 className="font-semibold text-gray-200 mb-1">Digital Art #{item}</h4>
                  <p className="text-sm text-gray-400 mb-2">By Artist{item}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-400 font-semibold">{0.5 + item * 0.3} ETH</span>
                    <span className="text-xs text-gray-500">#{item}23</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
