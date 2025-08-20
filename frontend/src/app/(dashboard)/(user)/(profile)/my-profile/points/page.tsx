import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import DailyCheckinCalendar from "@/components/user/profile/daily-checkin-calendar"
import { Trophy, Gift, TrendingUp, Crown, Star, Zap, Sparkles } from "lucide-react"

// Mock points history data
const pointsHistory = [
  { id: 1, action: "Daily Check-in", points: 10, date: "2024-01-15", type: "earned" },
  { id: 2, action: "Quest Completed: DeFi Explorer", points: 50, date: "2024-01-14", type: "earned" },
  { id: 3, action: "Referral Bonus", points: 100, date: "2024-01-13", type: "earned" },
  { id: 4, action: "Redeemed: Premium Badge", points: -200, date: "2024-01-12", type: "redeemed" },
  { id: 5, action: "Trading Activity Bonus", points: 25, date: "2024-01-11", type: "earned" },
  { id: 6, action: "Daily Check-in", points: 10, date: "2024-01-10", type: "earned" },
  { id: 7, action: "Community Participation", points: 30, date: "2024-01-09", type: "earned" },
  { id: 8, action: "Quest Completed: NFT Hunter", points: 75, date: "2024-01-08", type: "earned" },
]

const redeemableRewards = [
  { id: 1, name: "Premium Badge", cost: 200, description: "Exclusive profile badge", icon: Crown, rarity: "Common" },
  {
    id: 2,
    name: "Trading Fee Discount",
    cost: 500,
    description: "10% off trading fees for 30 days",
    icon: Zap,
    rarity: "Rare",
  },
  {
    id: 3,
    name: "VIP Support Access",
    cost: 1000,
    description: "Priority customer support",
    icon: Star,
    rarity: "Epic",
  },
  {
    id: 4,
    name: "Exclusive NFT",
    cost: 2000,
    description: "Limited edition ChainVerse NFT",
    icon: Sparkles,
    rarity: "Legendary",
  },
]

const rarityColors = {
  Common: "from-gray-400 to-gray-500",
  Rare: "from-blue-400 to-blue-500",
  Epic: "from-purple-400 to-purple-500",
  Legendary: "from-yellow-400 to-orange-500",
}

export default function PointsPage() {
  const totalPoints = 15420
  const currentPage = 1
  const totalPages = 3

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Points</h1>
      </div>

      {/* Points Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Total Points</h2>
                  <p className="text-slate-600 dark:text-slate-400">Your lifetime earnings</p>
                </div>
              </div>
              <div className="text-4xl font-bold text-slate-900 dark:text-white">{totalPoints.toLocaleString()}</div>
              <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                <Crown className="h-3 w-3 mr-1" />
                Rank #247
              </Badge>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Gift className="h-4 w-4 mr-2" />
              Redeem Points
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 text-center">
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">+150</div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Points this week</p>
          <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full w-3/4"></div>
          </div>
        </div>
      </div>

      {/* Compact Daily Check-in */}
      <DailyCheckinCalendar />

      {/* Points History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Points History</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {pointsHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${entry.type === "earned" ? "bg-green-500" : "bg-red-500"}`} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{entry.action}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">{entry.date}</p>
                  </div>
                </div>
                <Badge variant={entry.type === "earned" ? "default" : "destructive"} className="text-xs">
                  {entry.type === "earned" ? "+" : ""}
                  {entry.points}
                </Badge>
              </div>
            ))}
          </div>

          {/* Simple Pagination */}
          <div className="flex items-center justify-center space-x-2 mt-6">
            <Button variant="outline" size="sm" disabled={currentPage === 1}>
              Previous
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={currentPage as any === totalPages}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
