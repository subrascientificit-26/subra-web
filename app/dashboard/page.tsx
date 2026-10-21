"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import type { TableColumn } from "react-data-table-component";
import {
  FaBox,
  FaShoppingCart,
  FaEnvelope,
  FaClock,
  FaMailBulk,
} from "react-icons/fa";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import { ROUTES } from "@/lib/routes";
import { getDisplayName, getUserInitials } from "@/lib/user";
import LoadingState from "@/components/ui/LoadingState";
import DataTable from "@/components/ui/DataTable";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalEnquiries: number;
  enquiriesThisMonth: number;
  customRequirements: number;
}

interface RecentEnquiry {
  id: string;
  title: string;
  date: string;
}

export default function UserDashboard() {
  const router = useRouter();
  const { toasts, removeToast, showError } = useToast();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEnquiries, setRecentEnquiries] = useState<RecentEnquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [userRes, statsRes] = await Promise.all([
          fetch("/api/auth/me", { credentials: "include" }),
          fetch("/api/dashboard/stats", { credentials: "include" }),
        ]);

        if (!userRes.ok) {
          router.push(ROUTES.login);
          return;
        }

        const userData = await userRes.json();

        if (userData.user?.role === "admin") {
          router.push(ROUTES.admin.dashboard);
          return;
        }

        setUser(userData.user);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats ?? null);
          setRecentEnquiries(statsData.recentEnquiries ?? []);
        }
      } catch {
        showError("Failed to load user data");
        router.push(ROUTES.login);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router, showError]);

  const enquiryColumns: TableColumn<RecentEnquiry>[] = useMemo(
    () => [
      {
        name: "ID",
        width: "110px",
        selector: (row) => row.id,
        cell: (row) => <span className="font-medium text-primary">{row.id}</span>,
      },
      {
        name: "Subject",
        grow: 1.5,
        selector: (row) => row.title,
        cell: (row) => <span className="text-foreground">{row.title}</span>,
      },
      {
        name: "Date",
        width: "120px",
        selector: (row) => row.date,
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <LoadingState message="Loading dashboard..." fullScreen />
      </div>
    );
  }

  const displayName = user ? getDisplayName(user) : "User";
  const initials = user ? getUserInitials(user) : "U";

  return (
    <div className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground`}>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-xl font-bold">
              {initials}
            </div>
            <div>
              <h2 className="text-3xl font-bold">Welcome, {displayName}!</h2>
              <p className="text-blue-100">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-lg border border-border bg-surface p-6">
          <h3 className="mb-4 text-xl font-bold text-foreground">Profile Details</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted">Full Name</p>
              <p className="text-foreground font-medium">{displayName}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Email</p>
              <p className="text-foreground font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Account Type</p>
              <p className="text-foreground font-medium capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-lg border border-border bg-surface p-6 border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {stats?.totalOrders ?? 0}
                </p>
              </div>
              <FaShoppingCart className="w-10 h-10 text-primary" />
            </div>
          </div>

          {/* <div className="bg-slate-700 rounded-lg p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">Pending Orders</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats?.pendingOrders ?? 0}
                </p>
              </div>
              <FaClock className="w-10 h-10 text-green-400" />
            </div>
          </div> */}

          <div className="rounded-lg border border-border bg-surface p-6 border-l-4 border-l-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm">My Enquiries</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {stats?.totalEnquiries ?? 0}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {stats?.enquiriesThisMonth ?? 0} this month
                </p>
              </div>
              <FaEnvelope className="w-10 h-10 text-purple-400" />
            </div>
          </div>
        </div>

        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FaBox className="text-blue-400" /> My Orders
            </h3>
            <p className="text-slate-300 mb-4">View and manage all your orders</p>
            <Link
              href={ROUTES.orders}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer transition"
            >
              View Orders
            </Link>
          </div> */}

          <div className="rounded-lg border border-border bg-surface p-6">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <FaMailBulk className="text-purple-400" /> Recent Enquiries
            </h3>

            {recentEnquiries.length === 0 ? (
              <p className="text-muted mb-4">You have not submitted any enquiries yet.</p>
            ) : (
              <div className="mb-4">
                <DataTable
                  columns={enquiryColumns}
                  data={recentEnquiries}
                  noDataMessage="No enquiries yet"
                  paginationPerPage={3}
                  fixedPageSize
                  showRowIndex={false}
                  responsive={false}
                />
              </div>
            )}

            <Link
              href={ROUTES.enquiry}
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded cursor-pointer transition"
            >
              Submit Enquiry
            </Link>
          </div>
      </main>

      <Footer />
    </div>
  );
}
