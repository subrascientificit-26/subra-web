"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, LogIn, Menu, Send, X } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  EmptyState,
  ListingToolbar,
  LoadingState,
  PageHero,
  Pagination,
  SearchInput,
} from "@/components/ui";
import { useEnquirySelection } from "@/components/EnquirySelectionProvider";
import { ROUTES, buildEnquiryUrl } from "@/lib/routes";
import { PAGE_CONTAINER_CLASS } from "@/lib/layout";
import { DEFAULT_PRODUCT_IMAGE, PRODUCT_ITEMS_PER_PAGE } from "@/lib/products";
import { useLiveUpdates } from "@/lib/hooks/useLiveUpdates";
import {
  formatExternalRate,
  type ExternalProductRecord,
} from "@/lib/externalProducts";

type ExternalSortOption = "relevance" | "price-low" | "price-high" | "name";

const SORT_OPTIONS = [
  { value: "relevance", label: "Newest" },
  { value: "name", label: "Name A-Z" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

export default function ExternalProductsPage() {
  const router = useRouter();
  const { addItem: addEnquiryItem } = useEnquirySelection();

  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState<ExternalProductRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortBy, setSortBy] = useState<ExternalSortOption>("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadProducts = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch("/api/external-products", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        setIsLoggedIn(false);
        setProducts([]);
        return;
      }
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to fetch external products:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

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
        await loadProducts(true);
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
  }, [loadProducts]);

  useLiveUpdates(["external-products"], () => {
    if (isLoggedIn) {
      void loadProducts(false);
    }
  });

  const types = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.type).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [products]
  );

  const brands = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return products.filter((item) => {
      if (selectedType && item.type !== selectedType) return false;
      if (selectedBrand && item.brand !== selectedBrand) return false;
      if (!query) return true;

      return [
        item.productCode,
        item.productName,
        item.casNo,
        item.type,
        item.brand,
        item.pack,
        item.hsn,
        item.units,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(query));
    });
  }, [products, searchTerm, selectedType, selectedBrand]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === "name") {
      list.sort((a, b) => a.productName.localeCompare(b.productName));
    } else if (sortBy === "price-low") {
      list.sort((a, b) => (a.sellingRate ?? Number.MAX_SAFE_INTEGER) - (b.sellingRate ?? Number.MAX_SAFE_INTEGER));
    } else if (sortBy === "price-high") {
      list.sort((a, b) => (b.sellingRate ?? -1) - (a.sellingRate ?? -1));
    }
    return list;
  }, [filteredProducts, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedProducts.length / PRODUCT_ITEMS_PER_PAGE)
  );
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PRODUCT_ITEMS_PER_PAGE;
  const paginatedProducts = sortedProducts.slice(
    startIndex,
    startIndex + PRODUCT_ITEMS_PER_PAGE
  );

  const handleQuickEnquiry = (item: ExternalProductRecord) => {
    const packLabel = `${item.pack} (${item.units})`;
    const price = item.sellingRate && item.sellingRate > 0 ? item.sellingRate : 0;

    addEnquiryItem({
      id: item.id,
      name: item.productName,
      image: DEFAULT_PRODUCT_IMAGE,
      packSize: packLabel,
      price,
      quantity: 1,
      casNo: item.casNo ?? undefined,
      category: item.type,
      subCategory: item.brand,
      source: "external",
      href: ROUTES.externalProductDetail(item.id),
      productCode: item.productCode,
    });

    router.push(
      buildEnquiryUrl({
        productId: item.id,
        productName: item.productName,
        casNo: item.casNo ?? undefined,
        category: item.type,
        subCategory: item.brand,
        packSize: packLabel,
        quantity: 1,
        price,
        subject: "product-inquiry",
      })
    );
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <LoadingState message="Loading external products..." />
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
              External Products are available exclusively to registered and signed-in users. Please log in to browse the external catalog and submit enquiries.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={ROUTES.login}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                <LogIn size={16} />
                Login to View
              </Link>
              <Link
                href={ROUTES.products}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
              >
                Browse Standard Products
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <div className="flex-grow">
        <div className={`${PAGE_CONTAINER_CLASS} py-4`}>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-primary-hover"
              >
                {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                {sidebarOpen ? "Close Filters" : "Open Filters"}
              </button>
            </div>

            {/* FILTER SIDEBAR */}
            <aside
              className={`${sidebarOpen ? "block" : "hidden"} lg:block lg:sticky lg:top-[var(--site-header-height)] lg:max-h-[calc(100vh-var(--site-header-height))] lg:self-start lg:overflow-y-auto`}
            >
              <div className="rounded-xl border border-border bg-surface p-4 space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h2 className="text-sm font-bold text-foreground">Filters</h2>
                  {(selectedType || selectedBrand) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedType("");
                        setSelectedBrand("");
                        setCurrentPage(1);
                      }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* TYPE FILTER */}
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Type
                  </h3>
                  <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedType("");
                        setCurrentPage(1);
                        setSidebarOpen(false);
                      }}
                      className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                        selectedType === ""
                          ? "bg-primary text-white font-medium"
                          : "text-foreground hover:bg-surface-elevated"
                      }`}
                    >
                      All Types ({products.length})
                    </button>
                    {types.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setSelectedType(t);
                          setCurrentPage(1);
                          setSidebarOpen(false);
                        }}
                        className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition truncate ${
                          selectedType === t
                            ? "bg-primary text-white font-medium"
                            : "text-foreground hover:bg-surface-elevated"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BRAND FILTER */}
                <div className="border-t border-border pt-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Brand
                  </h3>
                  <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBrand("");
                        setCurrentPage(1);
                        setSidebarOpen(false);
                      }}
                      className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                        selectedBrand === ""
                          ? "bg-primary text-white font-medium"
                          : "text-foreground hover:bg-surface-elevated"
                      }`}
                    >
                      All Brands
                    </button>
                    {brands.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          setSelectedBrand(b);
                          setCurrentPage(1);
                          setSidebarOpen(false);
                        }}
                        className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition truncate ${
                          selectedBrand === b
                            ? "bg-primary text-white font-medium"
                            : "text-foreground hover:bg-surface-elevated"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="min-w-0">
              <PageHero
                title="External Products"
                description="Browse our exclusive external catalog with pack details, HSN, GST, and instant enquiry support."
                breadcrumbs={[
                  { label: "Home", href: ROUTES.home },
                  { label: "External Products" },
                ]}
              />

              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <p className="shrink-0 text-sm text-muted">
                  Showing {sortedProducts.length} result
                  {sortedProducts.length !== 1 ? "s" : ""}
                </p>

                <div className="w-full sm:flex-1 sm:min-w-[200px]">
                  <SearchInput
                    value={searchTerm}
                    onChange={(val) => {
                      setSearchTerm(val);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by code, product name, CAS No., brand, HSN..."
                  />
                </div>

                <ListingToolbar
                  sortBy={sortBy}
                  onSortChange={(value) => {
                    setSortBy(value as ExternalSortOption);
                    setCurrentPage(1);
                  }}
                  sortOptions={SORT_OPTIONS}
                  resultCount={undefined}
                  viewMode="grid"
                  onViewModeChange={() => {}}
                />
              </div>

              {paginatedProducts.length === 0 ? (
                <EmptyState
                  title="No external products found"
                  description="Try adjusting your search query, type, or brand filter."
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {paginatedProducts.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:border-primary/50 hover:shadow-md"
                    >
                      <Link
                        href={ROUTES.externalProductDetail(item.id)}
                        className="relative flex h-44 items-center justify-center border-b border-border bg-surface-elevated p-4"
                      >
                        <img
                          src={DEFAULT_PRODUCT_IMAGE}
                          alt={item.productName}
                          className="h-full w-full object-contain"
                        />
                        <span className="absolute left-2.5 top-2.5 rounded-md bg-primary/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary border border-primary/25">
                          {item.productCode}
                        </span>
                      </Link>

                      <div className="flex flex-1 flex-col p-4">
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          <span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary theme-light:bg-blue-50 theme-light:text-blue-700 theme-light:border-blue-200">
                            {item.type}
                          </span>
                          <span className="rounded border border-border bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-muted theme-light:bg-slate-100 theme-light:text-slate-700 theme-light:border-slate-200">
                            {item.brand}
                          </span>
                        </div>

                        <Link
                          href={ROUTES.externalProductDetail(item.id)}
                          className="mb-2 line-clamp-2 text-sm font-semibold text-foreground hover:text-primary transition"
                        >
                          {item.productName}
                        </Link>

                        <div className="mb-3 space-y-1 text-xs text-muted">
                          {item.casNo ? (
                            <p className="truncate">
                              <span className="font-medium text-foreground">CAS:</span>{" "}
                              {item.casNo}
                            </p>
                          ) : null}
                          <p className="truncate">
                            <span className="font-medium text-foreground">Pack:</span>{" "}
                            {item.pack} ({item.units})
                          </p>
                          <p className="truncate">
                            <span className="font-medium text-foreground">HSN:</span>{" "}
                            {item.hsn} &bull; GST {item.gstPercent}%
                          </p>
                        </div>

                        <div className="mt-auto border-t border-border pt-3">
                          <div className="mb-3 flex items-baseline justify-between gap-2">
                            <span className="text-base font-bold text-primary">
                              {formatExternalRate(item.sellingRate)}
                            </span>
                            <span className="text-[11px] text-muted">
                              per {item.units}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Link
                              href={ROUTES.externalProductDetail(item.id)}
                              className="flex h-9 items-center justify-center rounded-lg border border-border bg-surface-elevated px-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
                            >
                              View Details
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleQuickEnquiry(item)}
                              className="flex h-9 items-center justify-center gap-1 rounded-lg bg-primary px-2 text-xs font-semibold text-white transition hover:bg-primary-hover"
                            >
                              <Send size={12} />
                              Enquiry
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={sortedProducts.length}
                itemsPerPage={PRODUCT_ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                className="mb-8"
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

