import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";

export default function TradeNavbar() {
  return (
    <div className="fixed top-16 left-0 w-full bg-gray-900 bg-opacity-80 backdrop-blur-md shadow-md z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-3">
        <h2 className="text-lg font-semibold text-gray-200">Trade</h2>
        <ConnectButton
          client={client}
          appMetadata={{
            name: "DEX Tester",
            url: "https://example.com",
          }}
        />
      </div>
    </div>
  );
}