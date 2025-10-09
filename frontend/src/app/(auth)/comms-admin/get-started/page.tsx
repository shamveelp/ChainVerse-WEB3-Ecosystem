"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Shield } from "lucide-react";
import { COMMUNITY_ADMIN_ROUTES, USER_ROUTES } from "@/routes";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#E0D9D9] text-[#432323] relative overflow-hidden px-6">
      {/* Soft Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E0D9D9] via-[#5A9690]/10 to-[#2F5755]/10" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#5A9690]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#432323]/20 rounded-full blur-3xl" />

      {/* Home Button */}
      <div className="absolute top-6 left-6 sm:left-10 z-10">
        <Button
          onClick={() => router.push(USER_ROUTES.COMMUNITY)}
          variant="outline"
          className="border border-[#2F5755]/30 text-[#2F5755] hover:bg-[#2F5755]/10 rounded-full px-5 py-2 text-sm sm:text-base font-semibold transition-all duration-300"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-3xl space-y-8 mt-10">
        {/* Heading */}
        <div className="space-y-4 mt-10">
          <h1 className="text-4xl md:text-5xl font-bold text-[#432323]">
            ChainVerse Community
          </h1>
          <p className="text-lg text-[#2F5755]/80 max-w-xl mx-auto leading-relaxed">
            Build, manage, and grow your Web3 community with smart tools —
            simplified like an e-learning platform.
          </p>
        </div>

        {/* Buttons Section */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 w-full max-w-2xl">
          {/* Create Community */}
          <Button
            onClick={() => router.push(COMMUNITY_ADMIN_ROUTES.CREATE_COMMUNITY)}
            className="bg-[#5A9690] hover:bg-[#2F5755] text-[#E0D9D9] font-semibold px-6 py-3 text-base rounded-full shadow-sm w-full sm:w-auto transition-all duration-300"
          >
            Create Community
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {/* Login — more visible */}
          <Button
            onClick={() => router.push(COMMUNITY_ADMIN_ROUTES.LOGIN)}
            className="bg-gradient-to-r from-[#2F5755] to-[#5A9690] hover:opacity-90 text-white font-semibold px-6 py-3 text-base rounded-full shadow-md w-full sm:w-auto transition-all duration-300"
          >
            <Shield className="h-4 w-4 mr-2" />
            Login
          </Button>
        </div>
      </div>
    </div>
  );
}
