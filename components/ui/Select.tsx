"use client";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  className?: string;
}

export default function Select({
  value,
  onChange,
  options,
  label,
  className = "",
}: SelectProps) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-muted">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none transition hover:border-primary/50 focus:border-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
