'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { PAGE_CONTAINER_CLASS } from '@/lib/layout';

interface AdminListLayoutProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  onCreateClick?: () => void;
  createButtonLabel?: string;
  totalCount?: number;
  icon?: React.ReactNode;
  error?: string;
  success?: string;
}

export default function AdminListLayout({
  title,
  description,
  children,
  onCreateClick,
  createButtonLabel = 'Create',
  totalCount,
  icon,
  error,
  success,
}: AdminListLayoutProps) {
  return (
    <div className="bg-background text-foreground py-3">
      <div className={PAGE_CONTAINER_CLASS}>
        {title && (
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {description && (
                <p className="mt-1 text-sm text-muted">{description}</p>
              )}
              {totalCount !== undefined && (
                <p className="mt-2 text-xs text-muted">{totalCount} total</p>
              )}
            </div>

            {onCreateClick && (
              <button
                type="button"
                onClick={onCreateClick}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
              >
                <Plus size={16} />
                {createButtonLabel}
              </button>
            )}
          </div>
        )}

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

        {/* CONTENT */}
        {children}
      </div>
    </div>
  );
}
