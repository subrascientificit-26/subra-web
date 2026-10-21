"use client";

import Link from "next/link";
import {
  ChevronRight,
  FlaskConical,
  Package,
  Cog,
  Library,
  Mail,
  ShoppingCart,
  LayoutGrid,
} from "lucide-react";
import { useSidebarItems } from "@/lib/hooks/useSidebarItems";

const ICONS = [
  FlaskConical,
  Package,
  Cog,
  Library,
  Mail,
  ShoppingCart,
  LayoutGrid,
];

const DESCRIPTIONS = [
  "Explore products by\napplication areas",
  "Browse our complete\nproduct range",
  "Specialized solutions\ntailored to your needs",
  "Find products\nalphabetically",
  "Send us your requirements\nor feedback",
  "View your order history\nand track status",
];

export default function ProductCategories() {
  const { items: categories } = useSidebarItems("navbar", []);

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="bg-background text-foreground py-8">
      <div className="max-w-[98%] mx-auto px-2 sm:px-3">
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8">
          <div className="w-12 sm:w-24 h-[2px] bg-blue-500" />
          <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-center whitespace-nowrap">
            PRODUCT CATEGORIES
          </h2>
          <div className="w-12 sm:w-24 h-[2px] bg-blue-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
          {categories.map((category, index) => {
            const Icon = ICONS[index % ICONS.length];
            const description = DESCRIPTIONS[index % DESCRIPTIONS.length];

            return (
              <Link href={category.href} key={category.id}>
                <div className="border border-border rounded-xl min-h-[210px] px-4 py-5 flex flex-col items-center justify-between text-center bg-surface hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition duration-300 cursor-pointer">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-primary/50 flex items-center justify-center">
                    <Icon size={32} className="text-blue-500" strokeWidth={1.8} />
                  </div>

                  <div className="mt-4">
                    <h3 className="text-base sm:text-lg font-semibold mb-2">
                      {category.label}
                    </h3>
                    <p className="text-muted text-xs sm:text-sm leading-5 whitespace-pre-line">
                      {description}
                    </p>
                  </div>

                  <span className="mt-5 bg-[#0B5ED7] hover:bg-[#0A53BE] text-white text-sm px-4 py-2 rounded-md flex items-center gap-1 transition">
                    View All
                    <ChevronRight size={15} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
