'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ApplicationSidebar from '@/components/ApplicationSidebar';
import ApplicationCard from '@/components/ApplicationCard';
import {
  LoadingState,
  PageHero,
  Pagination,
} from '@/components/ui';
import { ROUTES } from '@/lib/routes';

import {
  FlaskConical,
  Beaker,
  Dna,
  Pill,
  Leaf,
  Wine,
  Droplet,
  PaletteIcon,
  Droplets,
  Wheat,
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string;
  image: string | null;
}

const ITEMS_PER_PAGE = 12;

const icons = [
  Beaker,
  FlaskConical,
  Dna,
  Pill,
  Leaf,
  Wine,
  Droplet,
  PaletteIcon,
  Droplets,
  Wheat,
];

function ApplicationsContent() {
  const [applications, setApplications] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch('/api/category')
      .then((res) => res.json())
      .then((data) => {
        setApplications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [applications]);

  const totalPages = Math.max(
    1,
    Math.ceil(applications.length / ITEMS_PER_PAGE)
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedApplications = useMemo(
    () =>
      applications.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
      ),
    [applications, startIndex]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <div className="flex-grow">
        <div className="max-w-[1650px] mx-auto px-3 sm:px-5 lg:px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <div className="sticky top-24 self-start">
              <ApplicationSidebar categories={applications} />
            </div>

            <div className="min-w-0">
              <PageHero
                title="Applications"
                description="Explore our wide range of products used across diverse industries and laboratory applications. Select an application area to view relevant products."
                image="/Lab-test.jpg"
                imageAlt="Applications"
                breadcrumbs={[
                  { label: 'Home', href: ROUTES.home },
                  { label: 'Applications' },
                ]}
              />

              {loading ? (
                <LoadingState message="Loading applications..." />
              ) : applications.length === 0 ? (
                <div className="rounded-2xl border border-border bg-surface p-10 text-center text-muted">
                  No application categories found.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-4">
                    {paginatedApplications.map((app, index) => {
                      const globalIndex = startIndex + index;
                      const IconComponent =
                        icons[globalIndex % icons.length];

                      return (
                        <ApplicationCard
                          key={app.id}
                          icon={IconComponent}
                          title={app.name}
                          description={app.description}
                          image={app.image || '/noimage.jpg'}
                          link={ROUTES.productsByCategory(app.id)}
                        />
                      );
                    })}
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={applications.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                    className="mt-8 mb-8"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense
      fallback={<LoadingState message="Loading..." fullScreen />}
    >
      <ApplicationsContent />
    </Suspense>
  );
}
