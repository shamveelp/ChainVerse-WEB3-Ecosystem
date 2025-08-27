"use client";

import { toEther, toWei } from "thirdweb";
import { useActiveAccount, useReadContract, useSendTransaction, useWalletBalance } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { client } from "@/lib/thirdweb-client";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import SwapInput from "@/components/user/trade/SwapInput";

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

  const { mutateAsync: sendTransaction } = useSendTransaction();

  const { data: amountToGet } = useReadContract({
    contract: dexContract,
    method: "function getAmountOfTokens(uint256,uint256,uint256) view returns (uint256)",
    params: currentFrom === "native"
      ? [toWei(nativeValue || "0"), toWei(contractBalance || "0"), contractTokenBalance || 0n]
      : [toWei(tokenValue || "0"), contractTokenBalance || 0n, toWei(contractBalance || "0")],
  });

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
      if (currentFrom === "native") {
        const transaction = prepareContractCall({
          contract: dexContract,
          method: "function swapEthToToken() payable",
          params: [],
          value: toWei(nativeValue || "0"),
        });
        await sendTransaction(transaction);
        alert("Swap executed successfully");
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
        await sendTransaction(swapTransaction);
        alert("Swap executed successfully");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while trying to execute the swap");
    } finally {
      setIsLoading(false);
    }
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
          <SwapInput
            current={currentFrom}
            type="native"
            max={nativeBalance?.displayValue}
            value={nativeValue}
            setValue={setNativeValue}
            tokenSymbol="ETH"
            tokenBalance={nativeBalance?.displayValue}
          />
          <div className="flex justify-center">
            <button
              onClick={() => setCurrentFrom(currentFrom === "native" ? "token" : "native")}
              className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-all duration-300 transform hover:scale-110"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
          <SwapInput
            current={currentFrom}
            type="token"
            max={tokenBalance ? toEther(tokenBalance) : "0"}
            value={tokenValue}
            setValue={setTokenValue}
            tokenSymbol={symbol || "TOKEN"}
            tokenBalance={tokenBalance ? toEther(tokenBalance) : "0"}
          />
        </div>
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
                  Loading...
                </span>
              ) : (
                "Swap"
              )}
            </button>
          ) : (
            <p className="text-gray-400">Connect wallet to exchange.</p>
          )}
        </div>
      </div>
    </main>
  );
};

export default Home;