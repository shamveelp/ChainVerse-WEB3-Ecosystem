import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function MarketPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Marketplace
        </h1>
        <p className="text-lg text-gray-300 text-center mb-12">
          Explore a wide range of digital assets and opportunities.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 backdrop-blur-md border border-blue-800/30 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-200 mb-4">Featured NFTs</h2>
            <ul className="space-y-3 text-gray-300">
              <li>CryptoPunks Collection</li>
              <li>Bored Ape Yacht Club</li>
              <li>Decentraland Land Parcels</li>
              <li>Art Blocks Curated</li>
            </ul>
            <button className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-md font-medium">
              View All NFTs
            </button>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-md border border-blue-800/30 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-200 mb-4">Top Cryptocurrencies</h2>
            <ul className="space-y-3 text-gray-300">
              <li>Bitcoin (BTC) - $65,000</li>
              <li>Ethereum (ETH) - $3,500</li>
              <li>Solana (SOL) - $150</li>
              <li>Cardano (ADA) - $0.45</li>
            </ul>
            <button className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-md font-medium">
              Trade Now
            </button>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-md border border-blue-800/30 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-200 mb-4">Upcoming Events</h2>
            <ul className="space-y-3 text-gray-300">
              <li>Web3 Conference 2025 - Oct 10-12</li>
              <li>NFT Art Exhibition - Nov 5</li>
              <li>Blockchain Hackathon - Dec 1-3</li>
              <li>Metaverse Summit - Jan 20, 2026</li>
            </ul>
            <button className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-md font-medium">
              Learn More
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
