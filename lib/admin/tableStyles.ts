export const ADMIN_TABLE_PER_PAGE = 5;
export const ADMIN_TABLE_PAGE_OPTIONS = [5, 10, 15, 20];
export const PAGINATION_VISIBLE_PAGES = 5;

/** Default props shared by all admin list tables */
export const ADMIN_TABLE_DEFAULTS = {
  paginationPerPage: ADMIN_TABLE_PER_PAGE,
  fixedPageSize: true,
  showRowIndex: true,
} as const;

/** Shared table color tokens — used by DataTable and TableSkeleton */
export const TABLE_THEME = {
  wrapper:
    "rounded-2xl border border-border overflow-hidden shadow-lg bg-surface",
  headBg: "var(--table-head-bg)",
  headText: "var(--table-head-text)",
  rowBg: "var(--table-row-bg)",
  rowHover: "var(--table-row-hover)",
  rowText: "var(--table-row-text)",
  rowBorder: "var(--table-row-border)",
  paginationBg: "var(--table-pagination-bg)",
  emptyBg: "var(--table-empty-bg)",
  skeletonBase: "#1e293b",
  skeletonHighlight: "#334155",
} as const;

export const ADMIN_TABLE_STYLES = {
  table: { style: { backgroundColor: "transparent" } },
  rows: {
    style: {
      backgroundColor: "var(--table-row-bg)",
      color: "var(--table-row-text)",
      minHeight: "68px",
      borderBottomColor: "var(--table-row-border)",
      "&:hover": { backgroundColor: "var(--table-row-hover)" },
    },
  },
  headCells: {
    style: {
      backgroundColor: "var(--table-head-bg)",
      color: "var(--table-head-text)",
      fontWeight: "700",
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
  },
  pagination: {
    style: {
      backgroundColor: "var(--table-pagination-bg)",
      color: "var(--table-head-text)",
      borderTop: "1px solid var(--table-row-border)",
    },
    pageButtonsStyle: {
      borderRadius: "8px",
      color: "var(--accent)",
      fill: "var(--accent)",
      backgroundColor: "transparent",
      "&:hover:not(:disabled)": {
        backgroundColor: "var(--table-row-hover)",
        color: "var(--foreground)",
      },
      "&:disabled": {
        color: "var(--muted)",
        fill: "var(--muted)",
      },
    },
  },
} as const;
