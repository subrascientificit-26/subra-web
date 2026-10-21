"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { ROUTES, buildEnquiryUrl } from "@/lib/routes";
import { useCart } from "@/components/CartProvider";
import { resolveProductImageUrl } from "@/lib/productImageUrl";

function formatPrice(price: number) {
  return price > 0 ? `₹ ${price.toFixed(2)}` : "POV";
}

export default function CartClient() {
  const router = useRouter();
  const { items, subtotal, count, updateQuantity, removeItem, clearCart } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface px-6 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated">
          <ShoppingCart size={28} className="text-muted" />
        </div>

        <h2 className="mb-2 text-xl font-semibold text-foreground">
          Your cart is empty
        </h2>

        <p className="mb-6 max-w-md text-sm text-muted">
          Browse our products and add items to your cart to request an enquiry.
        </p>

        <Link
          href={ROUTES.products}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          <ArrowLeft size={16} />
          Continue Shopping
        </Link>
      </div>
    );
  }

  const handleEnquiry = () => {
    const isBulk = items.length > 1;

    // The enquiry page reads the cart items directly and renders them with
    // quantity controls, so we only pass the subject here (no message dump).
    const url = buildEnquiryUrl({
      subject: isBulk ? "bulk-order" : "product-inquiry",
    });

    router.push(url);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* ITEMS */}
      <div className="space-y-3 lg:col-span-2">
        {items.map((item) => (
          <div
            key={`${item.id}-${item.packSize}`}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3 sm:gap-4"
          >
            <Link
              href={ROUTES.productDetail(item.id)}
              className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-surface-elevated"
            >
              <img
                src={resolveProductImageUrl(item.image)}
                alt={item.name}
                className="h-full w-full object-contain p-1.5"
              />
            </Link>

            <div className="min-w-[9rem] flex-1">
              <Link
                href={ROUTES.productDetail(item.id)}
                className="line-clamp-1 text-sm font-semibold text-foreground hover:text-primary md:text-base"
              >
                {item.name}
              </Link>

              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
                <span>Pack Size: {item.packSize}</span>
                {item.casNo ? <span>CAS No.: {item.casNo}</span> : null}
                {item.price > 0 ? (
                  <span>{formatPrice(item.price)} each</span>
                ) : null}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3 sm:gap-4">
              <div className="flex items-center rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(item.id, item.packSize, item.quantity - 1)
                  }
                  className="flex h-8 w-8 items-center justify-center text-muted transition hover:text-foreground"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>

                <span className="w-9 text-center text-sm font-medium text-foreground">
                  {item.quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(item.id, item.packSize, item.quantity + 1)
                  }
                  className="flex h-8 w-8 items-center justify-center text-muted transition hover:text-foreground"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="w-20 flex-shrink-0 text-right sm:w-24">
                <p className="text-sm font-bold text-primary md:text-base">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeItem(item.id, item.packSize)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border text-muted transition hover:border-rose-500 hover:text-rose-500"
                aria-label="Remove item"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between">
          <Link
            href={ROUTES.products}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>

          <button
            type="button"
            onClick={clearCart}
            className="text-sm text-muted transition hover:text-rose-500"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="lg:col-span-1">
        <div className="rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-[var(--site-header-height)]">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-muted">
              <span>Items</span>
              <span className="text-foreground">{count}</span>
            </div>

            <div className="flex items-center justify-between text-muted">
              <span>Subtotal</span>
              <span className="text-foreground">{formatPrice(subtotal)}</span>
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-foreground">
                  Total
                </span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">(Incl. of all taxes)</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEnquiry}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-white transition hover:bg-primary-hover"
          >
            Request Enquiry
          </button>

          <Link
            href={ROUTES.enquiry}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-lg border border-primary font-semibold text-primary transition hover:bg-primary hover:text-white"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
