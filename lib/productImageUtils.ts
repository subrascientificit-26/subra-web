export function getPrimaryImageFromList(
  images: Array<{ id?: number; imageUrl?: string; isPrimary?: boolean }> = []
) {
  return images.find((img) => img.isPrimary) || images[0] || null;
}

export function getGalleryImagesFromList(
  images: Array<{ id?: number; imageUrl?: string; isPrimary?: boolean }> = []
) {
  return images.filter((img) => !img.isPrimary);
}
