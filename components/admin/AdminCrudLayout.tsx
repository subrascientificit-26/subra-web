"use client";

import type { ReactNode } from "react";

interface AdminCrudLayoutProps {
  title: string;
  description?: string;
  form?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
  compact?: boolean;
  fitViewport?: boolean;
}

export function AdminFormPanel({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`min-w-0 w-full xl:col-span-1 rounded-2xl bg-surface border border-border backdrop-blur-xl shadow-sm theme-dark:shadow-xl self-start flex flex-col min-h-0 ${
        compact
          ? "p-4 space-y-3 xl:max-h-full xl:overflow-y-auto"
          : "p-4 sm:p-5 space-y-4 sm:space-y-5 xl:sticky xl:top-6"
      }`}
    >
      <h2 className={`font-semibold text-foreground ${compact ? "text-base" : "text-lg"}`}>
        {title}
      </h2>
      <div className={compact ? "space-y-3" : "space-y-4"}>{children}</div>
    </div>
  );
}

export default function AdminCrudLayout({
  title,
  description,
  form,
  children,
  fullWidth = false,
  compact = false,
  fitViewport = false,
}: AdminCrudLayoutProps) {
  return (
    <div className="bg-background text-foreground selection:bg-blue-500/30 antialiased">
      <div
        className={`w-full space-y-4 ${fitViewport ? "xl:h-full xl:flex xl:flex-col xl:min-h-0" : "space-y-6"}`}
      >
        <div className="shrink-0">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted">{description}</p>
          )}
        </div>

        {form && !fullWidth ? (
          <div
            className={`grid grid-cols-1 xl:grid-cols-4 gap-4 xl:gap-6 min-h-0 ${
              fitViewport ? "xl:flex-1 xl:items-stretch" : "items-start"
            }`}
          >
            {form}
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
