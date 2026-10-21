"use client";

import ProductCard from "@/components/ProductCard";
import type { FormattedProduct } from "@/lib/products";

interface ProductCardGridProps {
  products: FormattedProduct[];
  viewMode?: "grid" | "list";
  className?: string;
  onDelete?: (id: string) => void;
}

export default function ProductCardGrid({
  products,
  viewMode = "grid",
  className = "mb-8",
  onDelete,
}: ProductCardGridProps) {
  return (
    <div
      className={`grid gap-4 ${
        viewMode === "grid"
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          : "grid-cols-1"
      } ${className}`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} {...product} onDelete={onDelete} />
      ))}
    </div>
  );
}
