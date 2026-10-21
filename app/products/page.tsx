import { Suspense } from 'react';
import ProductsPageContent from './ProductsPageContent';
import { LoadingState } from '@/components/ui';

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading products..." fullScreen />}>
      <ProductsPageContent />
    </Suspense>
  );
}
