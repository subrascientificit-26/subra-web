"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import Footer from "@/components/dashboard/Footer";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminAuthGuard>
      <div className="h-screen bg-background text-foreground overflow-hidden">
        <div className="flex">
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          <main className="flex-1 lg:ml-[250px] h-screen flex flex-col overflow-hidden">
            <Header setSidebarOpen={setSidebarOpen} />

            <div className="flex-1 min-h-0 overflow-hidden pt-[75px] pb-[70px]">
              <div className="h-full overflow-y-auto">{children}</div>
            </div>

            <Footer />
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
