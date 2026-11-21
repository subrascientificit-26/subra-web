"use client";

import Link from "next/link";
import { useState } from "react";
import {
  X,
  Mail,
  Phone,
  Building2,
  Package,
  Calendar,
  UserCheck,
  UserX,
  FileText,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { getEnquiryAttachmentName, isEnquiryImageUrl } from "@/lib/enquiry";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/products";
import { resolveProductImageUrl } from "@/lib/productImageUrl";

export type EnquiryDetail = {
  rawId?: number;
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  subject: string;
  productCategory: string | null;
  productId: number | null;
  message: string;
  fileUrl: string | null;
  hasAccount: boolean;
  date: string;
  createdAt: string;
};

type EnquiryDetailModalProps = {
  enquiry: EnquiryDetail | null;
  onClose: () => void;
  onDelete?: (enquiry: EnquiryDetail) => void;
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
  onDelete,
}: EnquiryDetailModalProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  if (!enquiry) return null;

  const attachmentUrl = enquiry.fileUrl?.trim()
    ? resolveProductImageUrl(enquiry.fileUrl)
    : "";
  const isImageAttachment =
    Boolean(attachmentUrl) && isEnquiryImageUrl(enquiry.fileUrl);
  const imageDisplaySrc =
    failedImageUrl === enquiry.fileUrl ? DEFAULT_PRODUCT_IMAGE : attachmentUrl;
  const attachmentLabel = getEnquiryAttachmentName(enquiry.fileUrl);

  const createdDisplay = (() => {
    const parsed = new Date(enquiry.createdAt);
    return Number.isNaN(parsed.getTime())
      ? enquiry.date
      : parsed.toLocaleString("en-IN");
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-4 py-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground break-words">
              {enquiry.subject || "Enquiry"}
            </h2>
            <p className="mt-1 text-sm text-muted">{enquiry.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-elevated hover:text-foreground shrink-0"
            aria-label="Close enquiry details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
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
                className="text-primary hover:underline"
              >
                {enquiry.email}
              </a>
            </Field>

            <Field icon={Phone} label="Phone">
              <a
                href={`tel:${enquiry.phoneNumber}`}
                className="text-primary hover:underline"
              >
                {enquiry.phoneNumber || "—"}
              </a>
            </Field>

            <Field icon={Package} label="Product">
              {enquiry.productCategory ? (
                enquiry.productId ? (
                  <Link
                    href={ROUTES.productDetail(enquiry.productId)}
                    className="text-primary hover:underline"
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

          {attachmentUrl && (
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Uploaded Image / Attachment
                </p>
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open File
                </a>
              </div>

              {isImageAttachment ? (
                <div className="overflow-hidden rounded-xl border border-border bg-surface-elevated p-3">
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={imageDisplaySrc}
                      alt={attachmentLabel || enquiry.subject || "Enquiry attachment"}
                      onError={() => setFailedImageUrl(enquiry.fileUrl)}
                      className="mx-auto max-h-80 w-auto max-w-full rounded-lg object-contain"
                    />
                  </a>
                  {attachmentLabel ? (
                    <p className="mt-2 truncate text-center text-xs text-muted">
                      {attachmentLabel}
                    </p>
                  ) : null}
                </div>
              ) : (
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated p-3 text-sm text-foreground transition hover:border-primary/50"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate font-medium">
                      {attachmentLabel || "View Attachment"}
                    </span>
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
                </a>
              )}
            </div>
          )}

          <div
            className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-medium ${
              enquiry.hasAccount
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 theme-dark:border-emerald-500/30 theme-dark:bg-emerald-500/10 theme-dark:text-emerald-400"
                : "border-amber-300 bg-amber-50 text-amber-800 theme-dark:border-amber-500/30 theme-dark:bg-amber-500/10 theme-dark:text-amber-400"
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

        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(enquiry)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 theme-dark:border-red-500/40 theme-dark:bg-red-500/10 theme-dark:text-red-400 theme-dark:hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
