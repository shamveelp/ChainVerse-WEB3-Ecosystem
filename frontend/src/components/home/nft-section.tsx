"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

gsap.registerPlugin(ScrollTrigger)

const nftItems = [
  { id: 1, name: "Cosmic Voyager #001", artist: "StarWalker", price: "1.2 ETH", image: "/giffy.gif" },
  { id: 2, name: "Neon Genesis #042", artist: "CyberPunk_Lab", price: "0.8 ETH", image: "/giffy.gif" },
  { id: 3, name: "Ethereal Spirit #108", artist: "SoulArt", price: "2.5 ETH", image: "/giffy.gif" },
  { id: 4, name: "Digital Horizon #777", artist: "FutureVisions", price: "1.5 ETH", image: "/giffy.gif" },
]

export default function NFTSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header Animation
      gsap.fromTo(headerRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 80%",
          }
        }
      )

      // Cards Animation
      const cards = gsap.utils.toArray(".nft-card");
      cards.forEach((card: unknown, i) => {
        gsap.fromTo(card as HTMLElement,
          { y: 100, opacity: 0, rotateY: 15 },
          {
            y: 0,
            opacity: 1,
            rotateY: 0,
            duration: 0.8,
            delay: i * 0.1,
            scrollTrigger: {
              trigger: card as HTMLElement,
              start: "top 90%",
            }
          }
        )
      })

    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0a0a1a] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div ref={headerRef} className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 text-purple-400 font-medium mb-4">
              <Sparkles className="w-5 h-5" />
              <span>NFT Marketplace</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Collect Digital <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Masterpieces
              </span>
            </h2>
            <p className="text-gray-400 text-lg">
              Discover unique assets from world-class artists. Buy, sell, and trade with zero friction.
            </p>
          </div>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:border-white rounded-full px-8 transition-all">
            View Collection <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {nftItems.map((item) => (
            <div key={item.id} className="nft-card group perspective-1000">
              <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:-translate-y-2">
                <CardContent className="p-0">
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <Button className="w-full bg-white text-black hover:bg-gray-200 font-bold rounded-xl">Buy Now</Button>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">{item.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{item.artist}</p>
                    <div className="flex justify-between items-center border-t border-gray-800 pt-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Current Bid</span>
                        <span className="text-white font-medium">{item.price}</span>
                      </div>
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">24h left</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
