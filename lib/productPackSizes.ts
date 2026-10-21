export type PackSizeInput = {
  size: string;
  price: number;
  stock: number;
};

export function parsePackSizeFromFormData(
  formData: FormData,
  price = 0
): PackSizeInput[] {
  const packSize = formData.get("packSize")?.toString().trim() ?? "";
  const units = formData.get("units")?.toString().trim() ?? "";
  const quantityRaw = formData.get("quantity")?.toString();

  if (!packSize && !units) {
    return [];
  }

  const size = [packSize, units].filter(Boolean).join(" ").trim();
  if (!size) {
    return [];
  }

  const stock = quantityRaw ? Number(quantityRaw) : 0;

  return [
    {
      size,
      price,
      stock: Number.isNaN(stock) ? 0 : stock,
    },
  ];
}
