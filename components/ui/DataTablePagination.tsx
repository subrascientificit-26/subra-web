"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationComponentProps } from "react-data-table-component";
import { getVisiblePages } from "@/components/ui/Pagination";
import { PAGINATION_VISIBLE_PAGES } from "@/lib/admin/tableStyles";

export default function DataTablePagination({
  rowsPerPage,
  rowCount,
  currentPage,
  onChangePage,
}: PaginationComponentProps) {
  const totalPages = Math.max(1, Math.ceil(rowCount / rowsPerPage));

  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(
    currentPage,
    totalPages,
    PAGINATION_VISIBLE_PAGES
  );
  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, rowCount);

  return (
    <div
      className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-2.5 sm:gap-4 border-t border-border px-3 sm:px-4 py-3 text-muted"
      style={{ backgroundColor: "var(--table-pagination-bg)" }}
    >
      <p className="text-xs font-medium">
        Showing {start} to {end} of {rowCount}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => onChangePage(currentPage - 1, rowCount)}
          disabled={currentPage <= 1}
          className="rounded-lg border border-border p-2 text-foreground transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {visiblePages.map((page) => {
          const isActive = currentPage === page;

          return (
            <button
              key={page}
              type="button"
              onClick={() => onChangePage(page, rowCount)}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "min-w-[34px] rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                  : "min-w-[34px] rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:bg-surface-elevated hover:text-foreground hover:border-primary"
              }
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onChangePage(currentPage + 1, rowCount)}
          disabled={currentPage >= totalPages}
          className="rounded-lg border border-border p-2 text-foreground transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
