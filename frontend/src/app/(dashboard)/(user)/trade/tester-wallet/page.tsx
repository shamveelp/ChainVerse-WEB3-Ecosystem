import NavbarTW from '@/components/tester/wallet-tester/NavbarTW';
import { WagmiProviderFn } from '@/components/tester/wallet-tester/WagmiProvider';

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