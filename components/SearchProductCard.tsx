'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/products';
import { resolveProductImageUrl } from '@/lib/productImageUrl';

interface Product {
  id: string;
  name: string;
  casNo: string;
  purity: string;
  packSize: string;
  brand: string;
  price: number;
  inStock: boolean;
  badge?: 'Best Seller' | 'Popular';
  image: string;
}

interface SearchProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
}

export default function SearchProductCard({
  product,
  viewMode,
}: SearchProductCardProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc = resolveProductImageUrl(product.image);
  const displaySrc =
    failedSrc === resolvedSrc ? DEFAULT_PRODUCT_IMAGE : resolvedSrc;

  if (viewMode === 'list') {
    return (
      <div className="border border-border rounded-lg p-4 hover:border-primary/50 transition bg-surface">
        <div className="flex gap-4">
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={displaySrc}
              alt={product.name}
              fill
              unoptimized
              onError={() => setFailedSrc(resolvedSrc)}
              className="object-cover rounded-lg"
            />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-primary hover:text-primary-hover mb-1">
              {product.name}
            </h3>
            <p className="text-sm text-muted mb-2">
              CAS No.: {product.casNo}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted mb-3">
              <span>Purity: {product.purity}</span>
              <span>Pack Size: {product.packSize}</span>
              <span>Brand: {product.brand}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-semibold ${
                    product.inStock ? 'text-green-600 theme-dark:text-green-400' : 'text-red-600 theme-dark:text-red-400'
                  }`}
                >
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </p>
                <p className="text-lg font-bold text-foreground">₹ {product.price}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 bg-primary hover:bg-primary-hover rounded-lg transition text-white">
                  <ShoppingCart size={18} />
                </button>
                <button className="p-2 bg-surface-elevated hover:bg-border rounded-lg transition text-foreground">
                  <Heart size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden hover:border-primary/50 transition bg-surface group">
      <div className="relative h-40 bg-surface-elevated overflow-hidden">
        <Image
          src={displaySrc}
          alt={product.name}
          fill
          unoptimized
          onError={() => setFailedSrc(resolvedSrc)}
          className="object-cover group-hover:scale-105 transition duration-300"
        />

        {product.badge && (
          <div
            className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${
              product.badge === 'Best Seller'
                ? 'bg-green-600 text-white'
                : 'bg-primary text-white'
            }`}
          >
            {product.badge}
          </div>
        )}

        <button className="absolute top-3 right-3 p-1.5 bg-black/30 hover:bg-black/50 rounded-full transition backdrop-blur-sm">
          <Heart size={16} className="text-white" />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-primary hover:text-primary-hover mb-2 line-clamp-2">
          {product.name}
        </h3>

        <div className="text-sm text-muted space-y-1 mb-4">
          <p>CAS No.: {product.casNo}</p>
          <p>Purity: {product.purity}</p>
          <p>Pack Size: {product.packSize}</p>
          <p>Brand: {product.brand}</p>
        </div>

        <p
          className={`text-xs font-semibold mb-3 ${
            product.inStock ? 'text-green-600 theme-dark:text-green-400' : 'text-red-600 theme-dark:text-red-400'
          }`}
        >
          {product.inStock ? 'In Stock' : 'Out of Stock'}
        </p>

        <p className="text-xl font-bold text-foreground mb-4">₹ {product.price.toFixed(2)}</p>

        <div className="flex gap-2">
          <button className="flex-1 bg-surface-elevated hover:bg-border text-primary font-semibold py-2 rounded-lg transition border border-primary/50">
            View Details
          </button>
          <button className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2">
            <ShoppingCart size={16} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
