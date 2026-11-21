import { DEFAULT_PRODUCT_IMAGE } from "@/lib/products";

function safeDecodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function resolveProductImageUrl(url?: string | null) {
  const trimmed = url?.trim();
  if (!trimmed) {
    return DEFAULT_PRODUCT_IMAGE;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed
      .split("/")
      .map((segment, index) =>
        index === 0 ? segment : encodeURIComponent(safeDecodeSegment(segment))
      )
      .join("/");
  }

  return `/${encodeURIComponent(safeDecodeSegment(trimmed))}`;
}

export function resolveProductDocumentUrl(url?: string | null) {
  const trimmed = url?.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return resolveProductImageUrl(trimmed);
}
