'use client';

import StatsCards from '@/components/dashboard/StatsCards';
import ChartsSection from '@/components/dashboard/ChartsSection';
import TablesSection from '@/components/dashboard/TablesSection';
import ActionCards from '@/components/dashboard/ActionCards';
import { PAGE_CONTAINER_CLASS } from '@/lib/layout';

export default function AdminDashboardPage() {
  return (
    <div className="bg-background text-foreground py-3">
      <section className={`${PAGE_CONTAINER_CLASS} space-y-4`}>
        <StatsCards />

        <ChartsSection />

        <TablesSection />

        <ActionCards />
      </section>
    </div>
  );
}
