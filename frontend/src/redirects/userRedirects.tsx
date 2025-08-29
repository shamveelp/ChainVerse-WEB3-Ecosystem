"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user, loading } = useSelector((state: RootState) => state.userAuth);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for loading to complete before checking auth state
    if (!loading) {
      if (!user) {
        router.replace("/user/login");
      }
      setIsChecking(false);
    }
  }, [user, loading, router]);

  if (isChecking || loading || !user) return null;

  return <>{children}</>;
};

export const PreventLoggedIn = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.userAuth);

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  if (user) return null;

  return <>{children}</>;
};