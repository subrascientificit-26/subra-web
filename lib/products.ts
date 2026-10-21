import { resolveProductImageUrl } from "@/lib/productImageUrl";

export const DEFAULT_PRODUCT_IMAGE = "/noimage.jpg";

/** Number of product cards shown per listing page. */
export const PRODUCT_ITEMS_PER_PAGE = 10;

export interface FormattedProduct {
  id: string;
  name: string;
  casNo: string;
  purity: string;
  packSize: string;
  price: number | null;
  inStock: boolean;
  image: string;
  category: string;
  subCategory: string;
  brand?: string;
  isFavorite?: boolean;
}

export function formatProduct(product: Record<string, unknown>): FormattedProduct {
  const images = product.images as
    | Array<{ imageUrl?: string; isPrimary?: boolean }>
    | undefined;
  const primaryImage =
    images?.find((image) => image.isPrimary) ?? images?.[0];
  const imageUrl = resolveProductImageUrl(primaryImage?.imageUrl);

  const price = Number(product.price);
  const specifications = product.specifications as
    | Array<{ parameter?: string; value?: string }>
    | undefined;
  const packSizes = product.packSizes as Array<{ size?: string }> | undefined;
  const subCategory = product.subCategory as
    | { name?: string; category?: { name?: string } }
    | undefined;

  return {
    id: String(product.id ?? ""),
    name: (product.name as string) || "Unnamed product",
    casNo: ((product.casNumber as string) ?? "").trim() || "N/A",
    purity:
      specifications?.find((spec) => spec.parameter?.toLowerCase() === "purity")
        ?.value || "N/A",
    packSize: packSizes?.[0]?.size || "N/A",
    price: Number.isFinite(price) ? price : null,
    inStock: Number(product.stock) > 0,
    image: imageUrl,
    category: subCategory?.category?.name || "N/A",
    subCategory: subCategory?.name || "N/A",
    brand: (product.brand as string) || undefined,
    isFavorite: Boolean(product.isFavorite),
  };
}

export function formatProducts(data: unknown): FormattedProduct[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => formatProduct(item as Record<string, unknown>));
}

export type SortOption = "relevance" | "price-low" | "price-high" | "name";

export function sortProducts(products: FormattedProduct[], sortBy: SortOption) {
  const sorted = [...products];
  switch (sortBy) {
    case "price-low":
      return sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case "price-high":
      return sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted;
  }
}

export function filterProducts(
  products: FormattedProduct[],
  options: {
    searchTerm?: string;
    category?: string;
    subCategory?: string | null;
    query?: string;
  }
) {
  const search = (options.searchTerm ?? options.query ?? "").toLowerCase();
  const category = options.category ?? "All Categories";
  const subCategory = options.subCategory ?? null;

  return products.filter((product) => {
    const matchesCategory =
      category === "All Categories" || product.category === category;
    const matchesSubCategory =
      !subCategory || product.subCategory === subCategory;
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search) ||
      product.casNo.toLowerCase().includes(search);
    return matchesCategory && matchesSubCategory && matchesSearch;
  });
}
