'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Hyperspeed, { hyperspeedPresets } from '@/components/ReactBits/Hyperspeed';
import { ArrowRight, Wallet, Rocket, Layers } from 'lucide-react';

export default function NFTMarketplaceHome() {
  const container = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.registerPlugin(useGSAP);
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(titleRef.current,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2 }
    )
      .fromTo(subtitleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1 },
        "-=0.8"
      )
      .fromTo(buttonsRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.6"
      );

    // Continuous floating animation for cards
    if (cardsContainerRef.current) {
      const cards = cardsContainerRef.current.querySelectorAll('.floating-card');
      cards.forEach((card, index) => {
        gsap.to(card, {
          y: -15,
          duration: 2 + index * 0.2, // Staggered duration
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.1 // Staggered delay
        });
      });
    }
  }, { scope: container });

  return (
    <div ref={container} className="relative min-h-screen bg-black text-white w-full overflow-x-hidden font-sans">
      {/* Background Video */}
      <div className="absolute top-0 left-0 w-[100vw] h-screen z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60 scale-110"
        >
          <source src="/videos/NFT.mp4" type="video/mp4" />
        </video>
        {/* Main dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 z-10" />

        {/* Bottom seamless fade to black */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black via-black to-transparent z-20" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center pt-20">
        <h1 ref={titleRef} className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-2xl opacity-0">
          DISCOVER<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">UNIVERSE</span>
        </h1>

        <p ref={subtitleRef} className="text-lg md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light opacity-0">
          Explore, create, and trade extraordinary digital assets in the most advanced decentralized marketplace.
        </p>

        <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-6 mt-4 opacity-0">
          <Link href="/trade/nfts-marketplace/explore">
            <Button size="lg" className="rounded-full px-10 py-8 text-xl font-bold bg-white text-black hover:bg-gray-200 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
              Explore NFTs <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </Link>
          <Link href="/trade/nfts-marketplace/create">
            <Button size="lg" variant="outline" className="rounded-full px-10 py-8 text-xl font-bold border-2 border-white/20 text-white hover:bg-white/10 hover:border-white hover:scale-105 transition-all duration-300 backdrop-blur-md">
              Create NFT
            </Button>
          </Link>
        </div>
      </section>

      {/* Hyperspeed Section */}
      <section className="relative w-full py-32 overflow-hidden bg-black z-20">
        <div className="absolute inset-0 z-0 opacity-80">
          <Hyperspeed effectOptions={hyperspeedPresets.two} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-none">
          <div className="flex flex-col items-center justify-center min-h-[600px] text-center space-y-12">
            <h2 className="text-4xl md:text-7xl font-bold text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
              NEXT GEN ASSET
            </h2>

            <div ref={cardsContainerRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mt-12 pointer-events-auto">
              <Link href="/trade/nfts-marketplace/explore">
                <div className="floating-card bg-transparent p-8 rounded-3xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 group cursor-pointer h-full flex flex-col items-center justify-center backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                    <Rocket className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">Buy NFTs</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">Explore and collect unique digital assets from the universe.</p>
                </div>
              </Link>

              <Link href="/trade/nfts-marketplace/create">
                <div className="floating-card bg-transparent p-8 rounded-3xl border border-white/10 hover:border-blue-500/50 transition-all duration-300 group cursor-pointer h-full flex flex-col items-center justify-center backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                    <Wallet className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">Create</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">Mint your own NFTs and share your creativity with the world.</p>
                </div>
              </Link>

              <Link href="/trade/nfts-marketplace/profile">
                <div className="floating-card bg-transparent p-8 rounded-3xl border border-white/10 hover:border-pink-500/50 transition-all duration-300 group cursor-pointer h-full flex flex-col items-center justify-center backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mb-6 border border-pink-500/20 group-hover:scale-110 transition-transform duration-500">
                    <Layers className="h-8 w-8 text-pink-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">Sell Yours</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">List your NFTs for sale and reach a global audience of collectors.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}