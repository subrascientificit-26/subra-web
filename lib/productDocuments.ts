import {
  localUploadExists,
  saveFileBuffer,
  saveUploadedImages,
} from "@/lib/productImages";
import { isValidImportAssetUrl } from "@/lib/productImportValidation";
import path from "path";

const IMPORT_FETCH_HEADERS = {
  "User-Agent": "SubraProductImport/1.0",
};

const documentTypes = ["COA", "SDS", "OTHER"] as const;

export type ProductDocumentType = (typeof documentTypes)[number];

export function normalizeDocumentType(
  type: unknown,
  name?: string
): ProductDocumentType {
  if (type === "COA" || type === "SDS") {
    return type;
  }

  const label = String(name || "").toUpperCase();
  if (label.includes("COA")) return "COA";
  if (label.includes("SDS") || label.includes("MSDS")) return "SDS";
  return "OTHER";
}

export type ParsedProductDocument = {
  name: string;
  fileUrl: string;
  type: ProductDocumentType;
};

export async function parseProductDocumentsFromFormData(
  formData: FormData
): Promise<ParsedProductDocument[]> {
  const docsRaw = formData.get("documents")?.toString();
  const docsMeta = docsRaw ? JSON.parse(docsRaw) : [];

  if (!Array.isArray(docsMeta)) {
    return [];
  }

  const result: ParsedProductDocument[] = [];

  for (let index = 0; index < docsMeta.length; index += 1) {
    const meta = docsMeta[index];
    const name = String(meta?.name || meta?.label || "").trim();
    let fileUrl = String(meta?.fileUrl || "").trim();

    const file = formData.get(`document_${index}`);
    if (file instanceof File && file.size > 0) {
      const [uploaded] = await saveUploadedImages([file]);
      if (uploaded) {
        fileUrl = uploaded;
      }
    }

    if (!name || !fileUrl) {
      continue;
    }

    result.push({
      name,
      fileUrl,
      type: normalizeDocumentType(meta?.type, name),
    });
  }

  return result;
}

function getExtensionFromUrl(url: string, fallback = "pdf") {
  try {
    const extension = path.extname(new URL(url).pathname).slice(1).toLowerCase();
    if (extension && /^[a-z0-9]+$/.test(extension)) {
      return extension;
    }
  } catch {
    // Ignore invalid URLs
  }

  return fallback;
}

function documentNameFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split("/").pop();
    return base || "Document";
  } catch {
    return "Document";
  }
}

export async function resolveImportDocuments(
  documents: ParsedProductDocument[]
): Promise<{ documents: ParsedProductDocument[]; failed: string[] }> {
  const resolved: ParsedProductDocument[] = [];
  const failed: string[] = [];

  for (const document of documents) {
    const fileUrl = document.fileUrl.trim();
    if (!fileUrl || !isValidImportAssetUrl(fileUrl)) {
      continue;
    }

    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      try {
        const response = await fetch(fileUrl, { headers: IMPORT_FETCH_HEADERS });
        if (!response.ok) {
          // Keep the original remote URL so the document link still works.
          resolved.push({ ...document, fileUrl });
          continue;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get("content-type") ?? "";
        let extension = "pdf";

        if (contentType.includes("pdf")) extension = "pdf";
        else if (contentType.includes("png")) extension = "png";
        else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
          extension = "jpg";
        } else {
          extension = getExtensionFromUrl(fileUrl, extension);
        }

        const savedUrl = await saveFileBuffer(buffer, extension);
        resolved.push({ ...document, fileUrl: savedUrl });
      } catch {
        // Network/fetch error — fall back to the original remote URL.
        resolved.push({ ...document, fileUrl });
      }
      continue;
    }

    if (await localUploadExists(fileUrl)) {
      resolved.push(document);
    } else {
      failed.push(`${document.name}: ${fileUrl}`);
    }
  }

  return { documents: resolved, failed };
}

export function parseImportDocumentEntry(entry: unknown): ParsedProductDocument | null {
  if (!entry) {
    return null;
  }

  if (typeof entry === "object") {
    const document = entry as Record<string, unknown>;
    const name = String(document.name || "").trim();
    const fileUrl = String(
      document.fileUrl || document.url || document.link || ""
    ).trim();

    if (!name || !fileUrl) {
      return null;
    }

    return {
      name,
      fileUrl,
      type: normalizeDocumentType(document.type, name),
    };
  }

  const text = String(entry).trim();
  if (!text) {
    return null;
  }

  if (/^https?:\/\//i.test(text)) {
    return {
      name: documentNameFromUrl(text),
      fileUrl: text,
      type: normalizeDocumentType(undefined, text),
    };
  }

  const pipeParts = text
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (pipeParts.length >= 2) {
    return {
      name: pipeParts[0],
      fileUrl: pipeParts[1],
      type: normalizeDocumentType(pipeParts[2], pipeParts[0]),
    };
  }

  const colonMatch = text.match(/^([^:]+):(https?:\/\/.+)$/i);
  if (colonMatch) {
    const name = colonMatch[1].trim();
    const fileUrl = colonMatch[2].trim();
    return {
      name,
      fileUrl,
      type: normalizeDocumentType(undefined, name),
    };
  }

  return null;
}

export function parseImportDocuments(value: unknown): ParsedProductDocument[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => parseImportDocumentEntry(item))
      .filter(Boolean) as ParsedProductDocument[];
  }

  const text = String(value).trim();
  if (!text) {
    return [];
  }

  return text
    .split(/[;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => parseImportDocumentEntry(item))
    .filter(Boolean) as ParsedProductDocument[];
}
