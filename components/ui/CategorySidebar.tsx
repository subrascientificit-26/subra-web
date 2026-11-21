"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, LucideIcon, Link2, Package } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { STICKY_SIDEBAR_CLASS } from "@/lib/layout";
import { useSidebarItems } from "@/lib/hooks/useSidebarItems";

export interface CategoryGroup {
  name: string;
  subcategories: string[];
}

interface CategorySidebarProps {
  title?: string;
  categoryGroups: CategoryGroup[];
  selectedCategory: string;
  selectedSubCategory: string | null;
  onSelectCategory: (category: string, subCategory: string | null) => void;
  allLabel?: string;
  icon?: LucideIcon;
  showSupport?: boolean;
  showDynamicLinks?: boolean;
}

export default function CategorySidebar({
  title = "Categories",
  categoryGroups,
  selectedCategory,
  selectedSubCategory,
  onSelectCategory,
  allLabel = "All Categories",
  icon: Icon = Package,
  showSupport = true,
  showDynamicLinks = true,
}: CategorySidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { items: dynamicLinks } = useSidebarItems("products_sidebar", []);

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const isAllSelected = selectedCategory === allLabel && !selectedSubCategory;

  return (
    <aside className={`flex w-full flex-shrink-0 flex-col space-y-5 lg:w-64 ${STICKY_SIDEBAR_CLASS}`}>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm theme-dark:shadow-lg">
        <div className="border-b border-border px-4 py-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-primary lg:text-base">
            {title}
          </h3>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2 lg:max-h-none lg:overflow-visible">
          <button
            type="button"
            onClick={() => onSelectCategory(allLabel, null)}
            className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 ${
              isAllSelected
                ? "bg-primary text-white"
                : "text-muted hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="line-clamp-1 text-left font-medium">{allLabel}</span>
          </button>

          {categoryGroups.map((group) => {
            const isExpanded = expandedCategories.has(group.name);
            const isCategoryActive =
              selectedCategory === group.name && !selectedSubCategory;
            const hasSubcategories = group.subcategories.length > 0;

            return (
              <div key={group.name} className="mb-1">
                <div className="flex items-center">
                  {hasSubcategories ? (
                    <button
                      type="button"
                      onClick={() => toggleCategory(group.name)}
                      className="flex-shrink-0 rounded-lg p-2 text-muted transition hover:text-foreground"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  ) : (
                    <span className="w-8 flex-shrink-0" />
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectCategory(group.name, null)}
                    className={`flex flex-1 items-center gap-2 rounded-xl px-2 py-2.5 text-sm transition-all duration-200 ${
                      isCategoryActive
                        ? "bg-primary text-white"
                        : "text-muted hover:bg-surface-elevated hover:text-foreground"
                    }`}
                  >
                    <span className="line-clamp-1 text-left font-medium">{group.name}</span>
                  </button>
                </div>

                {hasSubcategories && isExpanded && (
                  <div className="ml-8 space-y-0.5 border-l border-border pl-2">
                    {group.subcategories.map((sub) => {
                      const isSubActive =
                        selectedCategory === group.name && selectedSubCategory === sub;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => onSelectCategory(group.name, sub)}
                          className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs transition ${
                            isSubActive
                              ? "bg-primary/90 text-white"
                              : "text-muted hover:bg-surface-elevated hover:text-foreground"
                          }`}
                        >
                          <span className="line-clamp-1 font-medium">{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showDynamicLinks && dynamicLinks.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm theme-dark:shadow-lg">
          <div className="border-b border-border px-4 py-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-primary lg:text-base">
              Quick Links
            </h3>
          </div>
          <div className="p-2">
            {dynamicLinks.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted transition hover:bg-surface-elevated hover:text-foreground"
              >
                <Link2 size={18} className="flex-shrink-0 text-primary" />
                <span className="line-clamp-1 text-left font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showSupport && (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm theme-dark:shadow-lg">
          <p className="mb-3 text-sm font-bold text-foreground">Need Assistance?</p>
          <p className="mb-4 text-sm leading-6 text-muted">
            Contact our support team for product inquiries, quotations and technical help.
          </p>
          <Link
            href={ROUTES.enquiry}
            className="block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Contact Support
          </Link>
        </div>
      )}
    </aside>
  );
}
