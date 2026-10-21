"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useSidebarItems } from "@/lib/hooks/useSidebarItems";

export interface SidebarNavItem {
  id: number;
  label: string;
  href: string;
  children?: SidebarNavItem[];
}

interface DynamicNavProps {
  section?: "navbar" | "footer" | "footer_service" | "products_sidebar" | "admin";
  fallback?: SidebarNavItem[];
  variant?: "navbar" | "sidebar";
  onNavigate?: () => void;
}

export default function DynamicNav({
  section = "navbar",
  fallback = [],
  variant = "navbar",
  onNavigate,
}: DynamicNavProps) {
  const { items } = useSidebarItems(section, fallback);

  if (variant === "sidebar") {
    return (
      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className="block rounded-xl px-3 py-3 text-sm text-muted transition hover:bg-surface-elevated hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <>
      {items.map((item) =>
        item.children && item.children.length > 0 ? (
          <div key={item.id} className="relative group">
            <button
              type="button"
              className="px-2 lg:px-4 py-2 text-xs lg:text-sm hover:text-primary transition flex items-center gap-1 whitespace-nowrap"
            >
              {item.label}
              <ChevronDown size={14} />
            </button>
            <div className="absolute left-0 top-full w-52 rounded border border-border bg-surface shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {item.children.map((child) => (
                <Link key={child.id} href={child.href} onClick={onNavigate}>
                  <div className="px-4 py-3 text-sm text-foreground hover:bg-primary hover:text-white">
                    {child.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className="px-2 lg:px-4 py-2 text-xs lg:text-sm hover:text-primary transition whitespace-nowrap"
          >
            {item.label}
          </Link>
        )
      )}
    </>
  );
}
