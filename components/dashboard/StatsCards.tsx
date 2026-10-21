'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Users,
  Package,
  Mail,
} from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import { ROUTES } from '@/lib/routes';

interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  totalEnquiries: number;
  totalCustomRequirements: number;
  enquiriesThisMonth: number;
  enquiriesLastMonth: number;
}

export default function StatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStats(data?.stats ?? null))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

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
      iconBg: 'bg-[#9333ea20]',
      iconColor: 'text-[#9333ea]',
      hover: 'hover:border-[#9333ea]',
      href: ROUTES.admin.products,
    },
    {
      title: 'Total Customers',
      value: String(stats?.totalCustomers ?? 0),
      note: 'Registered users',
      icon: Users,
      iconBg: 'bg-[#22c55e20]',
      iconColor: 'text-[#22c55e]',
      hover: 'hover:border-[#22c55e]',
      href: ROUTES.admin.users,
    },
    {
      title: 'Total Enquiries',
      value: String(stats?.totalEnquiries ?? 0),
      note: enquiryChange,
      icon: Mail,
      iconBg: 'bg-[#0b5cff20]',
      iconColor: 'text-[#0b5cff]',
      hover: 'hover:border-[#2563eb]',
      href: ROUTES.admin.enquiry,
    },
    {
      title: 'Custom Requests',
      value: String(stats?.totalCustomRequirements ?? 0),
      note: 'Custom product submissions',
      icon: ShoppingCart,
      iconBg: 'bg-[#f59e0b20]',
      iconColor: 'text-[#f59e0b]',
      hover: 'hover:border-[#f59e0b]',
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
