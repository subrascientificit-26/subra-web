'use client';

import Link from 'next/link';
import {
  ShoppingCart,
  Users,
  Package,
  Mail,
} from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import { ROUTES } from '@/lib/routes';
import { useAdminDashboard } from '@/lib/hooks/useAdminDashboard';

export default function StatsCards() {
  const { data, loading } = useAdminDashboard();
  const stats = data?.stats ?? null;

  if (loading) {
    return <LoadingState message="Loading dashboard stats..." />;
  }

  const enquiryChange =
    stats && stats.enquiriesLastMonth > 0
      ? `${Math.round(
          ((stats.enquiriesThisMonth - stats.enquiriesLastMonth) /
            stats.enquiriesLastMonth) *
            100
        )}% vs last month`
      : stats?.enquiriesThisMonth
        ? `${stats.enquiriesThisMonth} this month`
        : 'No enquiries yet';

  const statsCards = [
    {
      title: 'Total Products',
      value: String(stats?.totalProducts ?? 0),
      note: 'Active catalogue items',
      icon: Package,
      iconBg: 'bg-purple-100 border border-purple-200 theme-dark:bg-purple-500/15 theme-dark:border-purple-500/25',
      iconColor: 'text-purple-700 theme-dark:text-purple-400',
      hover: 'hover:border-purple-500',
      href: ROUTES.admin.products,
    },
    {
      title: 'Total Customers',
      value: String(stats?.totalCustomers ?? 0),
      note: 'Registered users',
      icon: Users,
      iconBg: 'bg-emerald-100 border border-emerald-200 theme-dark:bg-emerald-500/15 theme-dark:border-emerald-500/25',
      iconColor: 'text-emerald-700 theme-dark:text-emerald-400',
      hover: 'hover:border-emerald-500',
      href: ROUTES.admin.users,
    },
    {
      title: 'Total Enquiries',
      value: String(stats?.totalEnquiries ?? 0),
      note: enquiryChange,
      icon: Mail,
      iconBg: 'bg-blue-100 border border-blue-200 theme-dark:bg-primary/15 theme-dark:border-primary/25',
      iconColor: 'text-blue-700 theme-dark:text-primary',
      hover: 'hover:border-primary',
      href: ROUTES.admin.enquiry,
    },
    {
      title: 'Custom Requests',
      value: String(stats?.totalCustomRequirements ?? 0),
      note: 'Custom product submissions',
      icon: ShoppingCart,
      iconBg: 'bg-amber-100 border border-amber-200 theme-dark:bg-amber-500/15 theme-dark:border-amber-500/25',
      iconColor: 'text-amber-700 theme-dark:text-amber-400',
      hover: 'hover:border-amber-500',
      href: ROUTES.customProducts,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {statsCards.map((card) => {
        const Icon = card.icon;

        return (
          <Link
            key={card.title}
            href={card.href}
            className={`block bg-surface border border-border rounded-xl px-3 py-4 transition-all duration-300 ${card.hover}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-[48px] h-[48px] rounded-lg flex items-center justify-center ${card.iconBg} ${card.iconColor}`}
              >
                <Icon size={18} />
              </div>

              <div>
                <p className="text-muted text-[12px]">{card.title}</p>
                <h2 className="text-[28px] font-bold mt-1 text-foreground">{card.value}</h2>
                <p className="text-muted text-[11px] mt-2">{card.note}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
