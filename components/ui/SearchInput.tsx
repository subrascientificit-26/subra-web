"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  onSubmit,
  className = "",
}: SearchInputProps) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") onSubmit?.();
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 py-3 ${className}`}
    >
      <Search size={16} className="flex-shrink-0 text-muted" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
      />
    </div>
  );
}
