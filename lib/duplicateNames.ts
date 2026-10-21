import { prisma } from "@/lib/prisma";

export function normalizeEntityName(name: string) {
  return name.trim().toLowerCase();
}

export async function findDuplicateCategory(name: string, excludeId?: number) {
  const normalized = normalizeEntityName(name);
  if (!normalized) return null;

  const categories = await prisma.category.findMany({
    where: excludeId ? { NOT: { id: excludeId } } : undefined,
    select: { id: true, name: true },
  });

  return (
    categories.find((item) => normalizeEntityName(item.name) === normalized) ?? null
  );
}

export async function findDuplicateSubCategory(
  name: string,
  categoryId: number,
  excludeId?: number
) {
  const normalized = normalizeEntityName(name);
  if (!normalized || !categoryId) return null;

  const subcategories = await prisma.subCategory.findMany({
    where: {
      categoryId,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true, name: true },
  });

  return (
    subcategories.find((item) => normalizeEntityName(item.name) === normalized) ?? null
  );
}

export async function findDuplicateProduct(name: string, excludeId?: number) {
  const normalized = normalizeEntityName(name);
  if (!normalized) return null;

  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true, name: true },
  });

  return (
    products.find((item) => normalizeEntityName(item.name) === normalized) ?? null
  );
}

export const DUPLICATE_ERRORS = {
  category: "A category with this name already exists.",
  subcategory: "A subcategory with this name already exists in this category.",
  product: "A product with this name already exists.",
  sidebar: "A sidebar item with this label already exists in this section.",
};

export async function findDuplicateSidebarItem(
  label: string,
  section: string,
  parentId: number | null,
  excludeId?: number
) {
  const normalized = normalizeEntityName(label);
  if (!normalized) return null;

  const items = await prisma.sidebarItem.findMany({
    where: {
      section: section as "navbar" | "footer" | "products_sidebar",
      parentId,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true, label: true },
  });

  return (
    items.find((item) => normalizeEntityName(item.label) === normalized) ?? null
  );
}
