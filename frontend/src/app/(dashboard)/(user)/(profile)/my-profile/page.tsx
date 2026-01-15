"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Phone, Mail, Calendar, Flame } from "lucide-react";
import { format, isValid } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { setProfile, setLoading as setProfileLoading, setError, clearError, clearProfileData } from "@/redux/slices/userProfileSlice";
import { logout } from "@/redux/slices/userAuthSlice";
import { userApiService } from "@/services/userApiServices";
import EditProfileModal from "@/components/user/profile/edit-profile-modal";

export default function MyProfilePage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { profile, loading, error } = useSelector((state: RootState) => state.userProfile);
  const { user } = useSelector((state: RootState) => state.userAuth);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        router.replace("/user/login");
        return;
      }
      dispatch(setProfileLoading(true));
      try {
        const response = await userApiService.getProfile();
        // Validate date fields
        if (response.data.createdAt && !isValid(new Date(response.data.createdAt))) {
          throw new Error("Invalid createdAt date format");
        }
        if (response.data.dailyCheckin?.lastCheckIn && !isValid(new Date(response.data.dailyCheckin.lastCheckIn))) {
          throw new Error("Invalid lastCheckIn date format");
        }
        dispatch(setProfile(response.data));
        dispatch(clearError());
      } catch (error) {
        const err = error as Error & { response?: { status?: number } };
        const errorMessage = err.message || "Failed to fetch profile";
        dispatch(setError(errorMessage));
        toast.error("Error loading profile", { description: errorMessage });
        if (errorMessage.includes("not authenticated") || err.response?.status === 401) {
          dispatch(logout());
          dispatch(clearProfileData()); // Clear profile on logout
          router.replace("/user/login");
        } else if (retryCount < 3) {
          // Retry up to 3 times with exponential backoff
          setTimeout(() => setRetryCount(retryCount + 1), 1000 * Math.pow(2, retryCount));
        }
      } finally {
        dispatch(setProfileLoading(false));
      }
    }
    fetchProfile();
  }, [dispatch, user, router, retryCount]);

  if (loading) return <ProfileSkeleton />;
  if (error) {
    return (
      <div className="text-red-500 text-center">
        {error}
        <button
          className="ml-4 text-blue-400 underline"
          onClick={() => {
            dispatch(clearError());
            setRetryCount(0); // Reset retry count
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Validate profile data before rendering
  const formattedJoinDate = profile?.createdAt && isValid(new Date(profile.createdAt))
    ? format(new Date(profile.createdAt), "MMM yyyy")
    : "Unknown";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 ring-2 ring-white/10">
              <AvatarImage src={profile?.profilePic || "/placeholder.svg"} alt={profile?.name || profile?.username || "User"} />
              <AvatarFallback className="text-2xl bg-slate-700 text-white">
                {profile?.name?.charAt(0)?.toUpperCase() || profile?.username?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{profile?.name || profile?.username || "Unknown"}</h1>
                <Badge className="bg-white/5 border border-white/10 text-white hover:bg-white/10">@{profile?.username || "N/A"}</Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                {profile?.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-white" />
                    {profile.email}
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-white" />
                    {profile.phone}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-white" />
                  Joined {formattedJoinDate}
                </div>
              </div>
            </div>

            <EditProfileModal />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-8 w-8 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white">{profile?.dailyCheckin?.streak || 0}</div>
            <div className="text-sm text-slate-400">Day Streak</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-slate-400">Full Name</Label>
              <p className="text-sm text-white">{profile?.name || "Not provided"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-400">Username</Label>
              <p className="text-sm text-white">@{profile?.username || "Not provided"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-400">Email</Label>
              <p className="text-sm text-white">{profile?.email || "Not provided"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-400">Phone</Label>
              <p className="text-sm text-white">{profile?.phone || "Not provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full bg-slate-700" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48 bg-slate-700" />
              <Skeleton className="h-4 w-32 bg-slate-700" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-40 bg-slate-700" />
                <Skeleton className="h-4 w-32 bg-slate-700" />
              </div>
            </div>
            <Skeleton className="h-10 w-32 bg-slate-700" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30">
          <CardContent className="p-4 text-center">
            <Skeleton className="h-8 w-8 mx-auto mb-2 bg-slate-700" />
            <Skeleton className="h-8 w-16 mx-auto mb-1 bg-slate-700" />
            <Skeleton className="h-4 w-24 mx-auto bg-slate-700" />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30">
        <CardHeader>
          <Skeleton className="h-6 w-40 bg-slate-700" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-1 bg-slate-700" />
                <Skeleton className="h-4 w-32 bg-slate-700" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}