import { prisma } from "@/lib/prisma";
import { isValidImportAssetUrl } from "@/lib/productImportValidation";
import { validateProductImageFile } from "@/lib/productImageUtils";
import { access, mkdir, writeFile } from "fs/promises";
import path from "path";

const IMPORT_FETCH_HEADERS = {
  "User-Agent": "SubraProductImport/1.0",
};

export type SavedImagesResult = {
  saved: string[];
  failed: string[];
};

function normalizeImageSource(url: string) {
  let normalized = url.trim().replace(/^["']|["']$/g, "");
  if (!normalized) {
    return "";
  }

  if (/^public\/uploads\//i.test(normalized)) {
    normalized = normalized.replace(/^public/i, "");
  }

  if (/^uploads\//i.test(normalized)) {
    normalized = `/${normalized}`;
  }

  if (!/^[a-z]+:\/\//i.test(normalized) && /^www\./i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  if (
    !normalized.startsWith("/") &&
    !/^[a-z]+:\/\//i.test(normalized) &&
    !normalized.startsWith("data:image/")
  ) {
    normalized = `https://${normalized}`;
  }

  return normalized;
}

export async function localUploadExists(imageUrl: string) {
  const relative = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
  try {
    await access(path.join(process.cwd(), "public", relative));
    return true;
  } catch {
    return false;
  }
}

function getExtensionFromUrl(url: string, fallback = "jpg") {
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

export async function saveFileBuffer(buffer: Buffer, extension: string) {
  return saveImageBuffer(buffer, extension);
}

async function saveImageBuffer(buffer: Buffer, extension: string) {
  const uploadDir = path.join(process.cwd(), "public/uploads");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);
  return `/uploads/${fileName}`;
}

export function sanitizeUploadedImageName(originalName: string) {
  const baseName = path.basename(originalName || "image");
  const sanitized = baseName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return sanitized || "image.png";
}

export function validateUploadedImageFiles(
  files: FormDataEntryValue[],
  label = "Image"
): string | null {
  for (const entry of files) {
    if (!(entry instanceof File) || entry.size === 0) continue;
    const error = validateProductImageFile(entry, label);
    if (error) return error;
  }
  return null;
}

export async function saveUploadedImages(files: FormDataEntryValue[]) {
  const uploadDir = path.join(process.cwd(), "public/uploads");
  await mkdir(uploadDir, { recursive: true });

  const imagePaths: string[] = [];

  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = sanitizeUploadedImageName(file.name);
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);
    imagePaths.push(`/uploads/${fileName}`);
  }

  return imagePaths;
}

async function resolveStoredImageUrl(
  rawUrl: string,
  saved: string[],
  failed: string[]
) {
  const url = normalizeImageSource(rawUrl);
  if (!url) return;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    saved.push(url);
    return;
  }

  if (url.startsWith("/uploads/") || (url.startsWith("/") && !url.startsWith("//"))) {
    if (await localUploadExists(url)) {
      saved.push(url);
    } else {
      failed.push(rawUrl);
    }
    return;
  }

  try {
    if (url.startsWith("data:image/")) {
      const match = url.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) {
        failed.push(rawUrl);
        return;
      }

      const extension = match[1].toLowerCase();
      const buffer = Buffer.from(match[2], "base64");
      saved.push(await saveImageBuffer(buffer, extension));
      return;
    }

    const localPath = url.startsWith("uploads/") ? `/${url}` : `/${url}`;
    if (await localUploadExists(localPath)) {
      saved.push(localPath);
    } else {
      failed.push(rawUrl);
    }
  } catch {
    failed.push(rawUrl);
  }
}

export async function resolveImportImageUrls(
  urls: string[]
): Promise<SavedImagesResult> {
  const saved: string[] = [];
  const failed: string[] = [];

  for (const rawUrl of urls) {
    await resolveStoredImageUrl(rawUrl, saved, failed);
  }

  return { saved, failed };
}

export async function saveImagesFromUrls(urls: string[]): Promise<SavedImagesResult> {
  const saved: string[] = [];
  const failed: string[] = [];

  for (const rawUrl of urls) {
    const url = normalizeImageSource(rawUrl);
    if (!url) continue;

    if (url.startsWith("/uploads/") || (url.startsWith("/") && !url.startsWith("//"))) {
      if (await localUploadExists(url)) {
        saved.push(url);
      } else {
        failed.push(rawUrl);
      }
      continue;
    }

    try {
      if (url.startsWith("data:image/")) {
        await resolveStoredImageUrl(rawUrl, saved, failed);
        continue;
      }

      if (url.startsWith("http://") || url.startsWith("https://")) {
        const response = await fetch(url, { headers: IMPORT_FETCH_HEADERS });
        if (!response.ok) {
          saved.push(url);
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get("content-type") ?? "";
        let extension = "jpg";

        if (contentType.includes("png")) extension = "png";
        else if (contentType.includes("webp")) extension = "webp";
        else if (contentType.includes("gif")) extension = "gif";
        else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
          extension = "jpg";
        } else {
          extension = getExtensionFromUrl(url, extension);
        }

        saved.push(await saveImageBuffer(buffer, extension));
        continue;
      }

      const localPath = url.startsWith("uploads/") ? `/${url}` : `/${url}`;
      if (await localUploadExists(localPath)) {
        saved.push(localPath);
      } else {
        failed.push(rawUrl);
      }
    } catch {
      if (/^https?:\/\//i.test(url)) {
        saved.push(url);
      } else {
        failed.push(rawUrl);
      }
    }
  }

  return { saved, failed };
}

export async function savePrimaryProductImage(
  productId: number,
  primaryFile: FormDataEntryValue | null
) {
  if (!(primaryFile instanceof File) || primaryFile.size === 0) return null;

  const [imageUrl] = await saveUploadedImages([primaryFile]);
  if (!imageUrl) return null;

  await prisma.productImage.deleteMany({
    where: { productId, isPrimary: true },
  });

  await prisma.productImage.create({
    data: { imageUrl, isPrimary: true, productId },
  });

  return imageUrl;
}

export async function saveGalleryProductImages(
  productId: number,
  galleryFiles: FormDataEntryValue[]
) {
  const files = galleryFiles.filter(
    (file): file is File => file instanceof File && file.size > 0
  );

  if (files.length === 0) return [];

  const imagePaths = await saveUploadedImages(files);

  if (imagePaths.length === 0) return [];

  await prisma.productImage.createMany({
    data: imagePaths.map((imageUrl) => ({
      imageUrl,
      isPrimary: false,
      productId,
    })),
  });

  return imagePaths;
}

export async function saveImageBuffers(
  images: Array<{ buffer: Buffer; extension: string }>
) {
  const saved: string[] = [];

  for (const image of images) {
    if (!image.buffer?.length) continue;
    saved.push(await saveImageBuffer(image.buffer, image.extension || "png"));
  }

  return saved;
}
