"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  X,
  Home,
  Package,
  Mail,
  Users,
  PanelLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { isAdminNavActive } from "@/lib/admin/navActive";
import { useSidebarItems } from "@/lib/hooks/useSidebarItems";
import SiteBranding from "@/components/SiteBranding";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
}

function getIcon(label: string, href: string) {
  const key = `${label} ${href}`.toLowerCase();
  if (key.includes("user")) return Users;
  if (key.includes("product")) return Package;
  if (key.includes("enquir")) return Mail;
  if (key.includes("sidebar") || key.includes("menu")) return PanelLeft;
  if (key.includes("dashboard")) return LayoutDashboard;
  if (key.includes("setting")) return Settings;
  return Home;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { items: menuItems, loading } = useSidebarItems("admin");

  useEffect(() => {
    const activeParent = menuItems.find(
      (item) =>
        item.children?.some((child) => isAdminNavActive(pathname, child.href)) ||
        (item.href && isAdminNavActive(pathname, item.href))
    );
    if (activeParent?.label) {
      setOpenMenu(activeParent.label);
    }
  }, [pathname, menuItems]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      window.location.href = ROUTES.login;
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-screen w-[250px] bg-surface border-r border-border text-foreground transition-all duration-300 flex flex-col overflow-hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} `}
    >
      <button
        type="button"
        onClick={() => setSidebarOpen(false)}
        className="lg:hidden absolute top-4 right-4 w-[34px] h-[34px] rounded-lg bg-surface-elevated border border-border flex items-center justify-center"
      >
        <X size={16} />
      </button>

      <div className="sticky top-0 z-20 bg-surface border-b border-border px-4 py-5 shrink-0">
        <SiteBranding
          href={ROUTES.admin.dashboard}
          titleClassName="text-[28px] font-black leading-[30px]"
          taglineClassName="text-[14px] tracking-[5px] font-semibold"
          logoClassName="h-10 w-10 object-contain"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto py-3 scrollbar-none">
        <ul className="space-y-1 text-[14px] px-2">
          {loading && menuItems.length === 0 ? (
            <li className="px-3 py-3 text-muted text-sm">Loading menu...</li>
          ) : null}

          {!loading && menuItems.length === 0 ? (
            <li className="px-3 py-3 text-muted text-sm">
              No admin menu items. Add them in Sidebar Management.
            </li>
          ) : null}

          {menuItems.map((item) => {
            const Icon = getIcon(item.label, item.href);
            const hasSubmenu = item.children && item.children.length > 0;
            const itemActive = item.href ? isAdminNavActive(pathname, item.href) : false;
            const submenuActive = hasSubmenu
              ? item.children!.some((subItem) => isAdminNavActive(pathname, subItem.href))
              : false;
            const isOpen = openMenu === item.label || submenuActive;

            return (
              <li key={item.id}>
                {hasSubmenu ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setOpenMenu(openMenu === item.label ? null : item.label)}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 ${submenuActive ? "bg-surface-elevated" : "hover:bg-surface-elevated"}`}
                    >
                      <div className="flex items-center gap-4">
                        <Icon size={15} className={submenuActive ? "text-foreground" : "text-muted"} />
                        <span className={`${submenuActive ? "text-foreground font-medium" : "text-muted"} text-[14px]`}>
                          {item.label}
                        </span>
                      </div>
                      {isOpen ? (
                        <ChevronDown size={14} className="text-muted" />
                      ) : (
                        <ChevronRight size={14} className="text-muted" />
                      )}
                    </button>

                    {isOpen && (
                      <ul className="mt-1 ml-7 space-y-1">
                        {item.children?.map((subItem) => {
                          const active = isAdminNavActive(pathname, subItem.href);
                          return (
                            <li key={subItem.id}>
                              <Link
                                href={subItem.href}
                                className={`block w-full px-3 py-2 rounded-lg text-[13px] transition-all ${
                                  active
                                    ? "bg-primary text-white"
                                    : "text-muted hover:bg-surface-elevated hover:text-foreground"
                                }`}
                              >
                                {subItem.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 group ${itemActive ? "bg-primary text-white" : "hover:bg-surface-elevated"}`}
                  >
                    <div className="flex items-center gap-4">
                      <Icon size={15} className={itemActive ? "text-white" : "text-muted"} />
                      <span className={`${itemActive ? "text-white" : "text-muted"} text-[14px]`}>
                        {item.label}
                      </span>
                    </div>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sticky bottom-0 bg-surface border-t border-border p-3 shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className="text-danger text-[14px] flex items-center gap-3 hover:bg-surface-elevated px-3 py-3 rounded-xl w-full transition-all"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  );
}
