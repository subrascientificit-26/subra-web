'use client';

import Link from 'next/link';
import {
  Users,
  Package,
  PackagePlus,
  ChevronRight,
} from 'lucide-react';
import { ROUTES } from '@/lib/routes';

interface ActionCardsProps {
  className?: string;
}

const actions = [
  {
    title: 'Products',
    desc: 'View and manage catalogue',
    icon: Package,
    href: ROUTES.admin.products,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    hover: 'hover:border-accent',
  },
  {
    title: 'Add Product',
    desc: 'Create a new catalogue item',
    icon: PackagePlus,
    href: ROUTES.admin.productCreate,
    iconBg: 'bg-[#22c55e20]',
    iconColor: 'text-[#22c55e]',
    hover: 'hover:border-[#22c55e]',
  },
  {
    title: 'Users',
    desc: 'Browse and manage customers',
    icon: Users,
    href: ROUTES.admin.users,
    iconBg: 'bg-[#9333ea20]',
    iconColor: 'text-[#9333ea]',
    hover: 'hover:border-[#9333ea]',
  },
];

export default function ActionCards({ className = 'mt-4' }: ActionCardsProps) {
  return (
    <div className={className}>
      <h3 className="mb-3 text-sm font-semibold text-foreground">Quick Actions</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {actions.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-4 transition-all duration-300 ${item.hover}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-[42px] w-[42px] items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor}`}
                >
                  <Icon size={18} />
                </div>

                <div className="text-left">
                  <p className="text-[13px] font-semibold text-foreground">{item.title}</p>
                  <span className="text-[11px] text-muted">{item.desc}</span>
                </div>
              </div>

              <ChevronRight size={14} className={`flex-shrink-0 ${item.iconColor}`} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
