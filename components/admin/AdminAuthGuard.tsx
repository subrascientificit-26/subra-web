"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/ui/LoadingState";
import { ROUTES } from "@/lib/routes";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          router.replace(ROUTES.login);
          return;
        }

        const data = await res.json();
        if (data.user?.role !== "admin") {
          router.replace(ROUTES.dashboard);
          return;
        }

        setAuthorized(true);
      })
      .catch(() => {
        router.replace(ROUTES.login);
      });
  }, [router]);

  if (!authorized) {
    return <LoadingState message="Verifying admin access..." fullScreen />;
  }

  return <>{children}</>;
}
