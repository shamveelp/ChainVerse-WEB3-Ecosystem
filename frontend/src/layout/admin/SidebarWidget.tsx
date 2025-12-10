"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WalletConnection } from "@/components/trade/WalletConnection";
import { useAccount, useSendTransaction, useSwitchChain } from "wagmi";
import { parseEther } from "viem";
import { Coins, Loader2, QrCode } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import Image from "next/image";

// Placeholder donation address - REPLACE WITH YOUR ACTUAL WALLET ADDRESS
const DONATION_ADDRESS = "0xcc5d972ee1e4abe7d1d6b5fed1349ae4913cd423";

interface chainData {
  name: string;
  chainId: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

interface coinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
}

export default function SidebarWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [supportedNetworks, setSupportedNetworks] = useState<chainData[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<string>("");
  const [availableCoins, setAvailableCoins] = useState<coinData[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);

  const { address, isConnected, chain } = useAccount();
  const { sendTransaction, isPending } = useSendTransaction();
  const { switchChain } = useSwitchChain();

  // Fetch Networks and Coins
  useEffect(() => {
    const fetchData = async () => {
      setLoadingConfig(true);
      try {
        // Fetch EVM Chains (Public API)
        const chainsRes = await axios.get("https://chainid.network/chains.json");
        const allChains = chainsRes.data;
        // Filter for popular chains to keep the list manageable and relevant
        const popularChainIds = [1, 56, 137, 42161, 10, 8453]; // ETH, BSC, Polygon, Arb, OP, Base
        const filteredChains = allChains.filter((c: any) => popularChainIds.includes(c.chainId));
        setSupportedNetworks(filteredChains);

        // Fetch Top Coins (Public API - CoinGecko)
        // We mainly want to show tokens, but primarily we will donate the Native Coin of the network
        // We will fetch top coins just for display or if user wants to select (though we default to native)
        const coinsRes = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false"
        );
        setAvailableCoins(coinsRes.data);
      } catch (error) {
        console.error("Failed to fetch config data", error);
        // Fallback or silence error
      } finally {
        setLoadingConfig(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Handle Network Selection
  const handleNetworkChange = (chainIdStr: string) => {
    const chainId = parseInt(chainIdStr);
    setSelectedNetwork(chainIdStr);

    // Default coin to native for the selected network
    const network = supportedNetworks.find(n => n.chainId === chainId);
    if (network) {
      // Find if we have the native coin in our coin list or just use symbol
      // For simplicity in this widget, we define the "Coin" as the Native Currency of the network
      setSelectedCoin(network.nativeCurrency.symbol);
    }
  };

  const handleDonate = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!selectedNetwork) {
      toast.error("Please select a network");
      return;
    }

    const targetChainId = parseInt(selectedNetwork);

    // Switch Network if needed
    if (chain?.id !== targetChainId) {
      try {
        switchChain({ chainId: targetChainId });
      } catch (error) {
        toast.error("Failed to switch network. Please switch manually in your wallet.");
        return;
      }
    }

    // Send Transaction (Native only for now)
    try {
      sendTransaction({
        to: DONATION_ADDRESS as `0x${string}`,
        value: parseEther(amount),
      }, {
        onSuccess: () => {
          toast.success("Thank you for your donation!");
          setIsOpen(false);
          setAmount("");
        },
        onError: (error) => {
          console.error(error);
          toast.error("Transaction failed or rejected");
        }
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to initiate transaction");
    }
  };

  return (
    <div className="mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]">
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
        Buy Me a Coffee
      </h3>
      <p className="mb-4 text-gray-500 text-theme-sm dark:text-gray-400">
        ChainVerse runs Free, Open-Source Software. If you find it useful, consider supporting us!
      </p>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className="w-full bg-brand-500 hover:bg-brand-600 text-white"
          >
            <Coins className="mr-2 h-4 w-4" />
            Donate Now
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <QrCode className="h-5 w-5 text-brand-500" />
              Scan to Donate
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            {/* QR Code */}
            <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-lg border-2 border-brand-100 dark:border-brand-900/20">
              <Image
                src="/wallets/walletMain.png"
                alt="Wallet QR Code"
                fill
                className="object-cover"
              />
            </div>

            <div className="w-full space-y-4">
              {/* Connect Wallet */}
              <div className="flex justify-center w-full">
                <WalletConnection />
              </div>

              <div className="space-y-3">
                {/* Select Network */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Network</label>
                  <Select value={selectedNetwork} onValueChange={handleNetworkChange} disabled={loadingConfig}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Network" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {supportedNetworks.map((net) => (
                          <SelectItem key={net.chainId} value={net.chainId.toString()}>
                            {net.name}
                          </SelectItem>
                        ))}
                        {supportedNetworks.length === 0 && !loadingConfig && (
                          <SelectItem value="loading" disabled>Loading networks...</SelectItem>
                        )}
                        {loadingConfig && (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Select Coin (Displays Native Coin of Selected Network) */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Coin</label>
                  <Select value={selectedCoin} disabled={true}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCoin || "Select Network First"} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCoin && (
                        <SelectItem value={selectedCoin}>{selectedCoin} (Native)</SelectItem>
                      )}
                      {!selectedCoin && (
                        <SelectItem value="placeholder" disabled>Select Network First</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount Input */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-3 pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 text-sm font-medium">
                      {selectedCoin || "ETH"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <Button
                onClick={handleDonate}
                disabled={isPending || !isConnected}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-6 text-lg shadow-brand-500/20 shadow-lg"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Send Crypto"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
