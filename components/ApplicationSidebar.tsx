"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { STICKY_SIDEBAR_CLASS } from "@/lib/layout";

interface Category {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
}

interface ApplicationSidebarProps {
  categories?: Category[];
}

export default function ApplicationSidebar({
  categories: externalCategories,
}: ApplicationSidebarProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState<Category[]>(
    externalCategories ?? [],
  );
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set(),
  );

  useEffect(() => {
    if (externalCategories) {
      setCategories(externalCategories);
      return;
    }

    fetch("/api/category")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, [externalCategories]);

  useEffect(() => {
    fetch("/api/subcategory")
      .then((res) => res.json())
      .then((data) => setSubCategories(Array.isArray(data) ? data : []))
      .catch(() => setSubCategories([]));
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setIsAdmin(data.user?.role === "admin");
      })
      .catch(() => setIsAdmin(false));
  }, []);

  const toggleCategory = (id: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <aside
      className={`w-full flex-shrink-0 md:w-64 lg:w-72 ${STICKY_SIDEBAR_CLASS}`}
    >
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-4 py-4">
          <h3 className="text-sm font-bold uppercase text-primary lg:text-base">
            Application Categories
          </h3>
        </div>

        {isAdmin && (
          <>
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-xs font-bold uppercase text-danger">
                Admin Panel
              </h3>
            </div>
            <Link
              href={ROUTES.admin.categories}
              className="block border-b border-border px-4 py-3 text-sm text-muted transition hover:bg-surface-elevated"
            >
              Category Management
            </Link>
          </>
        )}

        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
          <Link
            href={ROUTES.applications}
            onClick={() => setActiveCategoryId(null)}
            className={`block w-full border-b border-border px-4 py-3.5 text-left transition-all duration-200 ${
              activeCategoryId === null
                ? "bg-primary text-white"
                : "text-muted hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            <span className="text-sm font-medium">All Applications</span>
          </Link>

          {categories.map((category) => {
            const isActive = activeCategoryId === category.id;
            const subs = subCategories.filter(
              (sub) => sub.categoryId === category.id,
            );
            const isExpanded = expandedCategories.has(category.id);

            return (
              <div key={category.id} className="border-b border-border">
                <div className="flex items-center">
                  {subs.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className="flex-shrink-0 p-3 text-muted transition hover:text-foreground"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                  ) : (
                    <span className="w-10 flex-shrink-0" />
                  )}
                  <Link
                    href={ROUTES.productsByCategory(category.id)}
                    onClick={() => setActiveCategoryId(category.id)}
                    className={`flex flex-1 items-center px-2 py-3.5 text-left transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted hover:bg-surface-elevated hover:text-foreground"
                    }`}
                  >
                    <span className="text-sm font-medium">{category.name}</span>
                  </Link>
                </div>

                {subs.length > 0 && isExpanded && (
                  <div className="ml-10 space-y-0.5 border-l border-border pb-2 pl-3">
                    {subs.map((sub) => (
                      <Link
                        key={sub.id}
                        href={ROUTES.productsByCategory(category.id)}
                        className="block rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-surface-elevated hover:text-foreground"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
