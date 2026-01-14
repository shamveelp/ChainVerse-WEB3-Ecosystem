'use client';

import { usePathname } from 'next/navigation';
import { CustomThirdwebProvider } from '@/components/nft/thirdweb-provider';
import { Header } from '@/components/nft/header';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/home/navbar';
import { cn } from '@/lib/utils';

export default function NFTMarketplaceLayout({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  // Check if we are on the main marketplace page
  const isMainPage = pathname === '/trade/nfts-marketplace';

  return (
    <CustomThirdwebProvider>
      <Navbar />
      <div className={cn(
        "relative min-h-screen",
        isMainPage ? "pt-0" : "pt-32 md:pt-36"
      )}>
        {/* Background Effects - Only show on non-main pages or modify for main page */}
        {!isMainPage && (
          <div className="fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          </div>
        )}

        <Header />
        <main className="relative">
          {children}
        </main>
        <Toaster position="bottom-right" />
      </div>
    </CustomThirdwebProvider>
  );
}