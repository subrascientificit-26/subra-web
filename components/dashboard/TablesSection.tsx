'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquareText } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import LoadingState from '@/components/ui/LoadingState';

interface RecentEnquiry {
  id: string;
  title: string;
  name: string;
  email: string;
  date: string;
}

interface ProductDetails {
  total: number;
  featured: number;
  bestSeller: number;
  inStock: number;
  outOfStock: number;
  lowStock: number;
}

export default function TablesSection() {
  const [recentEnquiries, setRecentEnquiries] = useState<RecentEnquiry[]>([]);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setRecentEnquiries(data?.recentEnquiries ?? []);
        setProductDetails(data?.productDetails ?? null);
      })
      .catch(() => {
        setRecentEnquiries([]);
        setProductDetails(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState message="Loading dashboard details..." />;
  }

  const productRows = productDetails
    ? [
        { label: 'Total Products', value: productDetails.total },
        { label: 'In Stock', value: productDetails.inStock },
        { label: 'Low Stock', value: productDetails.lowStock },
        { label: 'Out of Stock', value: productDetails.outOfStock },
        { label: 'Featured Products', value: productDetails.featured },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Recent Enquiries</h2>
          <Link href={ROUTES.admin.enquiry} className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>

        {recentEnquiries.length === 0 ? (
          <p className="text-sm text-muted">No enquiries yet</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentEnquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                className="rounded-xl border border-border bg-surface-elevated px-4 py-3 transition hover:border-primary/40"
              >
                <div className="flex gap-3">
                  {/* <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                    <MessageSquareText size={18} className="text-primary" />
                  </div> */}

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-foreground">
                          {enquiry.id}
                        </h4>
                        <p className="mt-0.5 truncate text-sm text-muted">{enquiry.title}</p>
                      </div>
                    </div>

                    <p className="truncate text-xs text-foreground">{enquiry.name}</p>
                    <a
                      href={`mailto:${enquiry.email}`}
                      className="mt-0.5 block truncate text-xs text-primary hover:underline"
                    >
                      {enquiry.email}
                    </a>
                    <p className="mt-2 text-xs text-muted">{enquiry.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Product Details</h2>
          <Link href={ROUTES.admin.products} className="text-xs text-primary hover:underline">
            Manage products
          </Link>
        </div>

        {productRows.length === 0 ? (
          <p className="text-sm text-muted">No product data available</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {productRows.map((row) => (
              <div
                key={row.label}
className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-elevated px-4 py-3 text-center shadow-sm transition hover:border-primary/40"
              >
                <span className="text-sm text-muted">{row.label}</span>
                <span className="text-lg font-bold text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
