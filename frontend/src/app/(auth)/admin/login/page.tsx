"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { adminLogin } from "@/services/authApiService";
import { login } from "@/redux/slices/adminAuthSlice";

// ChainVerse Logo Component
const ChainVerseLogo = ({ className }: { className?: string }) => (
  <div className={`flex items-center ${className}`}>
    <div className="h-8 w-8 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
      <div className="h-4 w-4 bg-white rounded-sm" />
    </div>
    <div className="ml-2 text-2xl font-bold text-white">
      Chain<span className="text-cyan-400">Verse</span>
    </div>
  </div>
);

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await adminLogin(email, password);
    if (response.success) {
      dispatch(login({ admin: response.admin, token: response.token })); // Store admin data and token
      toast({
        title: "Login Successful",
        description: response.message || "Welcome to the ChainVerse Admin Portal",
        className: "bg-green-600 text-white",
      });
      router.push("/admin");
    } else {
      throw new Error(response.error || "Invalid email or password");
    }
  } catch (error: any) {
    toast({
      title: "Login Failed",
      description: error.message || "Invalid email or password",
      variant: "destructive",
      className: "bg-red-600 text-white",
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center space-y-4">
          <ChainVerseLogo className="justify-center" />
          <CardTitle className="text-2xl font-bold text-white">ChainVerse Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cyan-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@chainverse.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-700 text-white border-slate-600 focus:border-cyan-400"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cyan-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-slate-700 text-white border-slate-600 focus:border-cyan-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-cyan-400 hover:bg-cyan-500 text-black font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400">
              Forgot password?{" "}
              <a href="/admin/forgot-password" className="text-cyan-400 hover:underline">
                Reset here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}