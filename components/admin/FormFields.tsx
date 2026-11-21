'use client';

import React from 'react';
import { RequiredMark } from '@/components/ui/FieldLabel';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, error, required = false, children }: FormFieldProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
        {required && <RequiredMark />}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600 theme-dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export function FormInput({ label, error, required = false, ...props }: FormInputProps) {
  return (
    <FormField label={label || ''} error={error} required={required}>
      <input
        {...props}
        required={required}
        className={`
          w-full
          bg-surface-elevated
          border border-border
          rounded-lg
          h-11
          px-4
          text-foreground
          placeholder:text-muted
          outline-none
          focus:border-primary
          transition-colors duration-200
          ${error ? 'border-red-500' : ''}
          ${props.className || ''}
        `}
      />
    </FormField>
  );
}

interface FormTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export function FormTextArea({ label, error, required = false, ...props }: FormTextAreaProps) {
  return (
    <FormField label={label || ''} error={error} required={required}>
      <textarea
        {...props}
        required={required}
        className={`
          w-full
          bg-surface-elevated
          border border-border
          rounded-lg
          px-4 py-3
          text-foreground
          placeholder:text-muted
          outline-none
          focus:border-primary
          transition-colors duration-200
          ${error ? 'border-red-500' : ''}
          ${props.className || ''}
        `}
      />
    </FormField>
  );
}

interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  options: { value: string | number; label: string }[];
}

export function FormSelect({
  label,
  error,
  required = false,
  options,
  ...props
}: FormSelectProps) {
  return (
    <FormField label={label || ''} error={error} required={required}>
      <select
        {...props}
        required={required}
        className={`
          w-full
          bg-surface-elevated
          border border-border
          rounded-lg
          h-11
          px-4
          text-foreground
          outline-none
          focus:border-primary
          transition-colors duration-200
          ${error ? 'border-red-500' : ''}
          ${props.className || ''}
        `}
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
