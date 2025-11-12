import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/home-002/EcommerceMetrics";
import React from "react";
import MonthlyTarget from "@/components/home-002/MonthlyTarget";
import MonthlySalesChart from "@/components/home-002/MonthlySalesChart";
import StatisticsChart from "@/components/home-002/StatisticsChart";
import RecentOrders from "@/components/home-002/RecentOrders";
import DemographicCard from "@/components/home-002/DemographicCard";

export const metadata: Metadata = {
  title:
    "ChainVerse Admin Dashboard",
  description: "This is ChainVerse Home for Admin Dashboard",
};

export default function AdminDashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics />

        <MonthlySalesChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div>

      <div className="col-span-12">
        <StatisticsChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <DemographicCard />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <RecentOrders />
      </div>
    </div>
  );
}
