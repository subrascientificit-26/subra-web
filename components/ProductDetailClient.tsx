'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ROUTES, buildEnquiryUrl } from '@/lib/routes';
import { PAGE_CONTAINER_CLASS } from '@/lib/layout';
import {
  Star,
  Heart,
  ChevronLeft,
  ChevronRight,
  Download,
  Truck,
  ShieldCheck,
  PackageCheck,
  Headset,
  ShoppingCart,
} from 'lucide-react';
import { resolveProductImageUrl, resolveProductDocumentUrl } from '@/lib/productImageUrl';
import { useCart } from '@/components/CartProvider';
import { useEnquirySelection } from '@/components/EnquirySelectionProvider';
import { useWishlist } from '@/components/WishlistProvider';

interface Product {
  id: number;
  name: string;
  casNo?: string;
  molecularFormula?: string;
  molecularWeight?: string | number;
  price: number;
  stock: number;
  gallery: string[];
  category?: string;
  subCategory?: string;
  categoryId?: number;
  subCategoryId?: number;
  isArGrade?: boolean;
  isInStock?: boolean;
  isBestSeller?: boolean;
  isFavorite?: boolean;
  description?: string;
  longDescription?: string;
  specifications: Array<{
    parameter: string;
    specification: string;
  }>;
  applications?: string;
  safetyInfo?: string;
  documents: Array<{
    name: string;
    fileUrl: string;
    type?: string;
  }>;
  packSizes?: Array<{ size: string; price: number; stock: number }>;
}

function formatMetaValue(value?: string | number | null) {
  if (value === undefined || value === null || value === '') {
    return 'nil';
  }

  const text = String(value).trim();

  if (!text || text.toLowerCase() === 'no') {
    return 'nil';
  }

  return text;
}

function formatPrice(price: number) {
  return price > 0 ? `₹ ${price.toFixed(2)}` : 'POV';
}

export default function ProductDetailClient({
  product,
}: {
  product: Product;
}) {
  const { addItem } = useCart();
  const { addItem: addEnquiryItem } = useEnquirySelection();
  const { isFavorite: isWishlisted, toggle: toggleWishlist } = useWishlist();
  const isFavorite = isWishlisted(product.id);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>(
    product.gallery?.length
      ? product.gallery.map((image) => resolveProductImageUrl(image))
      : [resolveProductImageUrl(null)]
  );

  const DEFAULT_IMAGE = resolveProductImageUrl(null);
  const hasMultipleImages = galleryImages.length > 1;
  const hasSpecifications =
    Array.isArray(product.specifications) && product.specifications.length > 0;

  const scrollGallery = (direction: 'left' | 'right') => {
    const container = document.getElementById('gallery-thumbnails');

    if (container) {
      const scrollAmount = 120;

      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleImageError = (index: number) => {
    setGalleryImages((current) =>
      current.map((image, currentIndex) =>
        currentIndex === index && image !== DEFAULT_IMAGE
          ? DEFAULT_IMAGE
          : image
      )
    );
  };

  const coaDocument = product.documents?.find(
    (doc) =>
      doc.type === 'COA' || doc.name?.toUpperCase().includes('COA')
  );
  const sdsDocument = product.documents?.find(
    (doc) =>
      doc.type === 'SDS' ||
      doc.name?.toUpperCase().includes('MSDS') ||
      doc.name?.toUpperCase().includes('SDS')
  );

  const selectedPack = product.packSizes?.[selectedPackIndex];
  const selectedPackSize = selectedPack?.size ?? 'Standard';
  const selectedPrice = selectedPack?.price ?? product.price;

  const enquiryPriceText =
    selectedPrice > 0
      ? `${formatPrice(selectedPrice)} each (${formatPrice(
          selectedPrice * quantity
        )})`
      : 'POV';
  const enquiryCasText = product.casNo ? `, CAS No.: ${product.casNo}` : '';
  const enquiryMessage = [
    'I would like to enquire about the following product:',
    '',
    `1. ${product.name} — Pack Size: ${selectedPackSize}, Qty: ${quantity}${enquiryCasText} — ${enquiryPriceText}`,
    '',
    `Total items: ${quantity}`,
    `Estimated total: ${formatPrice(selectedPrice * quantity)}`,
  ].join('\n');

  const enquiryUrl = buildEnquiryUrl({
    productId: product.id,
    productName: product.name,
    image: galleryImages[0],
    casNo: product.casNo,
    molecularFormula: product.molecularFormula,
    molecularWeight: product.molecularWeight,
    category: product.category,
    subCategory: product.subCategory,
    quantity,
    packSize: selectedPackSize,
    price: selectedPrice,
    subject: 'product-inquiry',
    message: enquiryMessage,
  });

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      image: galleryImages[0] ?? DEFAULT_IMAGE,
      packSize: selectedPackSize,
      price: selectedPrice,
      quantity,
      casNo: product.casNo,
      category: product.category,
      subCategory: product.subCategory,
    });

    toast.success(`${product.name} added to cart`);
  };

  const handleEnquirySelection = () => {
    addEnquiryItem({
      id: product.id,
      name: product.name,
      image: galleryImages[0] ?? DEFAULT_IMAGE,
      packSize: selectedPackSize,
      price: selectedPrice,
      quantity,
      casNo: product.casNo,
      category: product.category,
      subCategory: product.subCategory,
    });
  };

  const handleFavoriteToggle = () => {
    toggleWishlist(product.id);
    toast.success(
      isFavorite
        ? `${product.name} removed from favorites`
        : `${product.name} added to favorites`
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className={`${PAGE_CONTAINER_CLASS} py-4`}>

        {/* Breadcrumb */}
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-primary">
          <Link href={ROUTES.home} className="hover:text-foreground">
            Home
          </Link>

          <span className="text-muted">›</span>

          <Link href={ROUTES.products} className="hover:text-foreground">
            Products
          </Link>

          {product.category && product.category !== 'N/A' ? (
            <>
              <span className="text-muted">›</span>
              {product.categoryId ? (
                <Link
                  href={ROUTES.productsByCategory(product.categoryId)}
                  className="hover:text-foreground"
                >
                  {product.category}
                </Link>
              ) : (
                <span className="hover:text-foreground">{product.category}</span>
              )}
            </>
          ) : null}

          {product.subCategory ? (
            <>
              <span className="text-muted">›</span>
              <span className="hover:text-foreground">{product.subCategory}</span>
            </>
          ) : null}

          <span className="text-muted">›</span>

          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6 items-start">

          {/* LEFT IMAGE SECTION */}
          <div className="md:col-span-1 lg:col-span-4">

            {/* MAIN IMAGE */}
            <div className="relative overflow-hidden rounded-xl border border-border bg-surface">

              {/* Favorite */}
              <button
                type="button"
                onClick={handleFavoriteToggle}
                className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-elevated transition hover:border-rose-500"
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                aria-pressed={isFavorite}
              >
                <Heart
                  size={18}
                  className={
                    isFavorite
                      ? 'fill-red-500 text-red-500'
                      : 'text-muted hover:text-red-500'
                  }
                />
              </button>

              {/* BIG IMAGE */}
              <div className="h-[250px] sm:h-[320px] lg:h-[400px] p-4 sm:p-6 flex items-center justify-center">

                <img
                  src={galleryImages[selectedImage] || DEFAULT_IMAGE}
                  alt={product.name}
                  className="w-full h-full object-contain transition duration-300"
                  onError={() => handleImageError(selectedImage)}
                />
              </div>
            </div>

            {/* THUMBNAILS */}
            <div className="relative mt-3">

              {hasMultipleImages && (
                <button
                  onClick={() => scrollGallery('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center"
                >
                  <ChevronLeft size={15} />
                </button>
              )}

              {/* THUMBNAIL LIST */}
              <div
                id="gallery-thumbnails"
                className={`flex gap-2 py-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                  hasMultipleImages ? 'px-8' : 'px-0'
                }`}
              >
                {galleryImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`h-[75px] min-w-[75px] overflow-hidden rounded-lg border transition ${selectedImage === index
                      ? 'border-primary'
                      : 'border-border'
                      }`}
                  >
                    <img
                      src={image}
                      alt={`thumb-${index}`}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(index)}
                    />
                  </button>
                ))}
              </div>

              {hasMultipleImages && (
                <button
                  onClick={() => scrollGallery('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center"
                >
                  <ChevronRight size={15} />
                </button>
              )}
            </div>
          </div>

          {/* CENTER CONTENT */}
          <div className="md:col-span-1 lg:col-span-5">

            {/* PRODUCT TITLE */}
            <h1 className="text-xl md:text-2xl font-bold">
              {product.name}
            </h1>

            <div className="mb-3 mt-2 flex flex-wrap items-center gap-2 text-xs md:text-sm">
              <span className="rounded border border-primary/40 bg-primary/10 px-2 py-1 text-primary">{product.category || 'N/A'}</span>
              {product.subCategory && (
                <span className="rounded border border-border bg-surface-elevated px-2 py-1 text-muted">{product.subCategory}</span>
              )}
            </div>

            {/* PRODUCT META */}
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted md:gap-3 md:text-sm">

              <span>
                CAS No.: {formatMetaValue(product.casNo)}
              </span>

              <span className="text-border">|</span>

              <span>
                Molecular Formula: {formatMetaValue(product.molecularFormula)}
              </span>

              <span className="text-border">|</span>

              <span>
                Molecular Weight: {formatMetaValue(product.molecularWeight)}
              </span>
            </div>

            {/* BADGES */}
            <div className="flex flex-wrap gap-2 mb-3">

              {product.isArGrade && (
                <span className="rounded border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  AR Grade
                </span>
              )}

              {product.isInStock ? (
                <span className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                  In Stock
                </span>
              ) : (
                <span className="rounded bg-amber-700 px-3 py-1 text-xs font-semibold text-white">
                  Out of Stock
                </span>
              )}

              {product.isBestSeller && (
                <span className="inline-flex items-center gap-1 rounded border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Star
                    size={12}
                    className="text-primary"
                  />
                  Best Seller
                </span>
              )}
            </div>

            {/* DESCRIPTION */}
            {product.description?.trim() ? (
              <p className="mb-2 border-b border-border pb-2 text-sm font-medium leading-6 text-foreground">
                {product.description}
              </p>
            ) : null}

            {hasSpecifications && (
              <div className="mb-3">
                <h2 className="text-md font-semibold mb-2">
                  Specifications
                </h2>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      {product.specifications.map((spec, index) => (
                        <tr
                          key={index}
                          className="border-b border-border transition last:border-b-0 hover:bg-surface-elevated"
                        >
                          <td className="w-1/2 border-r border-border px-3 sm:px-4 py-1.5 text-muted break-words">
                            {spec.parameter}
                          </td>
                          <td className="w-1/2 px-3 sm:px-4 py-1.5 text-foreground break-words">
                            {spec.specification}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            {(coaDocument || sdsDocument) && (
              <div className="flex flex-wrap gap-3">
                {coaDocument && (
                  <a
                    href={coaDocument.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-primary px-2 py-2 text-xs font-medium text-primary transition hover:bg-primary hover:text-white"
                  >
                    <Download size={14} />
                    Download COA
                  </a>
                )}

                {sdsDocument && (
                  <a
                    href={sdsDocument.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-primary px-2 py-2 text-xs font-medium text-primary transition hover:bg-primary hover:text-white"
                  >
                    <Download size={14} />
                    Download SDS
                  </a>
                )}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="md:col-span-2 lg:col-span-3">

            <div className="rounded-xl border border-border bg-surface p-5">

              {/* PACK SIZE */}
              <div className="mb-3">

                <label className="mb-2 block text-sm text-muted">
                  Pack Size
                </label>

                <select
                  value={selectedPackIndex}
                  onChange={(e) =>
                    setSelectedPackIndex(Number.parseInt(e.target.value, 10) || 0)
                  }
                  className="h-10 w-full rounded-lg border border-border bg-surface-elevated px-3 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {product.packSizes && product.packSizes.length > 0 ? (
                    product.packSizes.map((p, idx) => (
                      <option key={idx} value={p.size}>
                        {p.size} — {formatPrice(p.price)}
                      </option>
                    ))
                  ) : (
                    <option>Standard</option>
                  )}
                </select>
              </div>

              {/* QUANTITY */}
              <div className="mb-4">

                <label className="mb-2 block text-sm text-muted">
                  Quantity
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(
                          1,
                          parseInt(e.target.value) || 1
                        )
                      )
                    }
                    className="h-10 w-full rounded-lg border border-border bg-surface-elevated px-3 text-sm text-foreground focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />

                  <span className="shrink-0 text-sm text-muted">
                    Units
                  </span>
                </div>
              </div>

              {/* PRICE */}
              <div className="mb-3">

                <p className="mb-1 text-sm text-foreground">
                  Price
                </p>

                <div className="flex flex-wrap items-baseline gap-2">

                  <h2 className="text-2xl font-bold text-primary md:text-3xl">
                    {formatPrice(selectedPrice)}
                  </h2>

                  <span className="text-xs text-muted">
                    (Incl. of all taxes)
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

              {/* FEATURES */}
              <div className="space-y-4 pt-5">

                <div className="flex gap-3">
                  <Truck
                    className="mt-1 text-primary"
                    size={18}
                  />

                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Fast & Secure Delivery
                    </p>

                    <p className="text-xs text-muted">
                      Quick dispatch across India
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <ShieldCheck
                    className="mt-1 text-primary"
                    size={18}
                  />

                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      100% Quality Assurance
                    </p>

                    <p className="text-xs text-muted">
                      Premium quality products
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <PackageCheck
                    className="mt-1 text-primary"
                    size={18}
                  />

                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Safe Packaging
                    </p>

                    <p className="text-xs text-muted">
                      Leak-proof and damage-resistant
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Headset
                    className="mt-1 text-primary"
                    size={18}
                  />

                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Dedicated Support
                    </p>

                    <p className="text-xs text-muted">
                      We&apos;re here to help you
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

{/* BOTTOM SECTION */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mt-2">

  {/* LEFT + CENTER CONTENT */}
  <div className="overflow-hidden border-t border-border lg:col-span-9">

    {/* TAB HEADER */}
    <div className="scrollbar-hide flex overflow-x-auto border-b border-border">

      {[
        'Description',
        'Applications',
        'Safety Information',
        'Documents',
      ].map((tab, index) => (
        <button
          key={index}
          onClick={() => setActiveTab(index)}
          className={`relative flex-shrink-0 whitespace-nowrap px-4 py-3 text-xs font-medium transition sm:px-5 sm:text-sm ${
            activeTab === index
              ? 'text-foreground'
              : 'text-muted hover:text-foreground'
          }`}
        >
          {tab}

          {/* ACTIVE TAB LINE */}
          {activeTab === index && (
            <span className="absolute bottom-0 left-0 h-[2px] w-full bg-primary"></span>
          )}
        </button>
      ))}
    </div>

    {/* TAB CONTENT */}
    <div className="pt-4 sm:pt-5 pr-0 lg:pr-8">

      {activeTab === 0 && (
        <div className="space-y-4">
          {product.description?.trim() ? (
            <p className="text-sm font-medium leading-6 text-foreground">
              {product.description}
            </p>
          ) : null}
          <p className="whitespace-pre-wrap text-sm leading-7 text-muted sm:text-base sm:leading-8">
            {product.longDescription || 'No description available.'}
          </p>
        </div>
      )}

      {activeTab === 1 && (
        <div className="whitespace-pre-wrap text-sm text-muted">
          {product.applications || 'No applications specified.'}
        </div>
      )}

      {activeTab === 2 && (
        <div className="whitespace-pre-wrap text-sm text-muted">
          {product.safetyInfo || 'No safety information provided.'}
        </div>
      )}

      {activeTab === 3 && (
        <div className="space-y-3">
          {product.documents && product.documents.length > 0 ? (
            product.documents.map((d, i) => (
              <a
                key={i}
                href={resolveProductDocumentUrl(d.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Download size={14} />
                <span>
                  {d.name} {d.type ? `(${d.type})` : ''}
                </span>
              </a>
            ))
          ) : (
            <div className="text-sm text-muted">No documents available.</div>
          )}
        </div>
      )}

    </div>
  </div>
</div>
      </div>
    </div>
  );
}
