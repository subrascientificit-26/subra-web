"use client";

import { FaSearch, FaTimes } from "react-icons/fa";
import { ADMIN_SEARCH_CLASS } from "@/lib/admin/formStyles";

interface AdminTableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AdminTableSearch({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: AdminTableSearchProps) {
  return (
    <div className={`relative flex-1 max-w-md ${className}`}>
      <FaSearch
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        size={12}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={ADMIN_SEARCH_CLASS}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <FaTimes size={10} />
        </button>
      )}
    </div>
  );
}
