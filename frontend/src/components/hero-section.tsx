import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import SwapBox from "@/components/swap-box"

export default function HeroSection() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  ChainVerse
                </span>
              </h1>
              <h2 className="text-2xl lg:text-3xl font-semibold text-gray-200">Your WEB3 Ecosystem</h2>
              <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                Experience the future of decentralized finance with ChainVerse. Trade, swap, bridge, and explore NFTs in
                a unified ecosystem designed for the next generation of Web3 enthusiasts. Join our community and embark
                on exciting quests while earning rewards.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
              >
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-blue-500 text-blue-400 hover:bg-blue-500/10 px-8 py-3 bg-transparent"
              >
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">$2.5B+</div>
                <div className="text-sm text-gray-400">Total Volume</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">150K+</div>
                <div className="text-sm text-gray-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">50+</div>
                <div className="text-sm text-gray-400">Supported Chains</div>
              </div>
            </div>
          </div>

          {/* Right Content - Swap Box */}
          <div className="flex justify-center lg:justify-end">
            <SwapBox />
          </div>
        </div>
      </div>
    </section>
  )
}
