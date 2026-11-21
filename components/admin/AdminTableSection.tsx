"use client";

import type { ReactNode } from "react";
import type { TableColumn } from "react-data-table-component";
import DataTable from "@/components/ui/DataTable";
import AdminTableSearch from "@/components/admin/AdminTableSearch";
import { ADMIN_TABLE_DEFAULTS } from "@/lib/admin/tableStyles";

export interface AdminTableSectionProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  toolbar?: ReactNode;
  noDataMessage?: string;
  paginationPerPage?: number;
  fixedPageSize?: boolean;
  showRowIndex?: boolean;
  fullWidth?: boolean;
  keyField?: string;
  skeletonRows?: number;
  className?: string;
}

/**
 * Shared admin table wrapper — same skeleton, colors, and pagination
 * across products, categories, subcategories, users, and enquiry pages.
 */
export default function AdminTableSection<T>({
  columns,
  data,
  loading = false,
  search,
  toolbar,
  noDataMessage = "No records found.",
  paginationPerPage = ADMIN_TABLE_DEFAULTS.paginationPerPage,
  fixedPageSize = ADMIN_TABLE_DEFAULTS.fixedPageSize,
  showRowIndex = ADMIN_TABLE_DEFAULTS.showRowIndex,
  fullWidth = false,
  keyField = "id",
  skeletonRows,
  className = "",
}: AdminTableSectionProps<T>) {
  const hasHeader = Boolean(search || toolbar);

  return (
    <div className={`min-w-0 w-full space-y-4 ${fullWidth ? "" : "xl:col-span-3"} ${className}`}>
      {hasHeader && (
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          {search && (
            <AdminTableSearch
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
              className="w-full lg:flex-1 lg:max-w-md"
            />
          )}
          {toolbar && (
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:ml-auto">
              {toolbar}
            </div>
          )}
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        keyField={keyField}
        paginationPerPage={paginationPerPage}
        fixedPageSize={fixedPageSize}
        showRowIndex={showRowIndex}
        noDataMessage={noDataMessage}
        skeletonRows={skeletonRows ?? paginationPerPage}
      />
    </div>
  );
}
