"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { TableColumn } from "react-data-table-component";
import { Eye } from "lucide-react";
import AdminListLayout from "@/components/admin/AdminListLayout";
import AdminTableSection from "@/components/admin/AdminTableSection";
import AdminCrudLayout from "@/components/admin/AdminCrudLayout";
import EnquiryDetailModal from "@/components/admin/EnquiryDetailModal";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import { createdAtColumn } from "@/lib/admin/dateColumns";
import { ROUTES } from "@/lib/routes";

interface Enquiry {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  subject: string;
  productCategory: string | null;
  productId: number | null;
  title: string;
  message: string;
  hasAccount: boolean;
  date: string;
  createdAt: string;
}

export default function AdminEnquiryPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const { toasts, removeToast, showError } = useToast();

  useEffect(() => {
    fetch("/api/enquiry")
      .then((res) => res.json())
      .then((data) => {
        setEnquiries(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        showError("Failed to load enquiries");
        setLoading(false);
      });
  }, []);

  const columns: TableColumn<Enquiry>[] = useMemo(
    () => [
      {
        name: "Name",
        grow: 1.5,
        selector: (row) => row.fullName,
        cell: (row) => (
          <span className="font-semibold text-foreground">{row.fullName}</span>
        ),
      },
      { name: "Company", grow: 1.5, selector: (row) => row.companyName },
      {
        name: "Email",
        grow: 2,
        selector: (row) => row.email,
        cell: (row) => (
          <a
            href={`mailto:${row.email}`}
            className="text-[#0b5cff] hover:underline"
          >
            {row.email}
          </a>
        ),
      },
      {
        name: "Phone",
        width: "130px",
        selector: (row) => row.phoneNumber,
        cell: (row) => (
          <a
            href={`tel:${row.phoneNumber}`}
            className="text-[#0b5cff] hover:underline"
          >
            {row.phoneNumber}
          </a>
        ),
      },
      {
        name: "Subject",
        grow: 1.5,
        selector: (row) => row.subject ?? "",
        cell: (row) => (
          <span className="truncate" title={row.subject}>
            {row.subject || "—"}
          </span>
        ),
      },
      {
        name: "Product",
        grow: 1.5,
        selector: (row) => row.productCategory ?? "",
        cell: (row) => {
          if (!row.productCategory) return "—";

          if (row.productId) {
            return (
              <Link
                href={ROUTES.productDetail(row.productId)}
                className="text-[#0b5cff] hover:underline"
              >
                {row.productCategory}
              </Link>
            );
          }

          return row.productCategory;
        },
      },
      {
        name: "Account",
        width: "110px",
        center: true,
        selector: (row) => (row.hasAccount ? 1 : 0),
        cell: (row) => (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              row.hasAccount
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-amber-500/10 text-amber-600"
            }`}
          >
            {row.hasAccount ? "Yes" : "No"}
          </span>
        ),
      },
      {
        ...createdAtColumn<Enquiry>("140px"),
        name: "Created Date",
      },
      {
        name: "Details",
        width: "100px",
        center: true,
        cell: (row) => (
          <button
            type="button"
            onClick={() => setSelectedEnquiry(row)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-elevated"
            aria-label={`View enquiry ${row.id}`}
          >
            <Eye className="h-4 w-4" />
          </button>
        ),
      },
    ],
    []
  );

  return (
    <AdminListLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <AdminCrudLayout
        title="Enquiries"
        description="View and manage all customer product enquiries."
        fullWidth
      >
        <AdminTableSection
          columns={columns}
          data={enquiries}
          loading={loading}
          fullWidth
          noDataMessage="No enquiries found."
        />
      </AdminCrudLayout>

      <EnquiryDetailModal
        enquiry={selectedEnquiry}
        onClose={() => setSelectedEnquiry(null)}
      />
    </AdminListLayout>
  );
}
