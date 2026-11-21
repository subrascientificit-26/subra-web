'use client';

import { useSyncExternalStore } from 'react';
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
  type ChartOptions,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import LoadingState from '@/components/ui/LoadingState';
import { getThemeAppearanceSnapshot, subscribeToTheme } from '@/lib/theme';
import { useAdminDashboard } from '@/lib/hooks/useAdminDashboard';

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

function withAlpha(color: string, alpha: number, fallback: string) {
  const hex = color.trim();
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return fallback;
  const intVal = Number.parseInt(match[1], 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ChartsSection() {
  const { data, loading } = useAdminDashboard();
  const appearance = useSyncExternalStore(
    subscribeToTheme,
    getThemeAppearanceSnapshot,
    () => 'dark|#0b5ed7'
  );
  const [mode, primaryRaw] = appearance.split('|');
  const isLight = mode === 'light';
  const primaryColor = primaryRaw || '#0b5ed7';

  if (loading) {
    return <LoadingState message="Loading charts..." />;
  }

  const enquiryTrend = data?.enquiryTrend ?? [];
  const productStatus = data?.productStatus ?? {
    inStock: 0,
    outOfStock: 0,
    lowStock: 0,
  };

  const textColor = isLight ? '#0f172a' : '#f1f5f9';
  const mutedColor = isLight ? '#475569' : '#94a3b8';
  const gridColor = isLight
    ? 'rgba(100, 116, 139, 0.22)'
    : 'rgba(148, 163, 184, 0.16)';
  const surfaceBg = isLight ? '#ffffff' : '#0a1428';
  const tooltipBg = isLight ? '#ffffff' : '#13213c';
  const tooltipBorder = isLight ? '#cbd5e1' : '#334155';

  const lineChartData = {
    labels: enquiryTrend.map((item) => item.label),
    datasets: [
      {
        label: 'Enquiries',
        data: enquiryTrend.map((item) => item.count),
        borderColor: primaryColor,
        backgroundColor: withAlpha(primaryColor, isLight ? 0.16 : 0.22, 'rgba(11, 94, 215, 0.18)'),
        pointBackgroundColor: primaryColor,
        pointBorderColor: surfaceBg,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
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
        backgroundColor: isLight
          ? ['#16a34a', '#d97706', '#dc2626']
          : ['#22c55e', '#f59e0b', '#ef4444'],
        borderColor: surfaceBg,
        borderWidth: 2,
      },
    ],
  };

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: textColor,
        bodyColor: mutedColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: mutedColor },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
      y: {
        beginAtZero: true,
        ticks: { color: mutedColor, precision: 0 },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
    },
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: textColor,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: textColor,
        bodyColor: mutedColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
      <div className="min-w-0 xl:col-span-2 bg-surface border border-border rounded-xl p-4">
        <h2 className="mb-1 font-semibold text-foreground">Enquiry Overview</h2>
        <p className="mb-4 text-xs text-muted">
          Monthly enquiry submissions from customers
        </p>

        <div className="h-[240px] sm:h-[280px] lg:h-[300px]">
          {enquiryTrend.length > 0 ? (
            <Line data={lineChartData} options={lineOptions} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              No enquiry data available yet
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 bg-surface border border-border rounded-xl p-4">
        <h2 className="mb-1 font-semibold text-foreground">Product Status</h2>
        <p className="mb-4 text-xs text-muted">
          Current stock distribution across products
        </p>

        <div className="h-[240px] sm:h-[280px] lg:h-[300px]">
          {productStatus.inStock + productStatus.outOfStock + productStatus.lowStock > 0 ? (
            <Doughnut data={pieChartData} options={doughnutOptions} />
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
