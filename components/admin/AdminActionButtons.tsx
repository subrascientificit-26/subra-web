"use client";

import { FaEdit, FaTrash } from "react-icons/fa";

export default function AdminActionButtons({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        className="p-2 rounded-lg bg-surface border border-border hover:border-blue-500/30 text-muted hover:text-blue-400 transition-all shadow-sm"
        title="Edit"
      >
        <FaEdit size={12} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="p-2 rounded-lg bg-surface border border-border hover:border-red-500/30 text-muted hover:text-red-400 transition-all shadow-sm"
        title="Delete"
      >
        <FaTrash size={12} />
      </button>
    </div>
  );
}
