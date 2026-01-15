import { ProtectedRoute } from "@/redirects/userRedirects";
import Navbar from "@/components/home/navbar";
import ProfileSidebar from "@/components/user/profile/profile-sidebar";
import MobileBottomNav from "@/components/user/profile/mobile-bottom-nav";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar />
        </div>
        <div className="flex pt-16">
          <ProfileSidebar />
          <main className="flex-1 lg:ml-80 min-h-screen pb-20 lg:pb-0">
            <div className="container mx-auto px-4 lg:px-8 py-8 max-w-7xl">
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 min-h-[calc(100vh-8rem)] p-4 lg:p-8">
                {children}
              </div>
            </div>
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </ProtectedRoute>
  );
};