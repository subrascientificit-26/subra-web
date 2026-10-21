'use client';

import StatsCards from '@/components/dashboard/StatsCards';
import ChartsSection from '@/components/dashboard/ChartsSection';
import TablesSection from '@/components/dashboard/TablesSection';
import ActionCards from '@/components/dashboard/ActionCards';

export default function AdminDashboardPage() {
  return (
    <section className="p-4 lg:p-6 space-y-4">
      <StatsCards />

      <ChartsSection />

      <TablesSection />

      <ActionCards />
    </section>
  );
}
