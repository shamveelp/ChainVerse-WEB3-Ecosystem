"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Trophy, Users, CheckSquare } from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  {
    title: "My Profile",
    href: "/my-profile",
    icon: User,
  },
  {
    title: "Points",
    href: "/my-profile/points",
    icon: Trophy,
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

  return (
    <div className="w-64 bg-slate-800/50 backdrop-blur-md border-r border-blue-800/30 h-screen fixed top-0 left-0 shadow-lg shadow-blue-500/10">
      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Profile
          </h2>
          <p className="text-sm text-slate-400 mt-1"></p>
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
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:shadow-blue-500/20",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>

        {/* Stats Card */}
        <div className="mt-6 p-4 bg-slate-900/30 rounded-lg border border-blue-800/30">
          <h3 className="text-sm font-medium text-white mb-3">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Level</span>
              <span className="font-semibold text-white">12</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Rank</span>
              <span className="font-semibold text-blue-400">#247</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full w-3/4 transition-all duration-500"></div>
            </div>
            <p className="text-xs text-slate-400 text-center">75% to next level</p>
          </div>
        </div>
      </div>
    </div>
  )
}