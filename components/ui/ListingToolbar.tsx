"use client";

import { ReactNode } from "react";
import Select from "./Select";
// import ViewToggle from "./ViewToggle";

interface SortOption {
  value: string;
  label: string;
}

interface ListingToolbarProps {
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOptions: SortOption[];
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  leftActions?: ReactNode;
  resultCount?: number;
}

export default function ListingToolbar({
  sortBy,
  onSortChange,
  sortOptions,
  viewMode,
  onViewModeChange,
  leftActions,
  resultCount,
}: ListingToolbarProps) {
  return (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div className="flex flex-wrap items-center gap-2">
      {leftActions}

      {resultCount !== undefined && (
        <p className="text-sm text-muted">
          {resultCount === 0
            ? "Showing 0 results"
            : `Showing ${resultCount} result${resultCount === 1 ? "" : "s"}`}
        </p>
      )}
    </div>

    <div className="flex items-center gap-3">
      <Select
        value={sortBy}
        onChange={onSortChange}
        options={sortOptions}
      />
    </div>
  </div>
);
}
