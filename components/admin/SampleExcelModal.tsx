"use client";

import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, Loader2, X } from "lucide-react";

export type SampleExcelSheet = {
  name: string;
  headers: string[];
  rows: string[][];
};

type SampleExcelModalProps = {
  open: boolean;
  loading: boolean;
  error?: string | null;
  sheets: SampleExcelSheet[];
  downloadHref: string;
  downloadFileName: string;
  onClose: () => void;
};

const REQUIRED_HEADER_SET = new Set([
  "name",
  "product name",
  "product_name",
  "category",
  "category_name",
  "subcategory",
  "sub category",
  "sub_category",
  "description",
]);

function isRequiredHeader(header: string) {
  return REQUIRED_HEADER_SET.has(header.trim().toLowerCase());
}

export default function SampleExcelModal({
  open,
  loading,
  error,
  sheets,
  downloadHref,
  downloadFileName,
  onClose,
}: SampleExcelModalProps) {
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const activeSheet = sheets[selectedSheetIndex] ?? sheets[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-3 sm:px-4 py-4 sm:py-6 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 sm:gap-4 border-b border-border p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-elevated text-primary">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Sample Excel Preview
                </h2>
                <span className="rounded-md border border-border bg-surface-elevated px-2 py-0.5 font-mono text-[11px] text-muted">
                  {downloadFileName}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Review the column format and sample row values below. Columns marked with{" "}
                <span className="font-semibold text-danger">*</span> are required for new products.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-elevated hover:text-foreground"
            aria-label="Close sample Excel preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-3 sm:p-5 flex flex-col gap-3">
          {sheets.length > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              {sheets.map((sheet, index) => {
                const isActive = (sheets[selectedSheetIndex] ? selectedSheetIndex : 0) === index;
                return (
                  <button
                    key={sheet.name}
                    type="button"
                    onClick={() => setSelectedSheetIndex(index)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-surface-elevated text-muted hover:text-foreground"
                    }`}
                  >
                    {sheet.name}
                  </button>
                );
              })}
            </div>
          ) : null}

          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-muted">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">Loading sample Excel preview...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 theme-dark:text-red-400">
              {error}
            </div>
          ) : activeSheet ? (
            <div className="custom-scrollbar flex-1 overflow-auto rounded-xl border border-border bg-surface">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-surface-elevated">
                  <tr className="border-b border-border">
                    <th className="sticky left-0 z-20 w-12 border-r border-border bg-surface-elevated px-3 py-3 text-center font-bold uppercase tracking-wider text-muted">
                      #
                    </th>
                    {activeSheet.headers.map((header, columnIndex) => (
                      <th
                        key={`${header}-${columnIndex}`}
                        className="min-w-[145px] border-r border-border px-3 py-3 font-bold uppercase tracking-wider text-foreground last:border-r-0 whitespace-nowrap"
                      >
                        <span>{header || `Column ${columnIndex + 1}`}</span>
                        {isRequiredHeader(header) ? (
                          <span className="ml-1 text-danger" title="Required column">
                            *
                          </span>
                        ) : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeSheet.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeSheet.headers.length + 1}
                        className="px-4 py-8 text-center text-muted"
                      >
                        No sample rows found in this sheet.
                      </td>
                    </tr>
                  ) : (
                    activeSheet.rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="hover:bg-surface-elevated/70 transition-colors"
                      >
                        <td className="sticky left-0 border-r border-border bg-surface-elevated px-3 py-3 text-center font-mono font-semibold text-muted">
                          {rowIndex + 1}
                        </td>
                        {activeSheet.headers.map((_, columnIndex) => {
                          const cellValue = row[columnIndex] ?? "";
                          return (
                            <td
                              key={columnIndex}
                              className="max-w-[260px] border-r border-border px-3 py-3 align-top text-foreground last:border-r-0 break-words whitespace-pre-wrap"
                            >
                              {cellValue ? (
                                cellValue
                              ) : (
                                <span className="text-muted/60">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted">
              No preview data available.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
          <p className="text-xs text-muted">
            {activeSheet
              ? `${activeSheet.headers.length} columns · ${activeSheet.rows.length} sample row(s)`
              : "Preview ready"}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40"
            >
              Close
            </button>

            <a
              href={downloadHref}
              download={downloadFileName}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
            >
              <Download size={15} />
              Download Sample Excel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

