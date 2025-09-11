import type { Metadata } from "next";
import { NavbarT } from "@/components/trade/Navbar";
import Navbar from "@/components/home/navbar";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "ChainVerse NFT Marketplace",
  description: "Discover, create, and trade unique digital assets on multiple blockchains",
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
        <NavbarT />
        <main>{children}</main>
        <Toaster 
          theme="dark" 
          position="bottom-right"
          expand={false}
          richColors
        />
      </div>
    </>
  );
}