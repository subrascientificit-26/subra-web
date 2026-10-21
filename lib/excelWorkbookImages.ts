import ExcelJS from "exceljs";

function detectImageExtension(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "jpg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }

  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46
  ) {
    return "gif";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  return "png";
}

export async function extractRowImagesFromWorkbook(arrayBuffer: ArrayBuffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(arrayBuffer) as never);

  const worksheet = workbook.worksheets[0];
  const rowImages = new Map<number, Array<{ buffer: Buffer; extension: string }>>();

  if (!worksheet) {
    return rowImages;
  }

  for (const image of worksheet.getImages()) {
    const workbookImage = workbook.getImage(Number(image.imageId));
    const rawBuffer = workbookImage?.buffer;

    if (!rawBuffer) {
      continue;
    }

    const buffer = Buffer.isBuffer(rawBuffer)
      ? Buffer.from(rawBuffer)
      : Buffer.from(new Uint8Array(rawBuffer as ArrayBuffer));
    const row =
      (image.range?.tl?.nativeRow ?? image.range?.tl?.row ?? 0) + 1;

    const extension =
      workbookImage.extension?.replace(/^\./, "") ||
      detectImageExtension(buffer);

    const existing = rowImages.get(row) ?? [];
    existing.push({ buffer, extension });
    rowImages.set(row, existing);
  }

  return rowImages;
}
