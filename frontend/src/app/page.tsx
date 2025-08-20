
import Navbar from "@/components/home/navbar"
import HeroSection from "@/components/home/hero-section"
import MovingMessages from "@/components/home/moving-messages"
import NFTSection from "@/components/home/nft-section"
import SocialSection from "@/components/home/social-section"
import Footer from "@/components/home/footer"
// import MarketSection from "@/components/home/market-section"



export default function HomePage() {

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        {/* <MarketSection /> */}
        <MovingMessages />
        <NFTSection />
        <SocialSection />
      </main>
      <Footer />
    </div>
  )
}
