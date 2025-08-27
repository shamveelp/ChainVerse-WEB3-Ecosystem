"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Phone, Mail, Calendar, Flame } from "lucide-react";
import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { setProfile, setLoading as setProfileLoading, setError } from "@/redux/slices/userProfileSlice";
import { logout } from "@/redux/slices/userAuthSlice";
import { userApiService } from "@/services/userApiServices";
import EditProfileModal from "@/components/user/profile/edit-profile-modal";

export default function MyProfilePage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { profile, loading, error } = useSelector((state: RootState) => state.userProfile);
  const { token } = useSelector((state: RootState) => state.userAuth);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      dispatch(setError("User not authenticated"));
      toast.error("Please log in to view your profile");
      router.replace("/user/login");
    }
  }, [dispatch, token, router]);

  async function fetchProfile() {
    dispatch(setProfileLoading(true));
    try {
      const response = await userApiService.getProfile();
      dispatch(setProfile(response.data));
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch profile";
      dispatch(setError(errorMessage));
      toast.error("Error loading profile", {
        description: errorMessage,
      });
      if (errorMessage.includes("not authenticated")) {
        dispatch(logout());
        router.replace("/user/login");
      }
    } finally {
      dispatch(setProfileLoading(false));
    }
  }

  if (loading) return <ProfileSkeleton />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30 shadow-lg shadow-blue-500/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 ring-2 ring-blue-500/30">
              <AvatarImage src={profile?.profilePic || "/placeholder.svg"} alt={profile?.name} />
              <AvatarFallback className="text-2xl bg-slate-700 text-white">
                {profile?.name?.charAt(0)?.toUpperCase() || profile?.username?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{profile?.name || profile?.username || "Unknown"}</h1>
                <Badge className="bg-blue-900/50 text-blue-300 hover:bg-blue-900/70">@{profile?.username || "N/A"}</Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                {profile?.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-blue-400" />
                    {profile.email}
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-blue-400" />
                    {profile.phone}
                  </div>
                )}
                {profile?.createdAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    Joined {format(new Date(profile.createdAt), "MMM yyyy")}
                  </div>
                )}
              </div>
            </div>

            <EditProfileModal />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30 shadow-md hover:shadow-blue-500/20 transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-8 w-8 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white">{profile?.dailyCheckin?.streak || 0}</div>
            <div className="text-sm text-slate-400">Day Streak</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 backdrop-blur-md border-blue-800/30 shadow-lg shadow-blue-500/10">
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