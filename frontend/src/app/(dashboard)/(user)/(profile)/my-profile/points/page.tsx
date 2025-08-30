"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Coins, 
  Calendar as CalendarIcon, 
  Gift, 
  Trophy,
  Flame,
  TrendingUp,
  Clock,
  CheckCircle,
  Target
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { userApiService } from "@/services/userApiServices";
import { format, isSameDay } from "date-fns";

interface CheckInStatus {
  hasCheckedInToday: boolean;
  currentStreak: number;
  nextCheckInAvailable: Date | null;
}

interface CheckInCalendarData {
  date: string;
  points: number;
  streakCount: number;
}

interface PointsHistoryItem {
  _id: string;
  type: string;
  points: number;
  description: string;
  createdAt: string;
}

export default function PointsPage() {
  const { profile } = useSelector((state: RootState) => state.userProfile);
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null);
  const [checkInCalendar, setCheckInCalendar] = useState<CheckInCalendarData[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryItem[]>([]);
  const [pointsSummary, setPointsSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  useEffect(() => {
    fetchCheckInStatus();
    fetchCheckInCalendar(new Date().getMonth() + 1, new Date().getFullYear());
    fetchPointsHistory(1);
  }, []);

  const fetchCheckInStatus = async () => {
    try {
      const result = await userApiService.getCheckInStatus();
      if (result.success) {
        setCheckInStatus(result.data!);
      } else {
        toast.error("Failed to load check-in status");
      }
    } catch (error) {
      toast.error("Error loading check-in data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckInCalendar = async (month: number, year: number) => {
    try {
      const result = await userApiService.getCheckInCalendar(month, year);
      if (result.success) {
        setCheckInCalendar(result.data.checkIns);
      }
    } catch (error) {
      console.error("Error fetching calendar:", error);
    }
  };

  const fetchPointsHistory = async (page: number) => {
    try {
      const result = await userApiService.getPointsHistory(page, 10);
      if (result.success) {
        if (page === 1) {
          setPointsHistory(result.data.history);
        } else {
          setPointsHistory(prev => [...prev, ...result.data.history]);
        }
        setPointsSummary(result.data.summary);
        setHistoryTotal(result.data.total);
      }
    } catch (error) {
      toast.error("Error loading points history");
    }
  };

  const performDailyCheckIn = async () => {
    try {
      setCheckingIn(true);
      const result = await userApiService.performDailyCheckIn();
      if (result.success) {
        toast.success("Daily Check-in Complete!", {
          description: result.data?.message,
        });
        // Refresh data
        await fetchCheckInStatus();
        await fetchCheckInCalendar(new Date().getMonth() + 1, new Date().getFullYear());
        await fetchPointsHistory(1);
      } else {
        toast.error("Check-in Failed", { description: result.error });
      }
    } catch (error) {
      toast.error("Error performing check-in");
    } finally {
      setCheckingIn(false);
    }
  };

  const getPointTypeIcon = (type: string) => {
    switch (type) {
      case 'daily_checkin':
        return <CalendarIcon className="h-4 w-4 text-blue-400" />;
      case 'referral_bonus':
        return <Gift className="h-4 w-4 text-green-400" />;
      case 'quest_reward':
        return <Target className="h-4 w-4 text-purple-400" />;
      case 'bonus':
        return <Trophy className="h-4 w-4 text-yellow-400" />;
      default:
        return <Coins className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPointTypeColor = (type: string) => {
    switch (type) {
      case 'daily_checkin':
        return 'bg-blue-900/50 text-blue-300';
      case 'referral_bonus':
        return 'bg-green-900/50 text-green-300';
      case 'quest_reward':
        return 'bg-purple-900/50 text-purple-300';
      case 'bonus':
        return 'bg-yellow-900/50 text-yellow-300';
      case 'deduction':
        return 'bg-red-900/50 text-red-300';
      default:
        return 'bg-gray-900/50 text-gray-300';
    }
  };

  const isCheckInDay = (date: Date) => {
    return checkInCalendar.some(checkIn => isSameDay(new Date(checkIn.date), date));
  };

  if (loading) {
    return <PointsSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
          Points & Rewards
        </h1>
        <div className="text-6xl font-bold text-white">
          {profile?.totalPoints || 0}
        </div>
        <p className="text-slate-400">Total Points Earned</p>
      </div>

      {/* Daily Check-in Card */}
      <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md border-blue-800/30 shadow-lg shadow-blue-500/10">
        <CardHeader>
          <CardTitle className="text-white text-xl flex items-center gap-3">
            <Flame className="h-6 w-6 text-orange-400" />
            Daily Check-in
            <Badge className="bg-orange-900/50 text-orange-300">
              {checkInStatus?.currentStreak || 0} Day Streak
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            {checkInStatus?.hasCheckedInToday ? (
              <div className="space-y-4">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
                <div>
                  <h3 className="text-xl font-bold text-white">Already Checked In!</h3>
                  <p className="text-slate-400">Come back tomorrow for your next 10 points</p>
                  {checkInStatus.nextCheckInAvailable && (
                    <p className="text-sm text-blue-400 mt-2">
                      Next check-in available: {format(new Date(checkInStatus.nextCheckInAvailable), "MMM dd, yyyy")}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Clock className="h-16 w-16 text-blue-400 mx-auto" />
                <div>
                  <h3 className="text-xl font-bold text-white">Ready to Check In!</h3>
                  <p className="text-slate-400 mb-4">Claim your daily 10 points</p>
                  <Button
                    onClick={performDailyCheckIn}
                    disabled={checkingIn}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-3 rounded-lg shadow-lg"
                  >
                    {checkingIn ? "Checking In..." : "Check In Now"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full bg-slate-800/50">
          <TabsTrigger value="calendar" className="text-slate-300 data-[state=active]:text-white">
            Check-in Calendar
          </TabsTrigger>
          <TabsTrigger value="history" className="text-slate-300 data-[state=active]:text-white">
            Points History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30">
            <CardHeader>
              <CardTitle className="text-white">Check-in Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border-slate-700"
                  modifiers={{
                    checkedIn: (date: any) => isCheckInDay(date),
                  }}
                  modifiersStyles={{
                    checkedIn: { 
                      backgroundColor: 'rgb(34 197 94)', 
                      color: 'white',
                      fontWeight: 'bold'
                    },
                  }}
                />
              </div>
              <div className="mt-6 flex justify-center">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-slate-300">Checked In</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                    <span className="text-slate-300">Not Checked In</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30">
            <CardHeader>
              <CardTitle className="text-white">Points History</CardTitle>
            </CardHeader>
            <CardContent>
              {pointsHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Coins className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-slate-300 mb-2">No Points History</h3>
                  <p className="text-slate-400">Start checking in daily to earn points!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Points Summary */}
                  {pointsSummary && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <div className="bg-blue-900/30 rounded-lg p-3 text-center">
                        <div className="text-sm text-blue-300">Daily Check-in</div>
                        <div className="font-bold text-white">{pointsSummary.pointsByType.daily_checkin}</div>
                      </div>
                      <div className="bg-green-900/30 rounded-lg p-3 text-center">
                        <div className="text-sm text-green-300">Referrals</div>
                        <div className="font-bold text-white">{pointsSummary.pointsByType.referral_bonus}</div>
                      </div>
                      <div className="bg-purple-900/30 rounded-lg p-3 text-center">
                        <div className="text-sm text-purple-300">Quests</div>
                        <div className="font-bold text-white">{pointsSummary.pointsByType.quest_reward}</div>
                      </div>
                      <div className="bg-yellow-900/30 rounded-lg p-3 text-center">
                        <div className="text-sm text-yellow-300">Bonus</div>
                        <div className="font-bold text-white">{pointsSummary.pointsByType.bonus}</div>
                      </div>
                      <div className="bg-red-900/30 rounded-lg p-3 text-center">
                        <div className="text-sm text-red-300">Deductions</div>
                        <div className="font-bold text-white">-{pointsSummary.pointsByType.deduction}</div>
                      </div>
                    </div>
                  )}

                  {/* History List */}
                  <div className="space-y-3">
                    {pointsHistory.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/50 hover:bg-slate-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-800 rounded-lg">
                            {getPointTypeIcon(item.type)}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{item.description}</h4>
                            <p className="text-slate-400 text-sm">
                              {format(new Date(item.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${getPointTypeColor(item.type)} font-mono`}>
                            {item.points > 0 ? '+' : ''}{item.points}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {pointsHistory.length < historyTotal && (
                    <div className="text-center pt-4">
                      <Button
                        onClick={() => {
                          fetchPointsHistory(historyPage + 1);
                          setHistoryPage(prev => prev + 1);
                        }}
                        variant="outline"
                        className="border-blue-800/30 text-blue-300 hover:bg-blue-700/20"
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PointsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-64 mx-auto bg-slate-700" />
        <Skeleton className="h-16 w-32 mx-auto bg-slate-700" />
        <Skeleton className="h-6 w-40 mx-auto bg-slate-700" />
      </div>

      <Card className="bg-slate-800/50">
        <CardHeader>
          <Skeleton className="h-6 w-48 bg-slate-700" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-32 w-full bg-slate-700" />
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions (keeping them outside component for performance)
function getPointTypeIcon(type: string) {
  switch (type) {
    case 'daily_checkin':
      return <CalendarIcon className="h-4 w-4 text-blue-400" />;
    case 'referral_bonus':
      return <Gift className="h-4 w-4 text-green-400" />;
    case 'quest_reward':
      return <Target className="h-4 w-4 text-purple-400" />;
    case 'bonus':
      return <Trophy className="h-4 w-4 text-yellow-400" />;
    default:
      return <Coins className="h-4 w-4 text-gray-400" />;
  }
}

function getPointTypeColor(type: string) {
  switch (type) {
    case 'daily_checkin':
      return 'bg-blue-900/50 text-blue-300';
    case 'referral_bonus':
      return 'bg-green-900/50 text-green-300';
    case 'quest_reward':
      return 'bg-purple-900/50 text-purple-300';
    case 'bonus':
      return 'bg-yellow-900/50 text-yellow-300';
    case 'deduction':
      return 'bg-red-900/50 text-red-300';
    default:
      return 'bg-gray-900/50 text-gray-300';
  }
}