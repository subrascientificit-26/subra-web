"use client";

import Link from "next/link";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";

export default function AdminActionButtons({
  onView,
  viewHref,
  onEdit,
  editHref,
  onDelete,
}: {
  onView?: () => void;
  viewHref?: string;
  onEdit?: () => void;
  editHref?: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-1.5">
      {viewHref ? (
        <Link
          href={viewHref}
          className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 theme-dark:bg-surface-elevated theme-dark:border-border theme-dark:text-blue-400 theme-dark:hover:text-blue-300 transition-all shadow-xs inline-flex items-center justify-center"
          title="View"
          aria-label="View"
        >
          <FaEye size={12} />
        </Link>
      ) : onView ? (
        <button
          type="button"
          onClick={onView}
          className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 theme-dark:bg-surface-elevated theme-dark:border-border theme-dark:text-blue-400 theme-dark:hover:text-blue-300 transition-all shadow-xs"
          title="View"
          aria-label="View"
        >
          <FaEye size={12} />
        </button>
      ) : null}
      {editHref ? (
        <Link
          href={editHref}
          className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 hover:border-amber-300 theme-dark:bg-surface-elevated theme-dark:border-border theme-dark:text-amber-400 theme-dark:hover:text-amber-300 transition-all shadow-xs inline-flex items-center justify-center"
          title="Edit"
        >
          <FaEdit size={12} />
        </Link>
      ) : onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 hover:border-amber-300 theme-dark:bg-surface-elevated theme-dark:border-border theme-dark:text-amber-400 theme-dark:hover:text-amber-300 transition-all shadow-xs"
          title="Edit"
        >
          <FaEdit size={12} />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onDelete}
        className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 hover:border-rose-300 theme-dark:bg-surface-elevated theme-dark:border-border theme-dark:text-rose-400 theme-dark:hover:text-rose-300 transition-all shadow-xs"
        title="Delete"
      >
        <FaTrash size={12} />
      </button>
    </div>
  );
}
