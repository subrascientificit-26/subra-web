'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  CategorySidebar,
  EmptyState,
  ListingToolbar,
  LoadingState,
  PageHero,
  Pagination,
  ProductCardGrid,
} from '@/components/ui';
import type { CategoryGroup } from '@/components/ui/CategorySidebar';
import { ROUTES } from '@/lib/routes';
import {
  filterProducts,
  formatProducts,
  PRODUCT_ITEMS_PER_PAGE,
  sortProducts,
  type FormattedProduct,
  type SortOption,
} from '@/lib/products';

const ITEMS_PER_PAGE = PRODUCT_ITEMS_PER_PAGE;

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Product Name' },
];

interface SubCategoryRecord {
  name: string;
  category: { name: string };
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [subCategoryRecords, setSubCategoryRecords] = useState<SubCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(formatProducts(data)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/subcategory')
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setSubCategoryRecords(data);
      })
      .catch(() => {});
  }, []);

  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const groups = new Map<string, Set<string>>();

    subCategoryRecords.forEach((sub) => {
      const categoryName = sub.category?.name;
      if (!categoryName) return;
      if (!groups.has(categoryName)) {
        groups.set(categoryName, new Set());
      }
      groups.get(categoryName)!.add(sub.name);
    });

    products.forEach((product) => {
      if (!product.category || product.category === 'N/A') return;
      if (!groups.has(product.category)) {
        groups.set(product.category, new Set());
      }
      if (product.subCategory && product.subCategory !== 'N/A') {
        groups.get(product.category)!.add(product.subCategory);
      }
    });

    return Array.from(groups.entries())
      .map(([name, subs]) => ({
        name,
        subcategories: Array.from(subs).sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, subCategoryRecords]);

  const filteredProducts = useMemo(() => {
    return filterProducts(products, {
      searchTerm: query,
      category: selectedCategory,
      subCategory: selectedSubCategory,
    });
  }, [products, query, selectedCategory, selectedSubCategory]);

  const sortedProducts = useMemo(
    () => sortProducts(filteredProducts, sortBy),
    [filteredProducts, sortBy]
  );

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedCategory, selectedSubCategory, sortBy]);

  if (loading) {
    return <LoadingState message="Searching products..." fullScreen />;
  }

  const displayQuery = query.trim() || 'all products';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <div className="flex-grow">
        <div className="mx-auto max-w-[1650px] px-3 py-4 sm:px-5 lg:px-6">
          <PageHero
            title={query.trim() ? `Search: "${query.trim()}"` : 'Search Products'}
            description={`Showing results for ${displayQuery}. Refine with category filters or sort options.`}
            breadcrumbs={[
              { label: 'Home', href: ROUTES.home },
              { label: 'Search' },
            ]}
          />

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_1fr]">
            <div className="lg:sticky lg:top-[var(--site-header-height)] lg:self-start">
              <CategorySidebar
                categoryGroups={categoryGroups}
                selectedCategory={selectedCategory}
                selectedSubCategory={selectedSubCategory}
                onSelectCategory={(category, subCategory) => {
                  setSelectedCategory(category);
                  setSelectedSubCategory(subCategory);
                }}
              />
            </div>

            <div className="min-w-0">
              <ListingToolbar
                sortBy={sortBy}
                onSortChange={(value) => setSortBy(value as SortOption)}
                sortOptions={SORT_OPTIONS}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                resultCount={sortedProducts.length}
              />

              {paginatedProducts.length === 0 ? (
                <EmptyState
                  title="No products found"
                  description="Try a different search term or browse all products."
                  action={
                    <Link
                      href={ROUTES.products}
                      className="inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
                    >
                      Browse All Products
                    </Link>
                  }
                />
              ) : (
                <ProductCardGrid
                  products={paginatedProducts}
                  viewMode={viewMode}
                />
              )}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedProducts.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading search..." fullScreen />}>
      <SearchPageContent />
    </Suspense>
  );
}
