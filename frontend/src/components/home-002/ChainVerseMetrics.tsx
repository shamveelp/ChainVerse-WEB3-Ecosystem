"use client";
import React, { useEffect, useState } from "react";
// import Badge from "../ui/badge/Badge"; // Badge not used if we remove percentages
import {
  Users,
  Wallet,
  Rocket,
  Tag
} from "lucide-react";
import { getDashboardStats } from "@/services/admin/adminDashbaordApiService";
import { useNFTContract } from "@/hooks/nft/useNFTContract";

export const ChainVerseMetrics = () => {
  const [stats, setStats] = useState({ usersCount: 0, walletsCount: 0 });
  const [nftStats, setNftStats] = useState({ totalTokens: 0, currentListings: 0 });
  const { getMarketplaceStats } = useNFTContract();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [data, marketplaceStats] = await Promise.all([
          getDashboardStats(),
          getMarketplaceStats()
        ]);
        setStats(data);
        setNftStats(marketplaceStats);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };
    fetchStats();
  }, [getMarketplaceStats]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* <!-- Users Metric --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <Users className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Users
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats.usersCount.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      {/* <!-- Wallets Metric --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <Wallet className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Wallets
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats.walletsCount.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      {/* <!-- Total NFT Metric --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <Rocket className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              NFTs Minted
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {nftStats.totalTokens.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      {/* <!-- Active Listing Metric --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <Tag className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Sale Listing
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {nftStats.currentListings.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};

