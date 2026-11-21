'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PAGE_CONTAINER_CLASS } from '@/lib/layout';

interface AdminFormLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => Promise<void>;
  isLoading?: boolean;
  submitButtonLabel?: string;
  error?: string;
  success?: string;
  showBackButton?: boolean;
}

export default function AdminFormLayout({
  title,
  description,
  children,
  onSubmit,
  isLoading = false,
  submitButtonLabel = 'Save',
  error,
  success,
  showBackButton = true,
}: AdminFormLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground py-3">
      <div className={PAGE_CONTAINER_CLASS}>
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="
                p-2 rounded-lg
                bg-surface-elevated hover:bg-surface
                border border-border
                text-muted hover:text-foreground
                transition-all duration-200
                cursor-pointer
              "
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {title}
            </h1>
            {description && (
              <p className="text-muted mt-1 text-sm">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/40 rounded-lg text-red-700 theme-dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/40 rounded-lg text-green-700 theme-dark:text-green-400">
            {success}
          </div>
        )}

        {/* FORM */}
        <form
          onSubmit={onSubmit}
          className="
            bg-surface
            border border-border
            rounded-xl
            p-6 md:p-8
            space-y-6
          "
        >
          {children}

          {/* SUBMIT BUTTON */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="
                px-6 py-2
                rounded-lg
                bg-primary hover:bg-primary-hover
                disabled:opacity-50 disabled:cursor-not-allowed
                text-white text-sm
                font-medium
                transition-all duration-200
                cursor-pointer
              "
            >
              {isLoading ? 'Saving...' : submitButtonLabel}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="
                px-6 py-2
                rounded-lg
                bg-surface-elevated hover:bg-surface
                border border-border
                text-muted hover:text-foreground
                text-sm
                font-medium
                transition-all duration-200
                cursor-pointer
              "
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
