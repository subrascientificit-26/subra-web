'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import LoadingState from '@/components/ui/LoadingState';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

interface DashboardData {
  enquiryTrend: Array<{ label: string; count: number }>;
  productStatus: {
    inStock: number;
    outOfStock: number;
    lowStock: number;
  };
}

export default function ChartsSection() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!payload) return;
        setData({
          enquiryTrend: payload.enquiryTrend ?? [],
          productStatus: payload.productStatus ?? {
            inStock: 0,
            outOfStock: 0,
            lowStock: 0,
          },
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState message="Loading charts..." />;
  }

  const enquiryTrend = data?.enquiryTrend ?? [];
  const productStatus = data?.productStatus ?? {
    inStock: 0,
    outOfStock: 0,
    lowStock: 0,
  };

  const lineChartData = {
    labels: enquiryTrend.map((item) => item.label),
    datasets: [
      {
        label: 'Enquiries',
        data: enquiryTrend.map((item) => item.count),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.15)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const pieChartData = {
    labels: ['In Stock', 'Low Stock', 'Out of Stock'],
    datasets: [
      {
        data: [
          productStatus.inStock,
          productStatus.lowStock,
          productStatus.outOfStock,
        ],
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
      <div className="xl:col-span-2 bg-surface border border-border rounded-xl p-4">
        <h2 className="mb-1 font-semibold text-foreground">Enquiry Overview</h2>
        <p className="mb-4 text-xs text-muted">
          Monthly enquiry submissions from customers
        </p>

        <div className="h-[300px]">
          {enquiryTrend.length > 0 ? (
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              No enquiry data available yet
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <h2 className="mb-1 font-semibold text-foreground">Product Status</h2>
        <p className="mb-4 text-xs text-muted">
          Current stock distribution across products
        </p>

        <div className="h-[300px]">
          {productStatus.inStock + productStatus.outOfStock + productStatus.lowStock > 0 ? (
            <Doughnut
              data={pieChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              No product data available yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
