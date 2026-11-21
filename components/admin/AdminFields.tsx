"use client";

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { RequiredMark } from "@/components/ui/FieldLabel";

const fieldClass =
  "w-full rounded-xl border border-border bg-surface-elevated px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted";
const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-wider text-muted";
const errorClass = "mt-1.5 text-[11px] font-medium text-red-600 theme-dark:text-red-400";

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function AdminField({ label, error, required = false, children }: FieldProps) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <RequiredMark />}
      </label>
      {children}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}

export function AdminInput({
  label,
  error,
  required = false,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <AdminField label={label} error={error} required={required}>
      <input
        {...props}
        required={required}
        className={`${fieldClass} ${error ? "border-red-500 focus:border-red-500" : ""} ${className}`}
      />
    </AdminField>
  );
}

export function AdminTextarea({
  label,
  error,
  required = false,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <AdminField label={label} error={error} required={required}>
      <textarea
        {...props}
        required={required}
        className={`${fieldClass} resize-none ${error ? "border-red-500 focus:border-red-500" : ""} ${className}`}
      />
    </AdminField>
  );
}

export function AdminSelect({
  label,
  error,
  required = false,
  options,
  placeholder,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  required?: boolean;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}) {
  return (
    <AdminField label={label} error={error} required={required}>
      <select
        {...props}
        required={required}
        className={`${fieldClass} ${error ? "border-red-500 focus:border-red-500" : ""} ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </AdminField>
  );
}

export function AdminFormActions({
  submitLabel,
  saving,
  showCancel,
  onCancel,
}: {
  submitLabel: string;
  saving?: boolean;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 pt-2">
      <button
        type="submit"
        disabled={saving}
        className="w-full h-11 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm disabled:opacity-40 transition-all shadow-sm"
      >
        {saving ? "Saving..." : submitLabel}
      </button>
      {showCancel && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="w-full h-11 rounded-xl border border-border bg-surface-elevated text-muted font-medium text-sm hover:border-primary/40 hover:text-foreground transition-all"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

export function AdminCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
