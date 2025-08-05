"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

// Only allow access if logged in
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.userAuth);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  if (!user) return null;

  return <>{children}</>;
};

// Redirect logged-in users away from login/signup pages
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


