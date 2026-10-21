import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/products";
import { resolveProductImageUrl } from "@/lib/productImageUrl";

export function RowIndexCell({ index }: { index: number }) {
  return (
    <span className="font-mono text-xs font-bold text-muted">{index}</span>
  );
}

export function IdCell({ id }: { id: number | string }) {
  return (
    <span className="font-mono text-xs font-bold text-muted">#{id}</span>
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
  const [failed, setFailed] = useState(false);
  const hasSource = Boolean(src?.trim());

  if (!hasSource) {
    return (
      <div
        className={`relative ${dimensions} overflow-hidden rounded-xl border border-border bg-surface flex items-center justify-center`}
      >
        <ImageIcon className="text-muted" size={14} />
      </div>
    );
  }

  const resolvedSrc = failed
    ? DEFAULT_PRODUCT_IMAGE
    : resolveProductImageUrl(src);

  return (
    <div
      className={`relative ${dimensions} overflow-hidden rounded-xl border border-border bg-surface flex items-center justify-center`}
    >
      <img
        src={resolvedSrc}
        alt={alt}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
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
  tone?: "blue" | "indigo" | "green";
}) {
  const tones = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  };

  return (
    <span
      className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
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
