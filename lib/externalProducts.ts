import { validateCasNumber } from "@/lib/validators";

export interface ExternalProductRecord {
  id: number;
  productCode: string;
  productName: string;
  casNo: string | null;
  type: string;
  brand: string;
  pack: string;
  hsn: string;
  gstPercent: number;
  sellingRate: number | null;
  units: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalProductPayload {
  productCode: string;
  productName: string;
  casNo: string | null;
  type: string;
  brand: string;
  pack: string;
  hsn: string;
  gstPercent: number;
  sellingRate: number | null;
  units: string;
}

export const EXTERNAL_PRODUCT_EXCEL_HEADERS = [
  "Product Code  (*)",
  "Product Name (*)",
  "CAS No.",
  "Type (*)",
  "Brand (*)",
  "Pack (*)",
  "HSN (*)",
  "GST% (*)",
  "Selling Rate",
  "Units (*)",
] as const;

export const EXTERNAL_PRODUCT_TEMPLATE_PATH =
  "/templates/external-product-import-template.xlsx";

function normalizeHeaderKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\(\*\)/g, "")
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();
}

const COLUMN_ALIASES = {
  productCode: ["product code", "code", "sku", "item code"],
  productName: ["product name", "name", "item name"],
  casNo: ["cas no", "cas number", "cas"],
  type: ["type", "product type", "category"],
  brand: ["brand", "make", "manufacturer"],
  pack: ["pack", "pack size", "packing"],
  hsn: ["hsn", "hsn code", "hsn sac"],
  gstPercent: ["gst%", "gst", "gst percent", "gst percentage", "gst rate"],
  sellingRate: ["selling rate", "rate", "price", "selling price", "unit price"],
  units: ["units", "unit", "uom"],
} as const;

type ColumnField = keyof typeof COLUMN_ALIASES;

export const REQUIRED_EXTERNAL_COLUMNS: Array<{
  field: ColumnField;
  label: string;
}> = [
  { field: "productCode", label: "Product Code (*)" },
  { field: "productName", label: "Product Name (*)" },
  { field: "type", label: "Type (*)" },
  { field: "brand", label: "Brand (*)" },
  { field: "pack", label: "Pack (*)" },
  { field: "hsn", label: "HSN (*)" },
  { field: "gstPercent", label: "GST% (*)" },
  { field: "units", label: "Units (*)" },
];

export function getMissingExternalImportColumns(
  rows: Record<string, unknown>[]
): string[] {
  const normalizedHeaders = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row ?? {})) {
      normalizedHeaders.add(normalizeHeaderKey(key));
    }
  }

  return REQUIRED_EXTERNAL_COLUMNS.filter(
    ({ field }) =>
      !COLUMN_ALIASES[field].some((alias) => normalizedHeaders.has(alias))
  ).map(({ label }) => label);
}

export function extractExternalRowValues(
  row: Record<string, unknown>
): Record<ColumnField, string> {
  const map = new Map<string, unknown>();
  for (const [key, value] of Object.entries(row ?? {})) {
    map.set(normalizeHeaderKey(key), value);
  }

  const readField = (field: ColumnField): string => {
    for (const alias of COLUMN_ALIASES[field]) {
      const value = map.get(alias);
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }
    return "";
  };

  return {
    productCode: readField("productCode"),
    productName: readField("productName"),
    casNo: readField("casNo"),
    type: readField("type"),
    brand: readField("brand"),
    pack: readField("pack"),
    hsn: readField("hsn"),
    gstPercent: readField("gstPercent"),
    sellingRate: readField("sellingRate"),
    units: readField("units"),
  };
}

function parseNumericValue(raw: unknown): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : null;
  }
  const cleaned = String(raw).replace(/[₹,%\s]/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateExternalProductInput(input: {
  productCode?: unknown;
  productName?: unknown;
  casNo?: unknown;
  type?: unknown;
  brand?: unknown;
  pack?: unknown;
  hsn?: unknown;
  gstPercent?: unknown;
  sellingRate?: unknown;
  units?: unknown;
}):
  | { valid: true; data: ExternalProductPayload }
  | { valid: false; errors: string[] } {
  const errors: string[] = [];

  const productCode = String(input.productCode ?? "").trim();
  const productName = String(input.productName ?? "").trim();
  const casNoRaw = String(input.casNo ?? "").trim();
  const type = String(input.type ?? "").trim();
  const brand = String(input.brand ?? "").trim();
  const pack = String(input.pack ?? "").trim();
  const hsn = String(input.hsn ?? "").trim();
  const units = String(input.units ?? "").trim();

  if (!productCode) errors.push("Product Code (*) is required");
  if (!productName) errors.push("Product Name (*) is required");
  if (!type) errors.push("Type (*) is required");
  if (!brand) errors.push("Brand (*) is required");
  if (!pack) errors.push("Pack (*) is required");
  if (!hsn) errors.push("HSN (*) is required");
  if (!units) errors.push("Units (*) is required");

  if (casNoRaw) {
    const casErr = validateCasNumber(casNoRaw, { required: false });
    if (casErr) errors.push(casErr);
  }

  const gstPercent = parseNumericValue(input.gstPercent);
  if (gstPercent === null) {
    errors.push("GST% (*) must be a valid number");
  } else if (gstPercent < 0 || gstPercent > 100) {
    errors.push("GST% (*) must be between 0 and 100");
  }

  const sellingRateRaw = String(input.sellingRate ?? "").trim();
  let sellingRate: number | null = null;
  if (sellingRateRaw !== "") {
    const parsedRate = parseNumericValue(input.sellingRate);
    if (parsedRate === null || parsedRate < 0) {
      errors.push("Selling Rate must be a valid non-negative number");
    } else {
      sellingRate = parsedRate;
    }
  }

  if (errors.length > 0 || gstPercent === null) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      productCode,
      productName,
      casNo: casNoRaw || null,
      type,
      brand,
      pack,
      hsn,
      gstPercent,
      sellingRate,
      units,
    },
  };
}

export function formatExternalRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || !Number.isFinite(Number(rate))) {
    return "Request Quote";
  }
  const value = Number(rate);
  if (value <= 0) return "Request Quote";
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

