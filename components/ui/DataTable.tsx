"use client";

import { useState } from "react";
import ReactDataTable, { type TableColumn } from "react-data-table-component";
import { RowIndexCell } from "@/components/admin/DetailCells";
import TableSkeleton from "@/components/ui/TableSkeleton";
import DataTablePagination from "@/components/ui/DataTablePagination";
import {
  ADMIN_TABLE_PAGE_OPTIONS,
  ADMIN_TABLE_PER_PAGE,
  ADMIN_TABLE_STYLES,
  TABLE_THEME,
} from "@/lib/admin/tableStyles";

export interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  keyField?: string;
  paginationPerPage?: number;
  showRowIndex?: boolean;
  noDataMessage?: string;
  fixedPageSize?: boolean;
  skeletonRows?: number;
  className?: string;
  responsive?: boolean;
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  keyField = "id",
  paginationPerPage = ADMIN_TABLE_PER_PAGE,
  showRowIndex = true,
  noDataMessage = "No records found.",
  fixedPageSize = false,
  skeletonRows,
  className = "",
  responsive = true,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const tableColumns: TableColumn<T>[] = showRowIndex
    ? [
        {
          name: "#",
          width: "70px",
          center: true,
          cell: (_row, rowIndex) => (
            <RowIndexCell
              index={(currentPage - 1) * paginationPerPage + rowIndex + 1}
            />
          ),
        },
        ...columns,
      ]
    : columns;

  if (loading) {
    return (
      <TableSkeleton
        columns={columns.length}
        rows={skeletonRows ?? paginationPerPage}
        showRowIndex={showRowIndex}
        className={className}
      />
    );
  }

  return (
    <div className={`${TABLE_THEME.wrapper} w-full max-w-full ${className}`}>
      <ReactDataTable
        columns={tableColumns}
        data={data}
        keyField={keyField as keyof T & string}
        pagination
        paginationServer={false}
        paginationPerPage={paginationPerPage}
        paginationRowsPerPageOptions={
          fixedPageSize ? [paginationPerPage] : ADMIN_TABLE_PAGE_OPTIONS
        }
        paginationComponent={DataTablePagination}
        paginationComponentOptions={{ noRowsPerPage: fixedPageSize }}
        onChangePage={setCurrentPage}
        responsive={responsive}
        highlightOnHover
        customStyles={ADMIN_TABLE_STYLES as never}
        noDataComponent={
          <div
            className="w-full py-20 text-center text-muted text-xs font-medium tracking-wide"
            style={{ backgroundColor: TABLE_THEME.emptyBg }}
          >
            {noDataMessage}
          </div>
        }
      />
    </div>
  );
}

export function TablePanel({
  children,
  search,
  fullWidth = false,
  fitViewport = false,
}: {
  children: React.ReactNode;
  search?: React.ReactNode;
  fullWidth?: boolean;
  fitViewport?: boolean;
}) {
  return (
    <div
      className={`min-w-0 w-full space-y-4 ${fullWidth ? "" : "xl:col-span-3"} ${
        fitViewport ? "xl:h-full xl:min-h-0 xl:flex xl:flex-col" : ""
      }`}
    >
      {search}
      <div className={fitViewport ? "xl:flex-1 xl:min-h-0 xl:overflow-auto" : ""}>
        {children}
      </div>
    </div>
  );
}
