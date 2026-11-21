"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Package, Mail } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LoadingState, PageHero, SearchInput } from "@/components/ui";
import { NAV_LINKS, ROUTES } from "@/lib/routes";
import { PAGE_CONTAINER_CLASS } from "@/lib/layout";
import { useLiveUpdates } from "@/lib/hooks/useLiveUpdates";

interface Product {
  id: number;
  name: string;
  slug: string;
}

function AZProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const availableLetters = useMemo(() => {
  return new Set(
    products.map((product) =>
      (product.name ?? "").charAt(0).toUpperCase()
    )
  );
}, [products]);
  const alphabet = [
    "All",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];

  const loadProducts = (showLoader = false) => {
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {
        if (showLoader) setProducts([]);
      })
      .finally(() => {
        if (showLoader) setLoading(false);
      });
  };

  useEffect(() => {
    loadProducts(true);
  }, []);

  useLiveUpdates(["products"], () => {
    loadProducts(false);
  });

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (term) {
      return products.filter((product) =>
        (product.name ?? "").toLowerCase().includes(term),
      );
    }

    if (selectedLetter && selectedLetter !== "All") {
      return products.filter(
        (product) =>
          (product.name ?? "").charAt(0).toUpperCase() === selectedLetter,
      );
    }

    return products;
  }, [products, selectedLetter, searchTerm]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};

    filteredProducts.forEach((product) => {
      const letter = product.name?.charAt(0).toUpperCase() || "#";
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(product);
    });

    return groups;
  }, [filteredProducts]);

  const letters = Object.keys(groupedProducts).sort();

  if (loading) {
    return <LoadingState message="Loading products..." fullScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <div className="flex-grow">
        <div className={`${PAGE_CONTAINER_CLASS} py-4`}>
          <PageHero
            title="A-Z Products"
            description="Browse our complete range of chemicals alphabetically."
            breadcrumbs={[
              { label: "Home", href: ROUTES.home },
              { label: "A-Z Products" },
            ]}
          />

          <div className="mb-6 overflow-x-auto">
            <div className="flex min-w-max gap-2 rounded-xl border border-border bg-surface-elevated p-2">
              {alphabet.map((letter) => {
  const isAll = letter === "All";
  const hasProducts = isAll || availableLetters.has(letter);

  return (
    <button
      key={letter}
      type="button"
      disabled={!hasProducts}
      onClick={() => {
        if (!hasProducts) return;

        setSearchTerm("");
        setSelectedLetter(isAll ? null : letter);
      }}
      className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
        (isAll && !selectedLetter) || selectedLetter === letter
          ? "bg-primary text-white shadow"
          : hasProducts
            ? "text-muted hover:bg-surface hover:text-foreground"
            : "cursor-not-allowed opacity-40 text-muted"
      }`}
    >
      {letter}
    </button>
  );
})}
            </div>
          </div>

          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <p className="text-sm text-muted">
              Showing{" "}
              <span className="font-semibold text-foreground">
                {filteredProducts.length}
              </span>{" "}
              products
            </p>

            <div className="w-full md:w-[340px]">
              <SearchInput
                value={searchTerm}
                onChange={(value) => {
                  setSearchTerm(value);
                  setSelectedLetter(null);
                }}
                placeholder="Search within A-Z products..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="space-y-6 lg:col-span-3">
              {letters.length === 0 ? (
                <div className="rounded-2xl border border-border bg-surface p-10 text-center text-muted">
                  No products found
                </div>
              ) : (
                letters.map((letter) => (
                  <div
                    key={letter}
                    className="overflow-hidden rounded-xl border border-border bg-surface"
                  >
                    <div className="border-b border-border bg-surface-elevated px-5 py-3">
                      <h2 className="text-xl font-bold text-primary">
                        {letter}
                      </h2>
                    </div>

                   <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  {groupedProducts[letter]?.map((product) => (
    <Link
      key={product.id}
      href={ROUTES.productDetail(product.id)}
      className="group flex items-center justify-between rounded-md border border-border bg-surface-elevated px-3 py-2 transition hover:border-primary/40 hover:bg-primary/10"
    >
      <span className="truncate text-xs font-medium text-foreground group-hover:text-primary">
        {product.name}
      </span>
      <span className="ml-2 text-muted group-hover:text-primary">
        →
      </span>
    </Link>
  ))}
</div>
                  </div>
                ))
              )}
            </div>

            <div className="self-start h-fit space-y-4 rounded-xl border border-border bg-surface p-5">
              <h3 className="text-lg font-semibold text-foreground">
                Quick Links
              </h3>
              <div className="space-y-2">
                {NAV_LINKS.azSidebar.map((item) => {
                  const Icon =
                    item.title === "All Products"
                      ? Package
                      : item.title === "Request Quote"
                        ? Mail
                        : Package;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center justify-between rounded-lg p-3 transition hover:bg-surface-elevated"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
                          <Icon size={16} className="text-primary" />
                        </div>
                        <p className="font-medium text-foreground group-hover:text-primary">
                          {item.title}
                        </p>
                      </div>
                      <span className="text-muted group-hover:text-primary">
                        →
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function AZProductsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." fullScreen />}>
      <AZProductsContent />
    </Suspense>
  );
}
