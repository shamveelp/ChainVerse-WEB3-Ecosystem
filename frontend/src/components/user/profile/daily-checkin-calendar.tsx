"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CheckCircle, Coins, Calendar, Flame } from "lucide-react"

const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"]
const monthDays = Array.from({ length: 30 }, (_, i) => i + 1)
const checkedInDays = [1, 2, 3, 5, 8, 10, 12, 15, 18, 20, 22, 25, 28]

export default function DailyCheckinCalendar() {
  const [showCoinAnimation, setShowCoinAnimation] = useState(false)
  const [todayCheckedIn, setTodayCheckedIn] = useState(false)
  const today = 29

  const handleCheckin = () => {
    setShowCoinAnimation(true)
    setTodayCheckedIn(true)
    setTimeout(() => setShowCoinAnimation(false), 2000)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
      {/* Compact Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Daily Check-in</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Earn 10 points daily</p>
            </div>
          </div>
          <Button
            onClick={handleCheckin}
            disabled={todayCheckedIn}
            size="sm"
            className={cn(todayCheckedIn ? "bg-green-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700")}
          >
            <Coins className="h-3 w-3 mr-1" />
            {todayCheckedIn ? "Done" : "Check In"}
          </Button>
        </div>
      </div>

      {/* Coin Animation */}
      {showCoinAnimation && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
              <Coins className="h-6 w-6 text-white animate-spin" />
            </div>
            <p className="text-sm font-semibold text-white">+10 Points!</p>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Compact Calendar Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 p-1">
              {day}
            </div>
          ))}
        </div>

        {/* Compact Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {monthDays.map((day) => {
            const isCheckedIn = checkedInDays.includes(day) || (day === today && todayCheckedIn)
            const isToday = day === today

            return (
              <div
                key={day}
                className={cn(
                  "aspect-square flex items-center justify-center rounded text-xs font-medium transition-colors relative",
                  isToday && "ring-1 ring-blue-500",
                  isCheckedIn
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400",
                )}
              >
                {day}
                {isCheckedIn && (
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-2 w-2 text-white" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Compact Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">7</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Streak</p>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{checkedInDays.length}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">This Month</p>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Coins className="h-3 w-3 text-yellow-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">+{checkedInDays.length * 10}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Earned</p>
          </div>
        </div>
      </div>
    </div>
  )
}
