"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Trophy, Users, CheckSquare, Coins } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"

const sidebarItems = [
  {
    title: "My Profile",
    href: "/my-profile",
    icon: User,
  },
  {
    title: "Points",
    href: "/my-profile/points",
    icon: Coins,
  },
  {
    title: "Refer a Friend",
    href: "/my-profile/refer",
    icon: Users,
  },
  {
    title: "Quests Completed",
    href: "/my-profile/quests",
    icon: CheckSquare,
  },
]

export default function ProfileSidebar() {
  const pathname = usePathname()
  const { profile } = useSelector((state: RootState) => state.userProfile)

  return (
    <div className="hidden lg:block w-80 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 h-screen fixed top-0 left-0 pt-16">
      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white">
            Profile
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage your account</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-white text-black shadow-lg"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>

        {/* Stats Card */}
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-white/10">
          <h3 className="text-sm font-medium text-white mb-3">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Total Points</span>
              <span className="font-semibold text-yellow-400">{profile?.totalPoints || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Current Streak</span>
              <span className="font-semibold text-orange-400">{profile?.dailyCheckin?.streak || 0} days</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Level</span>
              <span className="font-semibold text-blue-400">
                {Math.floor((profile?.totalPoints || 0) / 100) + 1}
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${((profile?.totalPoints || 0) % 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 text-center">
              {100 - ((profile?.totalPoints || 0) % 100)} points to next level
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}