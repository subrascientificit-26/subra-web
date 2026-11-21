import { existsSync } from "fs";
import path from "path";
import { validateCasNumber } from "@/lib/validators";

export { validateCasNumber };

export const IMPORT_REQUIRED_COLUMNS = [
  { keys: ["name", "product name", "product_name"], label: "Name" },
  { keys: ["category", "category_name"], label: "Category" },
  { keys: ["subcategory", "sub category", "sub_category"], label: "Sub Category" },
  { keys: ["description"], label: "Description" },
] as const;

export type ImportRowError = {
  row: number;
  name?: string;
  action: "create" | "update";
  errors: string[];
};

export type ImportRowResult = {
  row: number;
  name: string;
  status: "created" | "updated" | "unchanged" | "failed";
  message: string;
  warnings?: string[];
};

type ImportExistingProduct = {
  name: string;
  subCategoryId: number;
  price: number;
  stock: number;
  shortDescription: string | null;
  description: string | null;
  casNumber: string | null;
  molecularFormula: string | null;
  molecularWeight: number | null;
  applications: string | null;
  safetyInfo: string | null;
  isInStock: boolean;
  isArGrade: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isFavorite: boolean;
  images: Array<{ imageUrl: string; isPrimary?: boolean }>;
  specifications: Array<{ parameter: string; value: string }>;
  documents: Array<{ name: string; fileUrl: string; type: string }>;
  packSizes: Array<{ size: string; price: number; stock: number }>;
};

function normalizeText(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).trim();
}

export function isValidImportAssetUrl(value: unknown) {
  const normalized = normalizeText(value).replace(/^["']|["']$/g, "");
  if (!normalized) {
    return false;
  }

  const lower = normalized.toLowerCase();
  if (["undefined", "null", "#undefined", "#null", "nan"].includes(lower)) {
    return false;
  }

  if (/^#(?!https?:)/i.test(normalized)) {
    return false;
  }

  return true;
}

export function isImportRowEmpty(row: Record<string, unknown>) {
  return Object.values(row).every((value) => normalizeText(value) === "");
}

export function hasImportColumn(headers: Set<string>, keys: string[]) {
  return keys.some((key) => headers.has(key.toLowerCase()));
}

export function getMissingImportColumns(headers: Set<string>) {
  return IMPORT_REQUIRED_COLUMNS.filter(
    (column) => !hasImportColumn(headers, [...column.keys])
  ).map((column) => column.label);
}

export function localFileExists(fileUrl: string) {
  const normalized = normalizeText(fileUrl);
  if (!normalized) {
    return false;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return true;
  }

  const relative = normalized.startsWith("/")
    ? normalized.slice(1)
    : normalized;

  return existsSync(path.join(process.cwd(), "public", relative));
}

export function validateImportRow(input: {
  rowNumber: number;
  name: string;
  category: string;
  subCategory: string;
  description: string;
  casNumber?: string;
  imageUrls: string[];
  failedImageUrls?: string[];
  documentUrls: string[];
  isNewProduct: boolean;
}): ImportRowError | null {
  const errors: string[] = [];

  if (!input.name) {
    errors.push("Product name is required");
  }

  if (input.isNewProduct) {
    if (!input.category) {
      errors.push("Category is required");
    }

    if (!input.subCategory) {
      errors.push("Sub Category is required");
    }

    if (!input.description) {
      errors.push("Description is required");
    }
  }

  if (input.casNumber) {
    const casError = validateCasNumber(input.casNumber);
    if (casError) {
      errors.push(casError);
    }
  }

  for (const imageUrl of input.failedImageUrls ?? []) {
    errors.push(`Could not store image: ${imageUrl}`);
  }

  for (const imageUrl of input.imageUrls) {
    if (/^https?:\/\//i.test(imageUrl)) {
      continue;
    }

    if (!localFileExists(imageUrl)) {
      errors.push(`Image file not found: ${imageUrl}`);
    }
  }

  for (const documentUrl of input.documentUrls) {
    if (!localFileExists(documentUrl)) {
      errors.push(`Document file not found: ${documentUrl}`);
    }
  }

  if (!errors.length) {
    return null;
  }

  return {
    row: input.rowNumber,
    name: input.name || undefined,
    action: input.isNewProduct ? "create" : "update",
    errors,
  };
}

function normalizeNullableText(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text || null;
}

function collectionsEqual<T>(
  left: T[],
  right: T[],
  isEqual: (a: T, b: T) => boolean
) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => isEqual(item, right[index]));
}

export function formatImportAssetWarnings(input: {
  failedImageUrls: string[];
  failedDocumentUrls: string[];
}) {
  const warnings: string[] = [];

  for (const imageUrl of input.failedImageUrls) {
    warnings.push(`Could not store image: ${imageUrl}`);
  }

  for (const documentUrl of input.failedDocumentUrls) {
    warnings.push(`Could not store document: ${documentUrl}`);
  }

  return warnings;
}

export function formatImportRowMessage(
  action: "create" | "update",
  outcome: "success" | "unchanged" | "failure",
  detail?: string,
  _warnings?: string[]
) {
  if (outcome === "failure") {
    const prefix = action === "create" ? "Create failed" : "Update failed";
    return detail ? `${prefix}: ${detail}` : prefix;
  }

  if (outcome === "unchanged") {
    return "No field changes detected.";
  }

  return action === "create"
    ? "Product created successfully."
    : "Product updated successfully.";
}

export function hasImportUpdateChanges(input: {
  existing: ImportExistingProduct;
  updateData: Record<string, unknown>;
  imageUrls: string[];
  specifications: Array<{ parameter: string; value: string }>;
  documents: Array<{ name: string; fileUrl: string; type: string }>;
  packSizes: Array<{ size: string; price: number; stock: number }>;
  hasImagesColumn: boolean;
  hasSpecsColumn: boolean;
  hasDocumentsColumn: boolean;
  hasPackSizesColumn: boolean;
}) {
  const { existing, updateData } = input;

  const scalarFields: Array<{
    key: keyof ImportExistingProduct;
    normalize?: (value: unknown) => unknown;
  }> = [
    { key: "name" },
    { key: "subCategoryId" },
    { key: "price" },
    { key: "stock" },
    { key: "shortDescription", normalize: normalizeNullableText },
    { key: "description", normalize: normalizeNullableText },
    { key: "casNumber", normalize: normalizeNullableText },
    { key: "molecularFormula", normalize: normalizeNullableText },
    { key: "molecularWeight" },
    { key: "applications", normalize: normalizeNullableText },
    { key: "safetyInfo", normalize: normalizeNullableText },
    { key: "isInStock" },
    { key: "isArGrade" },
    { key: "isBestSeller" },
    { key: "isFeatured" },
    { key: "isFavorite" },
  ];

  for (const field of scalarFields) {
    if (!(field.key in updateData)) {
      continue;
    }

    const nextValue = field.normalize
      ? field.normalize(updateData[field.key])
      : updateData[field.key];
    const currentValue = field.normalize
      ? field.normalize(existing[field.key])
      : existing[field.key];

    if (nextValue !== currentValue) {
      return true;
    }
  }

  if (
    input.hasImagesColumn &&
    !collectionsEqual(
      existing.images.map((image) => image.imageUrl),
      input.imageUrls,
      (left, right) => left === right
    )
  ) {
    return true;
  }

  if (
    input.hasSpecsColumn &&
    !collectionsEqual(
      existing.specifications.map((spec) => ({
        parameter: spec.parameter,
        value: spec.value,
      })),
      input.specifications,
      (left, right) =>
        left.parameter === right.parameter && left.value === right.value
    )
  ) {
    return true;
  }

  if (
    input.hasDocumentsColumn &&
    !collectionsEqual(
      existing.documents.map((document) => ({
        name: document.name,
        fileUrl: document.fileUrl,
        type: document.type,
      })),
      input.documents.map((document) => ({
        name: document.name,
        fileUrl: document.fileUrl,
        type: document.type,
      })),
      (left, right) =>
        left.name === right.name &&
        left.fileUrl === right.fileUrl &&
        left.type === right.type
    )
  ) {
    return true;
  }

  if (
    input.hasPackSizesColumn &&
    !collectionsEqual(
      existing.packSizes.map((packSize) => ({
        size: packSize.size,
        price: packSize.price,
        stock: packSize.stock,
      })),
      input.packSizes,
      (left, right) =>
        left.size === right.size &&
        left.price === right.price &&
        left.stock === right.stock
    )
  ) {
    return true;
  }

  return false;
}

export function formatImportErrors(errors: ImportRowError[]) {
  return errors.map((entry) => {
    const label = entry.name ? `Row ${entry.row} (${entry.name})` : `Row ${entry.row}`;
    return `${label}: ${entry.errors.join("; ")}`;
  });
}
