import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NavbarT } from "@/components/trade/Navbar";
import Navbar from "@/components/home/navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
    <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
        <NavbarT />
        <main>{children}</main>
      </div>
    </>
  );
}
