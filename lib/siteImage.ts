import { mkdir, writeFile } from "fs/promises";
import path from "path";

const SITE_UPLOAD_DIR = path.join(process.cwd(), "public/uploads/site");
const MAX_SITE_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/svg+xml",
]);

export async function saveSiteImage(
  file: File,
  prefix: "logo" | "favicon"
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Image must be JPG, PNG, WEBP, ICO, or SVG");
  }

  if (file.size > MAX_SITE_IMAGE_BYTES) {
    throw new Error("Image must be 2 MB or smaller");
  }

  await mkdir(SITE_UPLOAD_DIR, { recursive: true });

  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/svg+xml"
          ? "svg"
          : file.type.includes("icon")
            ? "ico"
            : "jpg";

  const fileName = `${prefix}-${Date.now()}.${extension}`;
  const filePath = path.join(SITE_UPLOAD_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);

  return `/uploads/site/${fileName}`;
}
