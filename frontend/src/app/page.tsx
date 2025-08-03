
import Navbar from "@/components/navbar"
import HeroSection from "@/components/hero-section"
import MovingMessages from "@/components/moving-messages"
import NFTSection from "@/components/nft-section"
import SocialSection from "@/components/social-section"
import Footer from "@/components/footer"



export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navbar />
      <main>
        <HeroSection />
        <MovingMessages />
        <NFTSection />
        <SocialSection />
      </main>
      <Footer />
    </div>
  )
}
