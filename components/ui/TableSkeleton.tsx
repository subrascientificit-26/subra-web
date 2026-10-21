"use client";

import { TABLE_THEME } from "@/lib/admin/tableStyles";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showPagination?: boolean;
  showRowIndex?: boolean;
  className?: string;
}

export default function TableSkeleton({
  columns = 5,
  rows = 5,
  showPagination = true,
  showRowIndex = true,
  className = "",
}: TableSkeletonProps) {
  const totalColumns = showRowIndex ? columns + 1 : columns;
  const columnWidths = ["w-8", "w-24", "w-32", "w-28", "w-20", "w-16", "w-36"];

  return (
    <div className={`${TABLE_THEME.wrapper} ${className}`} aria-busy="true" aria-label="Loading table">
      <div className="overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr
              className="border-b"
              style={{
                backgroundColor: TABLE_THEME.headBg,
                borderColor: TABLE_THEME.rowBorder,
              }}
            >
              {Array.from({ length: totalColumns }).map((_, index) => (
                <th key={`head-${index}`} className="px-4 py-4 text-left">
                  <div
                    className={`table-skeleton-shimmer h-3 rounded ${
                      index === 0 && showRowIndex ? "w-6 mx-auto" : columnWidths[index % columnWidths.length]
                    }`}
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr
                key={`row-${rowIndex}`}
                className="border-b"
                style={{
                  backgroundColor: TABLE_THEME.rowBg,
                  borderColor: TABLE_THEME.rowBorder,
                  minHeight: "68px",
                }}
              >
                {Array.from({ length: totalColumns }).map((_, colIndex) => (
                  <td key={`cell-${rowIndex}-${colIndex}`} className="px-4 py-5">
                    <div
                      className={`table-skeleton-shimmer h-3 rounded ${
                        colIndex === 0 && showRowIndex
                          ? "w-5 mx-auto"
                          : columnWidths[(colIndex + rowIndex) % columnWidths.length]
                      }`}
                      style={{ animationDelay: `${(rowIndex * 0.08 + colIndex * 0.04).toFixed(2)}s` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div
          className="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
          style={{
            backgroundColor: TABLE_THEME.paginationBg,
            borderTop: `1px solid ${TABLE_THEME.rowBorder}`,
          }}
        >
          <div className="table-skeleton-shimmer h-3 w-36 rounded" />
          <div className="flex items-center gap-2">
            <div className="table-skeleton-shimmer h-8 w-8 rounded-lg" />
            <div className="table-skeleton-shimmer h-8 w-8 rounded-lg" />
            <div className="table-skeleton-shimmer h-8 w-8 rounded-lg" />
            <div className="table-skeleton-shimmer h-8 w-8 rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
