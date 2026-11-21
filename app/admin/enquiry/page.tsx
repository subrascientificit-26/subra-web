"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { TableColumn } from "react-data-table-component";
import { FileText } from "lucide-react";
import AdminListLayout from "@/components/admin/AdminListLayout";
import AdminTableSection from "@/components/admin/AdminTableSection";
import AdminCrudLayout from "@/components/admin/AdminCrudLayout";
import AdminActionButtons from "@/components/admin/AdminActionButtons";
import EnquiryDetailModal from "@/components/admin/EnquiryDetailModal";
import { ImageCell } from "@/components/admin/DetailCells";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import { createdAtColumn } from "@/lib/admin/dateColumns";
import { isEnquiryImageUrl } from "@/lib/enquiry";
import { resolveProductImageUrl } from "@/lib/productImageUrl";
import { ROUTES } from "@/lib/routes";
import { useLiveUpdates } from "@/lib/hooks/useLiveUpdates";

interface Enquiry {
  rawId?: number;
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
  fileUrl: string | null;
  hasAccount: boolean;
  date: string;
  createdAt: string;
}

export default function AdminEnquiryPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [confirmDeleteEnquiry, setConfirmDeleteEnquiry] = useState<Enquiry | null>(null);
  const { toasts, removeToast, showError, showSuccess } = useToast();

  const reloadEnquiriesSilently = async () => {
    try {
      const res = await fetch("/api/enquiry", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      setEnquiries(Array.isArray(data) ? data : []);
    } catch {
      // Preserve existing rows on transient live-refresh error
    }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/enquiry", { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setEnquiries(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) showError("Failed to load enquiries");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useLiveUpdates(["enquiries", "users"], () => {
    void reloadEnquiriesSilently();
  });

  const filteredEnquiries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return enquiries;
    return enquiries.filter((item) =>
      [
        item.id,
        item.fullName,
        item.companyName,
        item.email,
        item.phoneNumber,
        item.subject,
        item.productCategory,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(query))
    );
  }, [enquiries, search]);

  const handleConfirmDelete = async () => {
    if (!confirmDeleteEnquiry) return;
    const targetId = confirmDeleteEnquiry.rawId ?? confirmDeleteEnquiry.id;

    try {
      const res = await fetch(
        `/api/enquiry?id=${encodeURIComponent(String(targetId))}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(data.error || "Failed to delete enquiry");
        return;
      }

      setEnquiries((prev) =>
        prev.filter((item) => item.id !== confirmDeleteEnquiry.id)
      );
      if (selectedEnquiry?.id === confirmDeleteEnquiry.id) {
        setSelectedEnquiry(null);
      }
      setConfirmDeleteEnquiry(null);
      showSuccess("Enquiry deleted successfully");
    } catch {
      showError("Failed to delete enquiry");
    }
  };

  const columns: TableColumn<Enquiry>[] = useMemo(
    () => [
      {
        name: "Image / File",
        width: "110px",
        center: true,
        cell: (row) => {
          if (!row.fileUrl) {
            return (
              <ImageCell
                src={null}
                alt={row.subject || row.fullName}
                size="sm"
              />
            );
          }

          if (isEnquiryImageUrl(row.fileUrl)) {
            return (
              <button
                type="button"
                onClick={() => setSelectedEnquiry(row)}
                className="inline-flex cursor-pointer rounded-xl transition hover:opacity-85"
                title="View uploaded image"
                aria-label={`View uploaded image for enquiry ${row.id}`}
              >
                <ImageCell
                  src={row.fileUrl}
                  alt={row.subject || row.fullName}
                  size="sm"
                />
              </button>
            );
          }

          return (
            <a
              href={resolveProductImageUrl(row.fileUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-elevated px-2.5 py-1 text-xs font-medium text-primary hover:border-primary/50"
              title="Open uploaded file"
            >
              <FileText className="h-3.5 w-3.5" />
              File
            </a>
          );
        },
      },
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
            className="text-primary hover:underline"
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
            className="text-primary hover:underline"
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
                className="text-primary hover:underline"
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
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 theme-dark:text-emerald-400"
                : "bg-amber-500/10 border border-amber-500/30 text-amber-700 theme-dark:text-amber-400"
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
        name: "Actions",
        width: "120px",
        center: true,
        cell: (row) => (
          <AdminActionButtons
            onView={() => setSelectedEnquiry(row)}
            onDelete={() => setConfirmDeleteEnquiry(row)}
          />
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
          data={filteredEnquiries}
          loading={loading}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "Search enquiries...",
          }}
          fullWidth
          noDataMessage="No enquiries found."
        />
      </AdminCrudLayout>

      <EnquiryDetailModal
        enquiry={selectedEnquiry}
        onClose={() => setSelectedEnquiry(null)}
        onDelete={(enquiry) => {
          setSelectedEnquiry(null);
          setConfirmDeleteEnquiry(enquiry as Enquiry);
        }}
      />

      <ConfirmDialog
        open={confirmDeleteEnquiry !== null}
        title="Delete Enquiry"
        description="Are you sure you want to delete this enquiry? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteEnquiry(null)}
      />
    </AdminListLayout>
  );
}
