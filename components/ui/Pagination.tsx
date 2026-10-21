"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGINATION_VISIBLE_PAGES } from "@/lib/admin/tableStyles";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  maxVisible?: number;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 5,
  maxVisible = PAGINATION_VISIBLE_PAGES,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = totalItems
    ? Math.min(startIndex + itemsPerPage, totalItems)
    : startIndex + itemsPerPage;

  const visiblePages = getVisiblePages(currentPage, totalPages, maxVisible);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 ${className}`}>
      {totalItems !== undefined && (
        <p className="text-sm text-muted">
          Showing {startIndex + 1} to {endIndex} of {totalItems}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
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
              onClick={() => onPageChange(page)}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "min-w-[36px] rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/30"
                  : "min-w-[36px] rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-elevated hover:text-foreground"
              }
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-border p-2 text-foreground transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function getVisiblePages(
  current: number,
  total: number,
  maxVisible = PAGINATION_VISIBLE_PAGES
): number[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;

  if (end > total) {
    end = total;
    start = total - maxVisible + 1;
  }

  return Array.from({ length: maxVisible }, (_, index) => start + index);
}
