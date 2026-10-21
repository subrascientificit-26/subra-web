"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingCart,
  Search,
  LogOut,
  Menu,
  X,
  Home,
  LogIn,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ROUTES, buildSearchUrl } from "@/lib/routes";
import { PAGE_CONTAINER_CLASS } from "@/lib/layout";
import { useSidebarItems } from "@/lib/hooks/useSidebarItems";
import { useCart } from "@/components/CartProvider";
import ProfileDropdown from "@/components/ProfileDropdown";
import SiteBranding from "@/components/SiteBranding";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState("all");

  const { items: navItems } = useSidebarItems("navbar", []);
  const { count: cartCount } = useCart();

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => setIsLoggedIn(res.ok))
      .catch(() => setIsLoggedIn(false));
  }, []);

  const handleSearch = () => {
    router.push(buildSearchUrl(searchQuery, searchScope));
    setIsOpen(false);
  };

  const handleAuthAction = async () => {
    if (isLoggedIn) {
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
      setIsLoggedIn(false);
      router.push(ROUTES.home);
    } else {
      router.push(ROUTES.login);
    }
  };

  const isActiveLink = (href: string) => {
    if (!pathname) return false;
    if (href === ROUTES.home) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navLinkClass = (href: string) =>
    isActiveLink(href)
      ? "text-primary font-semibold"
      : "hover:text-primary transition";

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-surface text-foreground shadow-sm theme-light:shadow-md">
      <div className={PAGE_CONTAINER_CLASS}>
        <div className="flex items-center justify-between py-4 gap-4">
          <SiteBranding href={ROUTES.home} />

          <div className="hidden lg:flex items-center flex-1 max-w-3xl mx-4 gap-3">
            <div className="flex items-center flex-1 bg-surface-elevated border border-border rounded-md overflow-hidden h-11">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                placeholder="Search for products, CAS No., specification..."
                className="flex-1 px-4 h-full bg-surface-elevated text-foreground placeholder:text-muted text-sm focus:outline-none"
              />

                <select
                value={searchScope}
                onChange={(event) => setSearchScope(event.target.value)}
                className="bg-surface text-muted px-3 h-full text-sm border-l border-border outline-none"
              >
                <option value="all">All</option>
                <option value="products">Products</option>
                <option value="categories">Categories</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleSearch}
              className="bg-primary hover:bg-primary-hover text-white h-11 px-5 rounded-md transition flex items-center justify-center gap-2 whitespace-nowrap text-sm"
            >
              <Search size={18} />
              Search
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4 lg:gap-6 flex-shrink-0">
            <ThemeToggle />
            <ProfileDropdown />

            <Link
              href={ROUTES.cart}
              className="relative flex flex-col items-center hover:text-primary transition"
              aria-label="Cart"
            >
              <ShoppingCart size={18} />
              <span className="text-[10px] lg:text-xs">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-3">
            <Link
              href={ROUTES.cart}
              className="relative flex items-center hover:text-primary transition"
              aria-label="Cart"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="lg:hidden border-t border-border pt-4 pb-4">
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                placeholder="Search products..."
                className="w-full px-4 py-3 rounded-md bg-surface-elevated border border-border text-sm text-foreground focus:outline-none"
              />

              <div className="flex gap-2">
                <select
                  value={searchScope}
                  onChange={(event) => setSearchScope(event.target.value)}
                  className="bg-surface-elevated border border-border rounded-md px-3 py-3 text-sm w-28 outline-none text-foreground"
                >
                  <option value="all">All</option>
                  <option value="products">Products</option>
                  <option value="categories">Categories</option>
                </select>

                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-md py-3 text-sm flex items-center justify-center gap-2"
                >
                  <Search size={16} />
                  Search
                </button>
              </div>

              <div className="border-t border-border pt-4 mt-2">
                <div className="flex items-center justify-between px-4 py-2 mb-2">
                  <span className="text-sm text-muted">Theme</span>
                  <ThemeToggle />
                </div>

                <div className="flex flex-col gap-1">
                  {navItems.map((link) => (
                    <Link
                      key={`${link.id}-${link.href}`}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                    >
                      <div
                        className={`px-4 py-3 text-sm rounded transition ${
                          isActiveLink(link.href)
                            ? "bg-primary/10 text-primary font-semibold"
                            : "hover:bg-surface-elevated"
                        }`}
                      >
                        {link.label}
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="border-t border-border pt-4 mt-4">
                  <button
                    type="button"
                    onClick={handleAuthAction}
                    className="w-full bg-primary hover:bg-primary-hover text-white py-3 text-sm rounded-md font-medium flex items-center justify-center gap-2 transition"
                  >
                    {isLoggedIn ? (
                      <>
                        <LogOut size={16} />
                        Logout
                      </>
                    ) : (
                      <>
                        <LogIn size={16} />
                        Login
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block border-t border-border">
      <div className={PAGE_CONTAINER_CLASS}>
          <div className="flex items-center justify-between gap-4 py-3 flex-wrap">
            <div className="flex items-center space-x-1 flex-wrap flex-1 min-w-0">
              <Link href={ROUTES.home}>
                <button
                  type="button"
                  className="bg-primary hover:bg-primary-hover text-white p-2 lg:p-3 rounded transition"
                >
                  <Home size={18} />
                </button>
              </Link>

              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`px-2 lg:px-4 py-2 text-xs lg:text-sm whitespace-nowrap ${navLinkClass(item.href)}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={handleAuthAction}
                className="bg-primary hover:bg-primary-hover text-white px-3 lg:px-5 py-2 text-xs lg:text-sm rounded-md font-medium transition flex items-center gap-2"
              >
                {isLoggedIn ? (
                  <>
                    <LogOut size={16} />
                    Logout
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Login
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      </nav>
      {/* Keeps page content below the fixed header on every public page. */}
      <div aria-hidden="true" className="h-[76px] md:h-[144px]" />
    </>
  );
}
