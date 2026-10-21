"use client";

import { CheckCircle2, XCircle, RefreshCw, MinusCircle, X } from "lucide-react";

export type ImportResultRow = {
  row: number;
  name: string;
  status: "created" | "updated" | "unchanged" | "failed";
  message: string;
  warnings?: string[];
};

type ImportResultsModalProps = {
  open: boolean;
  summary?: string | null;
  rows: ImportResultRow[];
  errors?: string[];
  onClose: () => void;
};

const STATUS_META: Record<
  ImportResultRow["status"],
  { label: string; summaryLabel: string; badge: string; Icon: typeof CheckCircle2 }
> = {
  created: {
    label: "Created",
    summaryLabel: "product(s) created",
    badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Icon: CheckCircle2,
  },
  updated: {
    label: "Updated",
    summaryLabel: "product(s) updated",
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Icon: RefreshCw,
  },
  unchanged: {
    label: "Duplicate",
    summaryLabel: "duplicate(s) (already exists, no changes)",
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Icon: MinusCircle,
  },
  failed: {
    label: "Failed",
    summaryLabel: "row(s) failed",
    badge: "bg-red-500/10 text-red-500 border-red-500/20",
    Icon: XCircle,
  },
};

export default function ImportResultsModal({
  open,
  summary,
  rows,
  errors = [],
  onClose,
}: ImportResultsModalProps) {
  if (!open) return null;

  const counts = rows.reduce(
    (acc, row) => {
      acc[row.status] += 1;
      return acc;
    },
    { created: 0, updated: 0, unchanged: 0, failed: 0 }
  );

  const failedRows = rows.filter((row) => row.status === "failed");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Excel Import Results
            </h2>
            {summary ? (
              <p className="mt-1 text-sm text-muted">{summary}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-elevated hover:text-foreground"
            aria-label="Close import results"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {errors.length > 0 ? (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-500">
                Import could not be completed
              </p>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li
                    key={index}
                    className="text-sm text-red-400"
                  >
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {rows.length > 0 ? (
            <ul className="space-y-2">
              {(
                ["created", "updated", "unchanged", "failed"] as const
              ).map((status) => {
                if (counts[status] === 0) return null;
                const meta = STATUS_META[status];
                const Icon = meta.Icon;
                return (
                  <li
                    key={status}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${meta.badge}`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-semibold">
                      {counts[status]} {meta.summaryLabel}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : errors.length === 0 ? (
            <p className="text-sm text-muted">No rows were processed.</p>
          ) : null}

          {failedRows.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-500">
                Failed rows
              </p>
              <ul className="space-y-2">
                {failedRows.map((row) => (
                  <li
                    key={row.row}
                    className="rounded-xl border border-red-500/20 bg-red-500/5 p-3"
                  >
                    <p className="truncate text-sm font-semibold text-foreground">
                      Row {row.row}
                      {row.name ? ` — ${row.name}` : ""}
                    </p>
                    <p className="mt-0.5 text-sm text-red-400">{row.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end border-t border-border p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
