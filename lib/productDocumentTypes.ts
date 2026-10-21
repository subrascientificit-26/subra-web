const documentTypes = ["COA", "SDS", "OTHER"] as const;

export type ProductDocumentType = (typeof documentTypes)[number];

export function normalizeDocumentType(
  type: unknown,
  name?: string
): ProductDocumentType {
  const label = String(name || "").toUpperCase();
  if (label.includes("COA")) return "COA";
  if (label.includes("SDS") || label.includes("MSDS")) return "SDS";

  if (typeof type === "string" && documentTypes.includes(type as ProductDocumentType)) {
    return type as ProductDocumentType;
  }

  return "OTHER";
}

export type ParsedProductDocument = {
  name: string;
  fileUrl: string;
  type: ProductDocumentType;
};
