'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { toast } from 'sonner';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  CategorySidebar,
  EmptyState,
  ListingToolbar,
  LoadingState,
  PageHero,
  Pagination,
  ProductCardGrid,
  SearchInput,
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
  { value: 'name', label: 'Name A-Z' },
];

interface SubCategoryRecord {
  name: string;
  category: { name: string };
}

export default function ProductsPageContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [subCategoryRecords, setSubCategoryRecords] = useState<SubCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  // const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = async (showLoader = false) => {
    if (showLoader) setLoading(true);

    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load products');
      }

      setProducts(formatProducts(data));
    } catch (error) {
      console.error(error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(true);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setIsAdmin(data?.user?.role === 'admin'))
      .catch(() => {});
  }, []);

  const confirmDeleteProduct = useMemo(
    () => products.find((product) => product.id === confirmDeleteId) ?? null,
    [products, confirmDeleteId]
  );

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/products?id=${confirmDeleteId}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }

      setProducts((prev) => prev.filter((item) => item.id !== confirmDeleteId));
      toast.success('Product deleted successfully');
      setConfirmDeleteId(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete product'
      );
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetch('/api/category')
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const map: Record<string, string> = {};
        data.forEach((category: { id: number; name: string }) => {
          map[String(category.id)] = category.name;
        });
        setCategoryMap(map);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetch('/api/subcategory')
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setSubCategoryRecords(data);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (categoryParam && categoryMap[categoryParam]) {
      setSelectedCategory(categoryMap[categoryParam]);
      setSelectedSubCategory(null);
    }
  }, [categoryParam, categoryMap]);

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

  const filteredProducts = useMemo(
    () =>
      filterProducts(products, {
        searchTerm,
        category: selectedCategory,
        subCategory: selectedSubCategory,
      }),
    [products, searchTerm, selectedCategory, selectedSubCategory]
  );

  const sortedProducts = useMemo(
    () => sortProducts(filteredProducts, sortBy),
    [filteredProducts, sortBy]
  );

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedSubCategory, sortBy]);

  const handleCategorySelect = (category: string, subCategory: string | null) => {
    setSelectedCategory(category);
    setSelectedSubCategory(subCategory);
    setSidebarOpen(false);
  };

  if (loading) {
    return <LoadingState message="Loading products..." fullScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <div className="flex-grow">
        <div className="mx-auto max-w-[1650px] px-3 py-4 sm:px-5 lg:px-6">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_1fr]">
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-primary-hover"
              >
                {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                {sidebarOpen ? 'Close Filters' : 'Open Filters'}
              </button>
            </div>

            <div
              className={`${sidebarOpen ? 'block' : 'hidden'} lg:block lg:sticky lg:top-[var(--site-header-height)] lg:max-h-[calc(100vh-var(--site-header-height))] lg:self-start lg:overflow-y-auto`}
            >
              <CategorySidebar
                categoryGroups={categoryGroups}
                selectedCategory={selectedCategory}
                selectedSubCategory={selectedSubCategory}
                onSelectCategory={handleCategorySelect}
                showDynamicLinks={false}
              />
            </div>

            <div className="min-w-0">
              <PageHero
                title="Products"
                description="Browse our complete range of high-quality chemicals, reagents, instruments and lab consumables."
                breadcrumbs={[
                  { label: 'Home', href: ROUTES.home },
                  { label: 'Products' },
                ]}
              />

              <div className="mb-5 flex items-center gap-4">
                {/* Showing */}
                <p className="shrink-0 text-sm text-muted">
                  Showing {sortedProducts.length} result
                  {sortedProducts.length !== 1 ? "s" : ""}
                </p>

                {/* Search */}
                <div className="flex-1">
                  <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by product name or CAS No..."
                  />
                </div>

                {/* Relevance */}
                <ListingToolbar
                  sortBy={sortBy}
                  onSortChange={(value) => setSortBy(value as SortOption)}
                  sortOptions={SORT_OPTIONS}
                  resultCount={undefined}
                  viewMode="grid"
                  onViewModeChange={() => { }}
                />
              </div>

              {paginatedProducts.length === 0 ? (
                <EmptyState
                  title="No products found"
                  description="Try a different search term or category filter."
                />
              ) : (
                <ProductCardGrid
                  products={paginatedProducts}
                  viewMode="grid"
                  onDelete={isAdmin ? setConfirmDeleteId : undefined}
                />
              )}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedProducts.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                className="mb-8"
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete product"
        description={
          confirmDeleteProduct
            ? `Are you sure you want to delete "${confirmDeleteProduct.name}"? This will remove it from the listing.`
            : 'Are you sure you want to delete this product?'
        }
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}
