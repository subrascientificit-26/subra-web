"use client";

import Link from "next/link";
import { X, Mail, Phone, Building2, Package, Calendar, UserCheck, UserX } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export type EnquiryDetail = {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  subject: string;
  productCategory: string | null;
  productId: number | null;
  message: string;
  hasAccount: boolean;
  date: string;
  createdAt: string;
};

type EnquiryDetailModalProps = {
  enquiry: EnquiryDetail | null;
  onClose: () => void;
};

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 rounded-lg bg-surface-elevated p-2 text-muted">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>
        <div className="mt-0.5 text-sm text-foreground break-words">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function EnquiryDetailModal({
  enquiry,
  onClose,
}: EnquiryDetailModalProps) {
  if (!enquiry) return null;

  const createdDisplay = (() => {
    const parsed = new Date(enquiry.createdAt);
    return Number.isNaN(parsed.getTime())
      ? enquiry.date
      : parsed.toLocaleString("en-IN");
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {enquiry.subject || "Enquiry"}
            </h2>
            <p className="mt-1 text-sm text-muted">{enquiry.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-elevated hover:text-foreground"
            aria-label="Close enquiry details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field icon={UserCheck} label="Full Name">
              <span className="font-semibold">{enquiry.fullName}</span>
            </Field>

            <Field icon={Building2} label="Company">
              {enquiry.companyName || "—"}
            </Field>

            <Field icon={Mail} label="Email">
              <a
                href={`mailto:${enquiry.email}`}
                className="text-[#0b5cff] hover:underline"
              >
                {enquiry.email}
              </a>
            </Field>

            <Field icon={Phone} label="Phone">
              <a
                href={`tel:${enquiry.phoneNumber}`}
                className="text-[#0b5cff] hover:underline"
              >
                {enquiry.phoneNumber || "—"}
              </a>
            </Field>

            <Field icon={Package} label="Product">
              {enquiry.productCategory ? (
                enquiry.productId ? (
                  <Link
                    href={ROUTES.productDetail(enquiry.productId)}
                    className="text-[#0b5cff] hover:underline"
                  >
                    {enquiry.productCategory}
                  </Link>
                ) : (
                  enquiry.productCategory
                )
              ) : (
                "—"
              )}
            </Field>

            <Field icon={Calendar} label="Received">
              {createdDisplay}
            </Field>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Message / Requirements
            </p>
            <div className="whitespace-pre-wrap rounded-xl border border-border bg-surface-elevated p-4 text-sm text-foreground">
              {enquiry.message || "—"}
            </div>
          </div>

          <div
            className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-medium ${
              enquiry.hasAccount
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                : "border-amber-500/20 bg-amber-500/5 text-amber-500"
            }`}
          >
            {enquiry.hasAccount ? (
              <>
                <UserCheck className="h-5 w-5 shrink-0" />
                <span>An account exists for this email address.</span>
              </>
            ) : (
              <>
                <UserX className="h-5 w-5 shrink-0" />
                <span>No account is linked to this email address.</span>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-border p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
