import NavbarTW from '@/components/nft/wallet-tester/NavbarTW';
import { WagmiProviderFn } from '@/components/nft/wallet-tester/WagmiProvider';

export default function Home() {
  return (
    <WagmiProviderFn>
        <div>
        <NavbarTW />
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold">Wallet Connection App</h1>
        </div>
        </div>

    </WagmiProviderFn>
  );
}