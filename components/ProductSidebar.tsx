'use client';

import Link from 'next/link';
import { Headphones, Package } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

interface ProductSidebarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function ProductSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
}: ProductSidebarProps) {
  const sidebarCategories = ['All Categories', ...categories];

  return (
    <aside className="w-full md:w-56 lg:w-64 flex-shrink-0 space-y-5">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
        <div className="border-b border-border px-4 py-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-primary lg:text-base">
            Categories
          </h3>
        </div>

        <div className="p-2">
          {sidebarCategories.map((category) => {
            const isActive = selectedCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-muted hover:bg-surface-elevated hover:text-foreground'
                }`}
              >
                <Package size={18} className="flex-shrink-0" />

                <span className="line-clamp-1 text-left font-medium">
                  {category}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
            <Headphones size={18} className="text-primary" />
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground">Need Assistance?</h4>
            <p className="text-xs text-muted">We are here to help</p>
          </div>
        </div>

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
    </aside>
  );
}
