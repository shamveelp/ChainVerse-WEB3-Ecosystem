'use client';

import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import Navbar from '@/components/home/navbar';
import HeroSection from '@/components/home/hero-section';
import MovingMessages from '@/components/home/moving-messages';
import NFTSection from '@/components/home/nft-section';
import SocialSection from '@/components/home/social-section';
import Footer from '@/components/home/footer';

export default function HomePage() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    lenis.on('scroll', ({ scroll, velocity }: { scroll: number; velocity: number }) => {
      console.log(`Scroll position: ${scroll}, Velocity: ${velocity}`);
    });

    return () => lenis.destroy();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <MovingMessages />
        <NFTSection />
        <SocialSection />
      </main>
      <Footer />
    </div>
  );
}