import { ProtectedRoute } from "@/redirects/userRedirects";
import Navbar from "@/components/home/navbar";
import ProfileSidebar from "@/components/user/profile/profile-sidebar";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar />
        </div>
        <div className="flex pt-16">
          <ProfileSidebar />
          <main className="flex-1 ml-80 min-h-screen">
            <div className="container mx-auto px-8 py-8 max-w-7xl">
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 min-h-[calc(100vh-8rem)] p-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};