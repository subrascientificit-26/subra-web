'use client';

import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, FileUp, Send, RotateCcw, Minus, Plus, Trash2 } from 'lucide-react';
import { RequiredMark } from '@/components/ui/FieldLabel';
import LoadingState from '@/components/ui/LoadingState';
import { ROUTES } from '@/lib/routes';
import { useCart, type CartItem } from '@/components/CartProvider';
import { useEnquirySelection } from '@/components/EnquirySelectionProvider';
import { resolveProductImageUrl } from '@/lib/productImageUrl';
import {
  getEnquiryFormDefaults,
  hasEnquiryProductPrefill,
  parseEnquiryPrefillFromSearchParams,
  type EnquiryPrefillParams,
} from '@/lib/enquiry';
interface ProductOption {
  id: number;
  name: string;
}

function formatPrice(price: number) {
  return price > 0 ? `₹ ${price.toFixed(2)}` : 'POV';
}

function buildSingleProductEnquiryMessage(
  prefill: EnquiryPrefillParams,
  notes: string
) {
  const quantity = Number(prefill.quantity) || 1;
  const price = Number(prefill.price) || 0;
  const packSize = prefill.packSize || 'Standard';
  const priceText =
    price > 0
      ? `${formatPrice(price)} each (${formatPrice(price * quantity)})`
      : 'POV';
  const casText = prefill.casNo ? `, CAS No.: ${prefill.casNo}` : '';

  return [
    'I would like to enquire about the following product:',
    '',
    `1. ${prefill.productName ?? ''} — Pack Size: ${packSize}, Qty: ${quantity}${casText} — ${priceText}`,
    '',
    `Total items: ${quantity}`,
    `Estimated total: ${formatPrice(price * quantity)}`,
    ...(notes ? ['', 'Additional notes:', notes] : []),
  ].join('\n');
}

function buildCartEnquiryMessage(
  items: CartItem[],
  subtotal: number,
  count: number,
  notes: string
) {
  const isBulk = items.length > 1;

  const lines = items.map((item, index) => {
    const priceText =
      item.price > 0
        ? `${formatPrice(item.price)} each (${formatPrice(
            item.price * item.quantity
          )})`
        : 'POV';
    const casText = item.casNo ? `, CAS No.: ${item.casNo}` : '';
    return `${index + 1}. ${item.name} — Pack Size: ${item.packSize}, Qty: ${item.quantity}${casText} — ${priceText}`;
  });

  return [
    isBulk
      ? 'I would like to place a bulk order for the following products:'
      : 'I would like to enquire about the following product:',
    '',
    ...lines,
    '',
    `Total items: ${count}`,
    `Estimated total: ${formatPrice(subtotal)}`,
    ...(notes ? ['', 'Additional notes:', notes] : []),
  ].join('\n');
}

export default function EnquiryForm() {
  return (
    <Suspense fallback={<LoadingState message="Loading enquiry form..." />}>
      <EnquiryFormContent />
    </Suspense>
  );
}

function EnquiryFormContent() {
  const searchParams = useSearchParams();
  const productFieldRef = useRef<HTMLDivElement>(null);
  const appliedPrefillKeyRef = useRef<string | null>(null);
  const { items, subtotal, count, updateQuantity, removeItem } = useCart();
  const {
    items: selectedEnquiryItems,
    subtotal: selectedEnquirySubtotal,
    count: selectedEnquiryCount,
    updateQuantity: updateSelectedEnquiryQuantity,
    removeItem: removeSelectedEnquiryItem,
    clearItems: clearSelectedEnquiryItems,
  } = useEnquirySelection();
  const hasCartItems = items.length > 0;
  const hasSelectedEnquiryItems = selectedEnquiryItems.length > 0;
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [showProductResults, setShowProductResults] = useState(false);
  const [formData, setFormData] = useState(() =>
    getEnquiryFormDefaults(searchParams)
  );

  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const applyProductPrefill = (prev: typeof formData) => {
    const prefill = parseEnquiryPrefillFromSearchParams(searchParams);
    if (!hasEnquiryProductPrefill(prefill)) return prev;

    return {
      ...prev,
      subject: prefill.subject || prev.subject || 'product-inquiry',
      productCategory: prefill.productName || prev.productCategory,
    };
  };

  const prefill = useMemo(
    () => parseEnquiryPrefillFromSearchParams(searchParams),
    [searchParams]
  );

  const isProductLocked = useMemo(
    () => !hasSelectedEnquiryItems && hasEnquiryProductPrefill(prefill),
    [hasSelectedEnquiryItems, prefill]
  );

  // Product detail selections are retained in the enquiry selection list. The
  // URL remains as a fallback for a directly opened or shared enquiry link.
  const isSingleProductMode =
    !hasSelectedEnquiryItems && Boolean(prefill.productId || prefill.productName);

  const singleProduct = useMemo(() => {
    if (!isSingleProductMode) return null;

    return {
      name: prefill.productName ?? '',
      packSize: prefill.packSize || 'Standard',
      quantity: Number(prefill.quantity) || 1,
      price: Number(prefill.price) || 0,
      casNo: prefill.casNo,
    };
  }, [isSingleProductMode, prefill]);

  // Whether the enquiry already has product context (single product or cart),
  // meaning the free-text message becomes optional notes.
  const hasProductContext =
    isSingleProductMode || hasSelectedEnquiryItems || hasCartItems;

  useLayoutEffect(() => {
    const prefillKey = searchParams.toString();
    if (prefillKey === appliedPrefillKeyRef.current) return;
    appliedPrefillKeyRef.current = prefillKey;

    setFormData((prev) => applyProductPrefill(prev));
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.user) return;

        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || data.user.name || '',
          email: prev.email || data.user.email || '',
        }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setProducts(
          data.map((product: { id: number; name: string }) => ({
            id: product.id,
            name: product.name,
          }))
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productFieldRef.current &&
        !productFieldRef.current.contains(event.target as Node)
      ) {
        setShowProductResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchingProducts = useMemo(() => {
    const query = formData.productCategory.trim().toLowerCase();
    if (!query) return [];

    return products
      .filter((product) => product.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [formData.productCategory, products]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedNotes = formData.message.trim();

    if (!hasProductContext && !trimmedNotes) {
      setErrorMessage('Please enter your message / requirements.');
      return;
    }

    const finalMessage = hasSelectedEnquiryItems
      ? buildCartEnquiryMessage(
          [...selectedEnquiryItems, ...items],
          selectedEnquirySubtotal + subtotal,
          selectedEnquiryCount + count,
          trimmedNotes
        )
      : isSingleProductMode
      ? buildSingleProductEnquiryMessage(prefill, trimmedNotes)
      : hasCartItems
      ? buildCartEnquiryMessage(items, subtotal, count, trimmedNotes)
      : trimmedNotes;

    try {
      setIsSubmitting(true);

      setSuccessMessage('');

      setErrorMessage('');

      const response = await fetch('/api/enquiry', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          ...formData,
          message: finalMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message || 'Something went wrong'
        );

        return;
      }

      setSuccessMessage(data.message);

      if (hasSelectedEnquiryItems) {
        clearSelectedEnquiryItems();
      }

      setFormData((prev) =>
        applyProductPrefill({
          fullName: '',
          companyName: '',
          email: '',
          phoneNumber: '',
          subject: '',
          productCategory: '',
          message: '',
        })
      );

      setFileName(null);
    } catch (error) {
      console.log(error);

      setErrorMessage('Failed to submit enquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData((prev) =>
      applyProductPrefill({
        fullName: '',
        companyName: '',
        email: '',
        phoneNumber: '',
        subject: '',
        productCategory: '',
        message: '',
      })
    );

    setFileName(null);

    setSuccessMessage('');

    setErrorMessage('');  
  };

  const inputClass =
  'w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition invalid:border-border';
  const disabledClass = 'opacity-70 cursor-not-allowed';
  const labelClass = 'block text-sm font-medium text-foreground mb-2';

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
          <Mail className="text-primary" size={20} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Send an Enquiry
          </h2>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            {successMessage}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        {/* SINGLE PRODUCT (from product detail page) */}
        {isSingleProductMode && singleProduct && (
          <div className="rounded-xl border border-border bg-surface-elevated p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Product in your enquiry
              </h3>
              <span className="text-xs text-muted">1 item</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-surface-elevated">
                <img
                  src={resolveProductImageUrl(null)}
                  alt={singleProduct.name}
                  className="h-full w-full object-contain p-1.5"
                />
              </div>

              <div className="min-w-[8rem] flex-1">
                <p className="line-clamp-1 text-sm font-semibold text-foreground">
                  {singleProduct.name}
                </p>

                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
                  <span>Pack Size: {singleProduct.packSize}</span>
                  <span>Qty: {singleProduct.quantity}</span>
                  {singleProduct.casNo ? (
                    <span>CAS No.: {singleProduct.casNo}</span>
                  ) : null}
                  {singleProduct.price > 0 ? (
                    <span>{formatPrice(singleProduct.price)} each</span>
                  ) : null}
                </div>
              </div>

              {singleProduct.price > 0 ? (
                <div className="ml-auto w-20 flex-shrink-0 text-right">
                  <p className="text-sm font-bold text-primary">
                    {formatPrice(singleProduct.price * singleProduct.quantity)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* SELECTED PRODUCTS (from product detail pages) */}
        {hasSelectedEnquiryItems && (
          <div className="rounded-xl border border-border bg-surface-elevated p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Products in your enquiry
              </h3>
              <span className="text-xs text-muted">
                {selectedEnquiryCount}{' '}
                {selectedEnquiryCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="space-y-3">
              {selectedEnquiryItems.map((item) => (
                <div
                  key={`${item.id}-${item.packSize}`}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3"
                >
                  <Link
                    href={ROUTES.productDetail(item.id)}
                    className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-surface-elevated"
                  >
                    <img
                      src={resolveProductImageUrl(item.image)}
                      alt={item.name}
                      className="h-full w-full object-contain p-1.5"
                    />
                  </Link>

                  <div className="min-w-[8rem] flex-1">
                    <Link
                      href={ROUTES.productDetail(item.id)}
                      className="line-clamp-1 text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
                      <span>Pack Size: {item.packSize}</span>
                      {item.casNo ? <span>CAS No.: {item.casNo}</span> : null}
                      {item.price > 0 ? <span>{formatPrice(item.price)} each</span> : null}
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-border">
                      <button
                        type="button"
                        onClick={() => updateSelectedEnquiryQuantity(item.id, item.packSize, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center text-muted transition hover:text-foreground"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-9 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateSelectedEnquiryQuantity(item.id, item.packSize, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center text-muted transition hover:text-foreground"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {item.price > 0 ? (
                      <div className="w-20 flex-shrink-0 text-right">
                        <p className="text-sm font-bold text-primary">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeSelectedEnquiryItem(item.id, item.packSize)}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border text-muted transition hover:border-rose-500 hover:text-rose-500"
                      aria-label="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted">Estimated total</span>
              <span className="text-base font-bold text-primary">{formatPrice(selectedEnquirySubtotal)}</span>
            </div>
          </div>
        )}

        {/* PRODUCTS IN ENQUIRY */}
        {!isSingleProductMode && hasCartItems && (
          <div className="rounded-xl border border-border bg-surface-elevated p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Products in your enquiry
              </h3>
              <span className="text-xs text-muted">
                {count} {count === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.packSize}`}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3"
                >
                  <Link
                    href={ROUTES.productDetail(item.id)}
                    className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-surface-elevated"
                  >
                    <img
                      src={resolveProductImageUrl(item.image)}
                      alt={item.name}
                      className="h-full w-full object-contain p-1.5"
                    />
                  </Link>

                  <div className="min-w-[8rem] flex-1">
                    <Link
                      href={ROUTES.productDetail(item.id)}
                      className="line-clamp-1 text-sm font-semibold text-foreground hover:text-primary"
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

                  <div className="ml-auto flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-border">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.packSize,
                            item.quantity - 1
                          )
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
                          updateQuantity(
                            item.id,
                            item.packSize,
                            item.quantity + 1
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center text-muted transition hover:text-foreground"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {item.price > 0 ? (
                      <div className="w-20 flex-shrink-0 text-right">
                        <p className="text-sm font-bold text-primary">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ) : null}

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
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted">Estimated total</span>
              <span className="text-base font-bold text-primary">
                {formatPrice(subtotal)}
              </span>
            </div>
          </div>
        )}

        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className={labelClass}>
              Full Name
              <RequiredMark />
            </label>

            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
              className={inputClass}
            />
          </div>

          {/* Company */}
          <div>
            <label className={labelClass}>
              Company / Organization
              <RequiredMark />
            </label>

            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Enter company name"
              required
              className={inputClass}
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <label className={labelClass}>
              Email Address
              <RequiredMark />
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
              required
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass}>
              Phone Number
              <RequiredMark />
            </label>

            <div className="flex gap-2">
              <select className="bg-surface-elevated text-foreground text-sm outline-none py-2 px-2 rounded-lg border border-border">
                <option value="+91">🇮🇳 (+91)</option>
                <option value="+1">🇺🇸 (+1)</option>
                <option value="+44">🇬🇧 (+44)</option>
              </select>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                required
                className={`${inputClass} flex-1`}
              />
            </div>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subject */}
          <div>
            <label className={labelClass}>
              Subject
              <RequiredMark />
            </label>

            <select
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              disabled={isProductLocked}
              // required
              className={`${inputClass} ${isProductLocked ? disabledClass : ''}`}
            >
              <option value="">
                Select enquiry subject
              </option>

              <option value="product-inquiry">
                Product Inquiry
              </option>

              <option value="bulk-order">
                Bulk Order
              </option>

              {/* <option value="price-quote">
                Price Quote
              </option>

              <option value="technical-support">
                Technical Support
              </option>

              <option value="custom-product">
                Custom Product
              </option>

              <option value="other">Other</option> */}
            </select>
          </div>

          {/* Product */}
          <div ref={productFieldRef} className="relative">
            <label className={labelClass}>
              Product
            </label>

            <input
              type="text"
              name="productCategory"
              value={formData.productCategory}
              onChange={(e) => {
                handleInputChange(e);
                setShowProductResults(true);
              }}
              onFocus={() => setShowProductResults(true)}
              placeholder="Search product or category"
              autoComplete="off"
              disabled={isProductLocked}
              readOnly={isProductLocked}
              className={`${inputClass} ${isProductLocked ? disabledClass : ''}`}
            />

            {!isProductLocked && showProductResults && matchingProducts.length > 0 && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
                {matchingProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        productCategory: product.name,
                      }));
                      setShowProductResults(false);
                    }}
                    className="block w-full px-4 py-3 text-left text-sm text-foreground transition hover:bg-primary/10 hover:text-primary"
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            )}

            <p className="mt-2 text-xs text-muted">
              {isProductLocked
                ? 'This enquiry is linked to the selected product.'
                : 'Select a product to add its name to your enquiry.'}
            </p>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className={labelClass}>
            {hasProductContext
              ? 'Additional Notes (Optional)'
              : 'Your Message / Requirements'}
            {hasProductContext ? null : <RequiredMark />}
          </label>

          <textarea
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder={
              hasProductContext
                ? 'Add any specific requirements or notes for these products...'
                : 'Please describe your requirements in detail...'
            }
            required={!hasProductContext}
            rows={4}
            className={`${inputClass} resize-none py-3`}
          />
        </div>

        {/* File Upload */}
        <div>
          <label className={`flex items-center gap-2 ${labelClass}`}>
            <FileUp size={16} />
            Upload File (Optional)
          </label>

          <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface-elevated border border-border cursor-pointer hover:border-primary transition">
            <span className="text-sm text-muted truncate">
              {fileName
                ? fileName
                : 'Upload SDS, specifications or any supporting file'}
            </span>

            <span className="text-sm text-primary font-medium whitespace-nowrap">
              Choose File
            </span>

            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
          </label>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send size={16} />

            {isSubmitting
              ? 'Sending...'
              : 'Send Enquiry'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex-1 h-11 rounded-xl bg-surface-elevated hover:bg-surface border border-border text-foreground font-semibold transition flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {/* Privacy */}
        <div className="flex items-start gap-2 pt-4 border-t border-border">
          <span className="text-primary text-sm">
            ℹ
          </span>

          <p className="text-sm text-muted">
            Your information is secure and will only
            be used to respond to your enquiry.
          </p>
        </div>
      </form>
    </div>
  );
}

