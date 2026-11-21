export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_PRODUCT_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif,image/*";

const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|svg|avif)$/i;

export function validateProductImageFile(
  file: Pick<File, "name" | "type" | "size">,
  label = "Image"
): string | null {
  if (!file || file.size === 0) {
    return `${label} file is empty.`;
  }

  const hasValidMime = Boolean(file.type && file.type.startsWith("image/"));
  const hasValidExt = ALLOWED_IMAGE_EXTENSIONS.test(file.name || "");

  if (!hasValidMime && !hasValidExt) {
    return `${label} must be a valid image file (PNG, JPG, WEBP, GIF, SVG, AVIF).`;
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    return `${label} size must be 10MB or less.`;
  }

  return null;
}

export function getPrimaryImageFromList(
  images: Array<{ id?: number; imageUrl?: string; isPrimary?: boolean }> = []
) {
  return images.find((img) => Boolean(img.isPrimary)) || null;
}

export function getGalleryImagesFromList(
  images: Array<{ id?: number; imageUrl?: string; isPrimary?: boolean }> = []
) {
  return images.filter((img) => !img.isPrimary);
}
