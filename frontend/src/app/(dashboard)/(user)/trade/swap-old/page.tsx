"use client";

import { toEther, toWei } from "thirdweb";
import { useActiveAccount, useReadContract, useSendTransaction, useWalletBalance } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { client } from "@/lib/thirdweb-client";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import SwapInput from "@/components/user/trade/SwapInput";
import PairSelector from "@/components/user/trade/PairSelector";
import { ArrowUpDown, ChevronDown } from "lucide-react";

interface SelectedToken {
  name: string;
  symbol: string;
  contractAddress: string;
  logoUrl?: string;
}

const Home: NextPage = () => {
  const TOKEN_CONTRACT = "0x556156751F9c85F1973284A07E60E796BC032B1F";
  const DEX_CONTRACT = "0x2Bf89a557BA41f7dC9Ed6a4Ec3c3f60Bad92FbF1";

  const account = useActiveAccount();
  const address = account?.address;

  const tokenContract = getContract({ address: TOKEN_CONTRACT, client, chain: sepolia });
  const dexContract = getContract({ address: DEX_CONTRACT, client, chain: sepolia });

  const { data: symbol } = useReadContract({
    contract: tokenContract,
    method: "function symbol() view returns (string)",
    params: [],
  });

  const { data: tokenBalance } = useReadContract({
    contract: tokenContract,
    method: "function balanceOf(address) view returns (uint256)",
    params: [address || ""],
  });

  const { data: contractTokenBalance } = useReadContract({
    contract: tokenContract,
    method: "function balanceOf(address) view returns (uint256)",
    params: [DEX_CONTRACT],
  });

  const { data: nativeBalance } = useWalletBalance({
    address: address,
    client,
    chain: sepolia,
  });

  const [contractBalance, setContractBalance] = useState<string>("0");
  const [nativeValue, setNativeValue] = useState<string>("0");
  const [tokenValue, setTokenValue] = useState<string>("0");
  const [currentFrom, setCurrentFrom] = useState<string>("native");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  
  const [fromToken, setFromToken] = useState<SelectedToken>({
    name: 'Ethereum',
    symbol: 'ETH',
    contractAddress: 'ETH'
  });
  
  const [toToken, setToToken] = useState<SelectedToken>({
    name: 'KUKA Coin',
    symbol: 'KUKA',
    contractAddress: TOKEN_CONTRACT
  });

  const { mutateAsync: sendTransaction } = useSendTransaction();

  const { data: amountToGet } = useReadContract({
    contract: dexContract,
    method: "function getAmountOfTokens(uint256,uint256,uint256) view returns (uint256)",
    params: currentFrom === "native"
      ? [toWei(nativeValue || "0"), toWei(contractBalance || "0"), contractTokenBalance || 0n]
      : [toWei(tokenValue || "0"), contractTokenBalance || 0n, toWei(contractBalance || "0")],
  });

  // Track wallet connection
  useEffect(() => {
    if (address) {
      trackWalletConnection(address);
    }
  }, [address]);

  const trackWalletConnection = async (walletAddress: string) => {
    try {
      await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: walletAddress }),
      });
    } catch (error) {
      console.error('Error tracking wallet connection:', error);
    }
  };

  const recordTransaction = async (txHash: string) => {
    try {
      await fetch('/api/dex/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          fromToken: fromToken.contractAddress,
          toToken: toToken.contractAddress,
          fromAmount: currentFrom === "native" ? nativeValue : tokenValue,
          toAmount: currentFrom === "native" ? tokenValue : nativeValue,
          transactionHash: txHash,
          network: 'sepolia'
        }),
      });
    } catch (error) {
      console.error('Error recording transaction:', error);
    }
  };

  const fetchContractBalance = async () => {
    try {
      const balance = await nativeBalance;
      setContractBalance(balance?.displayValue || "0");
    } catch (error) {
      console.error(error);
    }
  };

  const executeSwap = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      let txHash: string;
      
      if (currentFrom === "native") {
        const transaction = prepareContractCall({
          contract: dexContract,
          method: "function swapEthToToken() payable",
          params: [],
          value: toWei(nativeValue || "0"),
        });
        const result = await sendTransaction(transaction);
        txHash = result.transactionHash;
      } else {
        const approveTransaction = prepareContractCall({
          contract: tokenContract,
          method: "function approve(address,uint256) returns (bool)",
          params: [DEX_CONTRACT, toWei(tokenValue || "0")],
        });
        await sendTransaction(approveTransaction);
        
        const swapTransaction = prepareContractCall({
          contract: dexContract,
          method: "function swapTokenToEth(uint256)",
          params: [toWei(tokenValue || "0")],
        });
        const result = await sendTransaction(swapTransaction);
        txHash = result.transactionHash;
      }
      
      // Record transaction in database
      await recordTransaction(txHash);
      alert("Swap executed successfully");
    } catch (error) {
      console.error(error);
      alert("An error occurred while trying to execute the swap");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setCurrentFrom(currentFrom === "native" ? "token" : "native");
    
    // Swap values
    const tempValue = nativeValue;
    setNativeValue(tokenValue);
    setTokenValue(tempValue);
  };

  useEffect(() => {
    fetchContractBalance();
    const interval = setInterval(fetchContractBalance, 10000);
    return () => clearInterval(interval);
  }, [nativeBalance]);

  useEffect(() => {
    if (!amountToGet) return;
    if (currentFrom === "native") {
      setTokenValue(toEther(amountToGet));
    } else {
      setNativeValue(toEther(amountToGet));
    }
  }, [amountToGet]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black pt-32">
      <div className="w-full max-w-md bg-gray-800 bg-opacity-50 rounded-2xl p-8 shadow-2xl backdrop-blur-lg">
        <div className="space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">From</span>
              <button
                onClick={() => setShowFromSelector(true)}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <span className="text-sm">{fromToken.symbol}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <SwapInput
              current={currentFrom}
              type="native"
              max={nativeBalance?.displayValue}
              value={nativeValue}
              setValue={setNativeValue}
              tokenSymbol={fromToken.symbol}
              tokenBalance={nativeBalance?.displayValue}
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwapTokens}
              className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 transition-all duration-300 transform hover:scale-110"
            >
              <ArrowUpDown className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">To</span>
              <button
                onClick={() => setShowToSelector(true)}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <span className="text-sm">{toToken.symbol}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <SwapInput
              current={currentFrom}
              type="token"
              max={tokenBalance ? toEther(tokenBalance) : "0"}
              value={tokenValue}
              setValue={setTokenValue}
              tokenSymbol={toToken.symbol}
              tokenBalance={tokenBalance ? toEther(tokenBalance) : "0"}
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="mt-6 text-center">
          {address ? (
            <button
              onClick={executeSwap}
              disabled={isLoading}
              className={`w-full py-3 rounded-lg text-lg font-semibold transition-all duration-300 ${
                isLoading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                `Swap ${fromToken.symbol} for ${toToken.symbol}`
              )}
            </button>
          ) : (
            <p className="text-gray-400">Connect wallet to exchange.</p>
          )}
        </div>
      </div>

      {/* Token Selectors */}
      <PairSelector
        isOpen={showFromSelector}
        onClose={() => setShowFromSelector(false)}
        onSelectToken={setFromToken}
        currentToken={fromToken}
        title="Select From Token"
      />
      
      <PairSelector
        isOpen={showToSelector}
        onClose={() => setShowToSelector(false)}
        onSelectToken={setToToken}
        currentToken={toToken}
        title="Select To Token"
      />
    </main>
  );
};

export default Home;