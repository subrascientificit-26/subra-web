import { mkdir, writeFile } from "fs/promises";
import path from "path";

const PROFILE_UPLOAD_DIR = path.join(process.cwd(), "public/uploads/profiles");
const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export async function saveProfileImage(userId: number, file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Profile image must be JPG, PNG, or WEBP");
  }

  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error("Profile image must be 5 MB or smaller");
  }

  await mkdir(PROFILE_UPLOAD_DIR, { recursive: true });

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `profile-${userId}-${Date.now()}.${extension}`;
  const filePath = path.join(PROFILE_UPLOAD_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);

  return `/uploads/profiles/${fileName}`;
}
