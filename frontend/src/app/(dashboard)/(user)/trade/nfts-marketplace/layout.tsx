import { CustomThirdwebProvider } from '@/components/nft/thirdweb-provider';
import { Header } from '@/components/nft/header';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/home/navbar';

export default function NFTMarketplaceLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <CustomThirdwebProvider>
      <Navbar />
      <div className="relative min-h-screen">
        {/* Background Effects */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        </div>

        <Header />
        <main className="relative">
          {children}
        </main>
        <Toaster position="bottom-right" />
      </div>
    </CustomThirdwebProvider>
  );
}