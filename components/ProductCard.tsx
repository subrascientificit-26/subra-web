"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Trash2, Heart } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/products";
import { resolveProductImageUrl } from "@/lib/productImageUrl";
import { useWishlist } from "@/components/WishlistProvider";

interface ProductCardProps {
  id: string;
  name: string;
  casNo: string;
  purity: string;
  packSize: string;
  price: number | null;
  inStock: boolean;
  image: string;
  category?: string;
  subCategory?: string;
  onDelete?: (id: string) => void;
}

export default function ProductCard({
  id,
  name,
  casNo,
  purity,
  packSize,
  price,
  inStock,
  image,
  category,
  subCategory,
  onDelete,
}: ProductCardProps) {
  const { isFavorite, toggle } = useWishlist();
  const favorite = isFavorite(id);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const resolved = resolveProductImageUrl(image || DEFAULT_PRODUCT_IMAGE);
  const imageSrc = failedSrc === resolved ? DEFAULT_PRODUCT_IMAGE : resolved;

  const handleImageError = () => {
    setFailedSrc(resolved);
  };

  return (
    <div className="group relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-lg border border-border bg-surface transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(id);
          }}
          className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-red-500/40 bg-surface/90 text-red-500 shadow-sm transition hover:bg-red-600 hover:text-white"
          aria-label={`Delete ${name || "product"}`}
          title="Delete product"
        >
          <Trash2 size={15} />
        </button>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(id);
        }}
        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface/90 shadow-sm transition hover:border-rose-500"
        aria-label={favorite ? `Remove ${name || "product"} from favorites` : `Add ${name || "product"} to favorites`}
        aria-pressed={favorite}
        title={favorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          size={15}
          className={favorite ? "fill-red-500 text-red-500" : "text-muted hover:text-red-500"}
        />
      </button>

      <Link href={ROUTES.productDetail(id)} className="flex h-full flex-col">
        <div className="relative h-32 flex-shrink-0 overflow-hidden bg-surface-elevated">
          <Image
            src={imageSrc}
            alt={name || "Product image"}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
          />

          <div className="absolute inset-0 bg-black/10 transition-all duration-300 theme-dark:bg-black/30 group-hover:bg-black/5 theme-dark:group-hover:bg-black/20" />
        </div>

        <div className="flex flex-1 flex-col p-2.5">
          <h3 className="mb-1.5 line-clamp-2 text-xs font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
            {name || "Unnamed product"}
          </h3>

          <div className="mb-1 flex flex-wrap gap-1">
            {category && (
              <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-primary theme-light:bg-blue-50 theme-light:text-blue-700 theme-light:border-blue-200 font-semibold">
                {category}
              </span>
            )}

            {subCategory && (
              <span className="rounded border border-border bg-surface-elevated px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted theme-light:bg-slate-100 theme-light:text-slate-700 theme-light:border-slate-200 font-medium">
                {subCategory}
              </span>
            )}
          </div>

          <div className="mb-1 flex-1 space-y-0.5 text-[10px] text-muted">
            <p className="line-clamp-1">
              <span className="text-muted font-medium">CAS No:</span>{" "}
              <span className="text-foreground font-medium">{casNo || "N/A"}</span>
            </p>

            <p className="line-clamp-1">
              <span className="text-muted font-medium">Purity:</span>{" "}
              <span className="text-foreground font-medium">{purity || "N/A"}</span>
            </p>

            <p className="line-clamp-1">
              <span className="text-muted font-medium">Pack Size:</span>{" "}
              <span className="text-foreground font-medium">{packSize || "N/A"}</span>
            </p>

            {inStock ? (
              <div className="inline-flex w-fit items-center rounded-sm bg-green-600 px-1.5 py-[3px] text-[11px] font-semibold leading-none text-white shadow-xs">
                In Stock
              </div>
            ) : (
              <div className="inline-flex w-fit items-center rounded-sm bg-amber-600 px-1.5 py-[3px] text-[11px] font-semibold leading-none text-white shadow-xs">
                Out of Stock
              </div>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-1.5 pt-1">
            <div className="text-xs font-bold text-primary whitespace-nowrap">
              {price === null || Number.isNaN(price) ? "Price N/A" : `₹${price}`}
            </div>

            <span className="rounded border border-primary bg-transparent px-2 py-0.5 text-[10px] font-semibold text-primary whitespace-nowrap transition group-hover:bg-primary/10">
              View Details
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
