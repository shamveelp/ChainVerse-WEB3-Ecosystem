import WalletConnect from './WalletConnect';
import NetworkSwitcher from './NetworkSwitcher';

export default function NavbarTW() {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-white text-lg font-bold">Wallet App</h1>
        <div className="flex items-center space-x-4">
          <NetworkSwitcher />
          <WalletConnect />
        </div>
      </div>
    </nav>
  );
}