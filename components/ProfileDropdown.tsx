"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  Package,
  UserCircle,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { getDisplayName, getUserInitials, type ProfileUser } from "@/lib/user";

export default function ProfileDropdown() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Continue clearing client state
    }

    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setOpen(false);
    router.push(ROUTES.home);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="hidden md:flex flex-col items-center opacity-60">
        <span className="text-[10px] lg:text-xs">Account</span>
        <span className="text-xs lg:text-sm font-medium">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href={ROUTES.login}
        className="hidden md:flex flex-col items-center hover:text-primary transition"
      >
        <span className="text-[10px] lg:text-xs">Account</span>
        <span className="text-xs lg:text-sm font-medium">Login</span>
      </Link>
    );
  }

  const displayName = getDisplayName(user);
  const initials = getUserInitials(user);
  const dashboardHref =
    user.role === "admin" ? ROUTES.admin.dashboard : ROUTES.dashboard;

  return (
    <div ref={menuRef} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-surface-elevated transition"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {initials}
        </div>

        <div className="flex flex-col items-start leading-tight">
          <span className="text-[10px] text-muted">Welcome</span>
          <span className="text-xs lg:text-sm font-medium max-w-[120px] truncate">
            {displayName}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`text-muted transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-50 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <div className="border-t border-border p-2">
            <Link
              href={
                user.role === "admin"
                  ? `${ROUTES.admin.settings}?tab=profile`
                  : dashboardHref
              }
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-surface-elevated transition"
            >
              <UserCircle size={15} />
              View Full Profile
            </Link>

            <Link
              href={dashboardHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-surface-elevated transition"
            >
              <LayoutDashboard size={15} />
              My Dashboard
            </Link>

            <Link
              href={ROUTES.externalProducts}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-surface-elevated transition"
            >
              <Package size={15} />
              External Products
            </Link>

            {/* <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-slate-800 transition"
            >
              <LogOut size={15} />
              Logout
            </button> */}
          </div>
        </div>
      )}
    </div>
  );
}
