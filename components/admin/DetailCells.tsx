import { useState } from "react";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/products";
import { resolveProductImageUrl } from "@/lib/productImageUrl";

export function RowIndexCell({ index }: { index: number }) {
  return (
    <span className="font-mono text-xs font-bold text-foreground/80">{index}</span>
  );
}

export function IdCell({ id }: { id: number | string }) {
  return (
    <span className="font-mono text-xs font-bold text-primary">#{id}</span>
  );
}

export function ImageCell({
  src,
  alt = "",
  size = "md",
}: {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md";
}) {
  const dimensions = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasSource = Boolean(src?.trim());
  const failed = Boolean(hasSource && failedSrc === src);

  const resolvedSrc =
    !hasSource || failed
      ? DEFAULT_PRODUCT_IMAGE
      : resolveProductImageUrl(src);

  return (
    <div
      className={`relative ${dimensions} overflow-hidden rounded-xl border border-border bg-surface flex items-center justify-center`}
    >
      <img
        src={resolvedSrc}
        alt={alt || "Default image"}
        className="h-full w-full object-cover"
        onError={() => {
          if (hasSource) {
            setFailedSrc(src ?? null);
          }
        }}
      />
    </div>
  );
}

export function DescriptionCell({ text }: { text?: string | null }) {
  return (
    <span className="line-clamp-2 text-xs leading-relaxed text-muted">
      {text?.trim() || "—"}
    </span>
  );
}

export function BadgeCell({
  label,
  tone = "blue",
}: {
  label: string;
  tone?: "blue" | "indigo" | "green" | "purple" | "amber" | "red";
}) {
  const tones: Record<string, string> = {
    blue: "bg-blue-100 border-blue-300 text-blue-800 font-semibold theme-dark:bg-blue-500/20 theme-dark:border-blue-500/40 theme-dark:text-blue-300",
    indigo: "bg-indigo-100 border-indigo-300 text-indigo-800 font-semibold theme-dark:bg-indigo-500/20 theme-dark:border-indigo-500/40 theme-dark:text-indigo-300",
    green: "bg-emerald-100 border-emerald-300 text-emerald-800 font-semibold theme-dark:bg-emerald-500/20 theme-dark:border-emerald-500/40 theme-dark:text-emerald-300",
    purple: "bg-purple-100 border-purple-300 text-purple-800 font-semibold theme-dark:bg-purple-500/20 theme-dark:border-purple-500/40 theme-dark:text-purple-300",
    amber: "bg-amber-100 border-amber-300 text-amber-800 font-semibold theme-dark:bg-amber-500/20 theme-dark:border-amber-500/40 theme-dark:text-amber-300",
    red: "bg-rose-100 border-rose-300 text-rose-800 font-semibold theme-dark:bg-rose-500/20 theme-dark:border-rose-500/40 theme-dark:text-rose-300",
  };

  return (
    <span
      className={`rounded-lg border px-2.5 py-1 text-xs ${tones[tone] ?? tones.blue}`}
    >
      {label}
    </span>
  );
}

export function DateCell({ value }: { value?: string | Date | null }) {
  if (!value) {
    return <span className="text-xs text-muted">—</span>;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return <span className="text-xs text-muted">—</span>;
  }

  return (
    <span className="text-xs text-muted whitespace-nowrap">
      {date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}
    </span>
  );
}
