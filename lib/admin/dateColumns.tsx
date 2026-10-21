import type { TableColumn } from "react-data-table-component";
import { DateCell } from "@/components/admin/DetailCells";

export function createdAtColumn<T extends { createdAt?: string | Date | null }>(
  width = "120px"
): TableColumn<T> {
  return {
    name: "Created",
    width,
    selector: (row) => (row.createdAt ? String(row.createdAt) : ""),
    cell: (row) => <DateCell value={row.createdAt} />,
  };
}

export function updatedAtColumn<T extends { updatedAt?: string | Date | null }>(
  width = "120px"
): TableColumn<T> {
  return {
    name: "Updated",
    width,
    selector: (row) => (row.updatedAt ? String(row.updatedAt) : ""),
    cell: (row) => <DateCell value={row.updatedAt} />,
  };
}
