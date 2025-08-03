import Link from "next/link"
import { Github, Twitter, DiscIcon as Discord, TextIcon as Telegram } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-blue-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
            >
              ChainVerse
            </Link>
            <p className="mt-4 text-gray-400 text-sm">
              Your gateway to the decentralized future. Trade, collect, and connect in the ultimate Web3 ecosystem.
            </p>
            <div className="flex space-x-4 mt-6">
              <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Discord className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Telegram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-gray-200 font-semibold mb-4">Products</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/swap" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Swap
                </Link>
              </li>
              <li>
                <Link href="/bridge" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Bridge
                </Link>
              </li>
              <li>
                <Link href="/nft" className="text-gray-400 hover:text-blue-400 transition-colors">
                  NFT Marketplace
                </Link>
              </li>
              <li>
                <Link href="/quests" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Quests
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-gray-200 font-semibold mb-4">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/community" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Discord
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Telegram
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Twitter
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-gray-200 font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Status
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© 2024 ChainVerse. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
