"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Headset,
  Lock,
  LogIn,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LoadingState } from "@/components/ui";
import { useCart } from "@/components/CartProvider";
import { useEnquirySelection } from "@/components/EnquirySelectionProvider";
import { ROUTES, buildEnquiryUrl } from "@/lib/routes";
import { PAGE_CONTAINER_CLASS } from "@/lib/layout";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/products";
import { useLiveUpdates } from "@/lib/hooks/useLiveUpdates";
import {
  formatExternalRate,
  type ExternalProductRecord,
} from "@/lib/externalProducts";

export default function ExternalProductDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { addItem } = useCart();
  const { addItem: addEnquiryItem } = useEnquirySelection();

  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [product, setProduct] = useState<ExternalProductRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const loadProduct = useCallback(
    async (showLoader = false) => {
      if (!id) return;
      if (showLoader) setLoading(true);
      try {
        const res = await fetch(`/api/external-products/${id}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (res.status === 401) {
          setIsLoggedIn(false);
          setProduct(null);
          return;
        }

        if (res.status === 404 || res.status === 400) {
          setNotFound(true);
          setProduct(null);
          return;
        }

        const data = await res.json();
        if (res.ok && data?.id) {
          setProduct(data);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (!active) return;

        if (!res.ok) {
          setIsLoggedIn(false);
          setAuthChecked(true);
          setLoading(false);
          return;
        }

        setIsLoggedIn(true);
        setAuthChecked(true);
        await loadProduct(true);
      } catch {
        if (!active) return;
        setIsLoggedIn(false);
        setAuthChecked(true);
        setLoading(false);
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, [loadProduct]);

  useLiveUpdates(["external-products"], () => {
    if (isLoggedIn) {
      void loadProduct(false);
    }
  });

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <LoadingState message="Loading product details..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className={`flex-grow ${PAGE_CONTAINER_CLASS} py-12 flex items-center justify-center`}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 sm:p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock size={26} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Login Required
            </h1>
            <p className="text-sm text-muted mb-6">
              Please log in to view external product details and submit enquiries.
            </p>
            <Link
              href={ROUTES.login}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              <LogIn size={16} />
              Login to View
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className={`flex-grow ${PAGE_CONTAINER_CLASS} py-12 flex flex-col items-center justify-center text-center`}>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            External Product Not Found
          </h1>
          <p className="text-sm text-muted mb-6">
            The requested external product does not exist or has been removed.
          </p>
          <Link
            href={ROUTES.externalProducts}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            <ArrowLeft size={16} />
            Back to External Products
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const packLabel = `${product.pack} (${product.units})`;
  const unitPrice =
    product.sellingRate !== null && product.sellingRate > 0
      ? product.sellingRate
      : 0;

  const enquiryUrl = buildEnquiryUrl({
    productId: product.id,
    productName: product.productName,
    image: DEFAULT_PRODUCT_IMAGE,
    casNo: product.casNo ?? undefined,
    category: product.type,
    subCategory: product.brand,
    packSize: packLabel,
    quantity,
    price: unitPrice,
    subject: "product-inquiry",
  });

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.productName,
      image: DEFAULT_PRODUCT_IMAGE,
      packSize: packLabel,
      price: unitPrice,
      quantity,
      casNo: product.casNo ?? undefined,
      category: product.type,
      subCategory: product.brand,
      source: "external",
      href: ROUTES.externalProductDetail(product.id),
      productCode: product.productCode,
    });
    toast.success(`${product.productName} added to cart`);
  };

  const handleEnquirySelection = () => {
    addEnquiryItem({
      id: product.id,
      name: product.productName,
      image: DEFAULT_PRODUCT_IMAGE,
      packSize: packLabel,
      price: unitPrice,
      quantity,
      casNo: product.casNo ?? undefined,
      category: product.type,
      subCategory: product.brand,
      source: "external",
      href: ROUTES.externalProductDetail(product.id),
      productCode: product.productCode,
    });
  };

  const specRows: Array<[string, string]> = [
    ["Product Code", product.productCode],
    ["Product Name", product.productName],
    ["CAS No.", product.casNo || "—"],
    ["Type", product.type],
    ["Brand", product.brand],
    ["Pack", product.pack],
    ["Units", product.units],
    ["HSN", product.hsn],
    ["GST%", `${product.gstPercent}%`],
    ["Selling Rate", formatExternalRate(product.sellingRate)],
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-grow">
        <div className={`${PAGE_CONTAINER_CLASS} py-4 sm:py-6`}>
          {/* BREADCRUMB */}
          <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-primary">
            <Link href={ROUTES.home} className="hover:text-foreground">
              Home
            </Link>
            <span className="text-muted">›</span>
            <Link href={ROUTES.externalProducts} className="hover:text-foreground">
              External Products
            </Link>
            <span className="text-muted">›</span>
            <span className="text-foreground">{product.productName}</span>
          </nav>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6 items-start">
            {/* LEFT IMAGE */}
            <div className="md:col-span-1 lg:col-span-4">
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                <div className="h-[240px] sm:h-[300px] lg:h-[360px] p-6 flex items-center justify-center">
                  <img
                    src={DEFAULT_PRODUCT_IMAGE}
                    alt={product.productName}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* CENTER SPECS */}
            <div className="md:col-span-1 lg:col-span-5 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {product.productName}
              </h1>

              <div className="mb-3 mt-2 flex flex-wrap items-center gap-2 text-xs md:text-sm">
                <span className="rounded border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono font-semibold text-primary">
                  {product.productCode}
                </span>
                <span className="rounded border border-border bg-surface-elevated px-2.5 py-1 text-foreground font-medium">
                  {product.type}
                </span>
                <span className="rounded border border-border bg-surface-elevated px-2.5 py-1 text-muted">
                  Brand: {product.brand}
                </span>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted md:gap-3 md:text-sm">
                <span>CAS No.: {product.casNo || "nil"}</span>
                <span className="text-border">|</span>
                <span>HSN: {product.hsn}</span>
                <span className="text-border">|</span>
                <span>GST: {product.gstPercent}%</span>
              </div>

              <div className="mb-3">
                <h2 className="text-base font-semibold mb-2 text-foreground">
                  Product Specifications
                </h2>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      {specRows.map(([label, value]) => (
                        <tr
                          key={label}
                          className="border-b border-border transition last:border-b-0 hover:bg-surface-elevated"
                        >
                          <td className="w-2/5 border-r border-border px-3 sm:px-4 py-2 text-muted break-words">
                            {label}
                          </td>
                          <td className="w-3/5 px-3 sm:px-4 py-2 text-foreground font-medium break-words">
                            {value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT ENQUIRY & CART SIDEBAR */}
            <div className="md:col-span-2 lg:col-span-3">
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="mb-3">
                  <label className="mb-1.5 block text-sm text-muted">
                    Pack &amp; Units
                  </label>
                  <div className="flex h-10 items-center rounded-lg border border-border bg-surface-elevated px-3 text-sm font-medium text-foreground">
                    {packLabel}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm text-muted">
                    Quantity
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                      className="h-10 w-full rounded-lg border border-border bg-surface-elevated px-3 text-sm text-foreground focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="shrink-0 text-sm text-muted">
                      {product.units}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="mb-1 text-sm text-foreground">Selling Rate</p>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-primary md:text-3xl">
                      {formatExternalRate(product.sellingRate)}
                    </h2>
                    <span className="text-xs text-muted">
                      (GST {product.gstPercent}%)
                    </span>
                  </div>
                </div>

                <Link
                  href={enquiryUrl}
                  onClick={handleEnquirySelection}
                  className="mb-2 flex h-10 w-full items-center justify-center rounded-lg border border-primary font-semibold text-primary transition hover:bg-primary hover:text-white"
                >
                  Request for Enquiry
                </Link>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-white transition hover:bg-primary-hover"
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </button>

                <div className="space-y-4 pt-5">
                  <div className="flex gap-3">
                    <Truck className="mt-1 text-primary shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Fast &amp; Secure Delivery
                      </p>
                      <p className="text-xs text-muted">
                        Quick dispatch across India
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <ShieldCheck className="mt-1 text-primary shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        100% Quality Assurance
                      </p>
                      <p className="text-xs text-muted">
                        Verified external supplier catalog
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <PackageCheck className="mt-1 text-primary shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Safe Packaging
                      </p>
                      <p className="text-xs text-muted">
                        Standardized industrial packs
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Headset className="mt-1 text-primary shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Dedicated Support
                      </p>
                      <p className="text-xs text-muted">
                        Direct quote &amp; enquiry assistance
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

