"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  Save,
  Trash2,
  FileText,
  ImagePlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import { RequiredMark } from "@/components/ui/FieldLabel";
import SimpleImageUpload from "@/components/admin/SimpleImageUpload";
import {
  ALLOWED_PRODUCT_IMAGE_ACCEPT,
  getGalleryImagesFromList,
  getPrimaryImageFromList,
  validateProductImageFile,
} from "@/lib/productImageUtils";
import { resolveProductImageUrl } from "@/lib/productImageUrl";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/products";
import { normalizeDocumentType } from "@/lib/productDocumentTypes";
import { PAGE_CONTAINER_CLASS } from "@/lib/layout";
import { useLiveUpdates } from "@/lib/hooks/useLiveUpdates";
import { ROUTES } from "@/lib/routes";
import { validateCasNumber } from "@/lib/validators";
import {
  ADMIN_FORM_CARD_CLASS,
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_FORM_TEXTAREA_CLASS,
  ADMIN_LABEL_CLASS,
  ADMIN_SECONDARY_BTN_CLASS,
  withFieldError,
} from "@/lib/admin/formStyles";

type GalleryItem = {
  id: string;
  existingImageId?: number;
  file?: File;
  previewUrl: string;
};

type CategoryOption = {
  id: number | string;
  name: string;
};

type SubcategoryOption = {
  id: number | string;
  name: string;
  categoryId: number | string;
};

type SpecItem = {
  test: string;
  result: string;
  parameter?: string;
  value?: string;
};

type DocItem = {
  label: string;
  name: string;
  fileUrl?: string;
  type?: string;
  file?: File;
};

export default function ProductFormPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const id = params?.id;

  // UI / Mode Flags
  const isCreate = pathname === "/admin/products/create";
  const isEdit = pathname.includes("/edit/");
  const isView = pathname.includes("/view/");
  const disabled = isView;

  // Operational States
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toasts, removeToast, showError } = useToast();

  // Core Product Payload Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [applications, setApplications] = useState("");
  const [safetyInfo, setSafetyInfo] = useState("");
  const [casNumber, setCasNumber] = useState("");
  const [casError, setCasError] = useState("");
  const [casTouched, setCasTouched] = useState(false);
  const [molecularFormula, setMolecularFormula] = useState("");
  const [molecularWeight, setMolecularWeight] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [specifications, setSpecifications] = useState<SpecItem[]>([]);
  const [documents, setDocuments] = useState<DocItem[]>([]);

  // Isolated State Architecture for Assets
  const [singleImageFile, setSingleImageFile] = useState<File | null>(null);
  const [singleImagePreview, setSingleImagePreview] = useState<string>("");
  const [removePrimaryImage, setRemovePrimaryImage] = useState(false);
  const [primaryImageError, setPrimaryImageError] = useState("");
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryImageError, setGalleryImageError] = useState("");
  const [galleryDragging, setGalleryDragging] = useState(false);
  const blobUrlsRef = useRef<Set<string>>(new Set());

  const [packSize, setPackSize] = useState("");
  const [quantity, setQuantity] = useState("");
  const [units, setUnits] = useState("");
  const [arGrade, setArGrade] = useState(false);
  const [inStock, setInStock] = useState(true);
  const [bestSeller, setBestSeller] = useState(false);

  // Transient Row Fields
  const [newSpecTest, setNewSpecTest] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [newDocLabel, setNewDocLabel] = useState("");
  const [newDocFile, setNewDocFile] = useState<File | null>(null);

  const registerBlobUrl = useCallback((url: string) => {
    blobUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeBlobUrl = useCallback((url?: string | null) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
    }
  }, []);

  const revokeAllBlobUrls = useCallback(() => {
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsRef.current.clear();
  }, []);

  // Type-robust subcategory filtering matching both String and Number formats
  const filteredSubcategories = categoryId
    ? subcategories.filter(
        (item) => String(item.categoryId) === String(categoryId),
      )
    : [];

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      try {
        setPageLoading(true);
        revokeAllBlobUrls();

        if (isCreate) {
          setName("");
          setDescription("");
          setShortDescription("");
          setApplications("");
          setSafetyInfo("");
          setCasNumber("");
          setCasError("");
          setCasTouched(false);
          setMolecularFormula("");
          setMolecularWeight("");
          setPrice("");
          setStock("");
          setCategoryId("");
          setSubCategoryId("");
          setSpecifications([]);
          setDocuments([]);
          setSingleImageFile(null);
          setSingleImagePreview("");
          setRemovePrimaryImage(false);
          setPrimaryImageError("");
          setGalleryItems([]);
          setGalleryImageError("");
          setPackSize("");
          setQuantity("");
          setUnits("");
          setArGrade(false);
          setInStock(true);
          setBestSeller(false);
        }

        const [catRes, subRes, productRes] = await Promise.all([
          fetch("/api/category", { cache: "no-store" }),
          fetch("/api/subcategory", { cache: "no-store" }),
          (isEdit || isView) && id
            ? fetch(`/api/products/${id}`, { cache: "no-store" })
            : Promise.resolve(null),
        ]);

        if (!active) return;

        if (catRes.ok) setCategories(await catRes.json());
        if (subRes.ok) setSubcategories(await subRes.json());

        if (productRes) {
          const product = await productRes.json();
          if (!active) return;

          if (!productRes.ok) {
            toast.error(product.error || "Failed to load product");
            return;
          }

          if (product) {
            const loadedCas = product.casNumber || "";
            setName(product.name || "");
            setDescription(product.description || "");
            setShortDescription(product.shortDescription || "");
            setApplications(product.applications || "");
            setSafetyInfo(product.safetyInfo || "");
            setCasNumber(loadedCas);
            setCasTouched(false);
            setCasError(
              loadedCas && !disabled ? validateCasNumber(loadedCas) || "" : ""
            );
            setMolecularFormula(product.molecularFormula || "");
            setMolecularWeight(
              product.molecularWeight != null ? String(product.molecularWeight) : ""
            );
            setPrice(String(product.price ?? ""));
            setStock(String(product.stock ?? ""));
            setCategoryId(String(product.subCategory?.categoryId || ""));
            setSubCategoryId(String(product.subCategoryId || ""));
            setSpecifications(
              (product.specifications || []).map((spec: { parameter?: string; value?: string; test?: string; result?: string }) => ({
                test: spec.parameter || spec.test || "",
                result: spec.value || spec.result || "",
              }))
            );
            setDocuments(
              (product.documents || []).map((doc: { name?: string; label?: string; fileUrl?: string; type?: string }) => ({
                label: doc.name || doc.label || "",
                name: doc.name || doc.label || "Document",
                fileUrl: doc.fileUrl,
                type: normalizeDocumentType(doc.type, doc.name || doc.label || ""),
              }))
            );

            const primaryImage = getPrimaryImageFromList(product.images || []);
            const galleryImages = getGalleryImagesFromList(product.images || []);

            const resolvedUrl = primaryImage?.imageUrl
              ? resolveProductImageUrl(primaryImage.imageUrl)
              : "";

            setSingleImagePreview(resolvedUrl);
            setSingleImageFile(null);
            setRemovePrimaryImage(false);
            setPrimaryImageError("");

            setGalleryItems(
              galleryImages
                .filter((img) => Boolean(img.imageUrl))
                .map((img, index) => ({
                  id: `existing-${img.id ?? index}`,
                  existingImageId: typeof img.id === "number" ? img.id : undefined,
                  previewUrl: resolveProductImageUrl(img.imageUrl),
                }))
            );
            setGalleryImageError("");

            const firstPackSize = product.packSizes?.[0];
            if (firstPackSize?.size) {
              const knownUnits = ["mg", "g", "kg", "ml", "L"];
              const parts = firstPackSize.size.trim().split(/\s+/);
              const lastPart = parts[parts.length - 1];

              if (knownUnits.includes(lastPart)) {
                setUnits(lastPart);
                setPackSize(parts.slice(0, -1).join(" "));
              } else {
                setPackSize(firstPackSize.size);
                setUnits("");
              }
            } else {
              setPackSize("");
              setUnits("");
            }

            setQuantity(firstPackSize ? String(firstPackSize.stock ?? "") : "");
            setArGrade(Boolean(product.isArGrade));
            setInStock(product.isInStock !== false);
            setBestSeller(product.isBestSeller || false);
          }
        }
      } catch {
        if (active) {
          toast.error("Failed to load product details");
        }
      } finally {
        if (active) {
          setPageLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      active = false;
    };
  }, [id, isCreate, isEdit, isView, disabled, revokeAllBlobUrls]);

  useLiveUpdates(["categories", "subcategories"], () => {
    void Promise.all([
      fetch("/api/category", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) setCategories(data);
        }),
      fetch("/api/subcategory", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) setSubcategories(data);
        }),
    ]).catch(() => {});
  });

  useEffect(() => {
    return () => {
      revokeAllBlobUrls();
    };
  }, [revokeAllBlobUrls]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      showError("Product Name is required.");
      return false;
    }

    if (!categoryId) {
      showError("Please select a Category.");
      return false;
    }

    if (!subCategoryId) {
      showError("Please select a Sub Category.");
      return false;
    }

    if (!description.trim()) {
      showError("Description is required.");
      return false;
    }

    const casValidationError = validateCasNumber(casNumber, { required: true });
    if (casValidationError) {
      setCasTouched(true);
      setCasError(casValidationError);
      showError(casValidationError);
      return false;
    }

    if (price.trim() && Number(price) < 0) {
      showError("Price cannot be negative.");
      return false;
    }

    if (stock.trim() && Number(stock) < 0) {
      showError("Stock cannot be negative.");
      return false;
    }

    if (singleImageFile) {
      const primaryError = validateProductImageFile(singleImageFile, "Main image");
      if (primaryError) {
        setPrimaryImageError(primaryError);
        showError(primaryError);
        return false;
      }
    }

    for (const item of galleryItems) {
      if (item.file) {
        const galleryError = validateProductImageFile(item.file, "Gallery image");
        if (galleryError) {
          setGalleryImageError(galleryError);
          showError(galleryError);
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (isView) return;
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("shortDescription", shortDescription);
      formData.append("applications", applications);
      formData.append("safetyInfo", safetyInfo);
      formData.append("casNumber", casNumber.trim());
      formData.append("molecularFormula", molecularFormula);
      formData.append("molecularWeight", molecularWeight);
      formData.append("price", price.trim() || "0");
      formData.append("stock", stock.trim() || "0");
      formData.append("subCategoryId", subCategoryId);
      formData.append("packSize", packSize);
      formData.append("quantity", quantity);
      formData.append("units", units);
      formData.append("arGrade", String(arGrade));
      formData.append("inStock", String(inStock));
      formData.append("bestSeller", String(bestSeller));

      formData.append(
        "specifications",
        JSON.stringify(
          specifications.map((spec) => ({
            parameter: spec.test || spec.parameter || "",
            value: spec.result || spec.value || "",
          }))
        )
      );

      formData.append(
        "documents",
        JSON.stringify(
          documents.map((doc) => ({
            name: doc.label || doc.name || "Document",
            fileUrl: doc.fileUrl || "",
            type:
              doc.type ||
              normalizeDocumentType(undefined, doc.label || doc.name || ""),
          }))
        )
      );

      if (isEdit) {
        if (removePrimaryImage && !singleImageFile) {
          formData.append("removePrimaryImage", "true");
        }
        formData.append(
          "keptGalleryImageIds",
          JSON.stringify(
            galleryItems
              .map((item) => item.existingImageId)
              .filter((value): value is number => typeof value === "number")
          )
        );
      }

      if (singleImageFile) {
        formData.append("primaryImage", singleImageFile);
      }
      galleryItems.forEach((item) => {
        if (item.file) {
          formData.append("galleryImages", item.file);
        }
      });
      documents.forEach((doc, idx) => {
        if (doc.file) formData.append(`document_${idx}`, doc.file);
      });

      const url = isCreate ? "/api/products" : `/api/products/${id}`;
      const method = isCreate ? "POST" : "PUT";

      const response = await fetch(url, { method, body: formData });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      toast.success(isCreate ? "Product created successfully" : "Product updated successfully");
      router.push(ROUTES.admin.products);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Execution error encountered";
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  // Specification Handlers
  const addSpecification = () => {
    if (!newSpecTest.trim() || !newSpecValue.trim()) {
      showError("Both Test Parameter and Value are required.");
      return;
    }
    setSpecifications([
      ...specifications,
      { test: newSpecTest.trim(), result: newSpecValue.trim() },
    ]);
    setNewSpecTest("");
    setNewSpecValue("");
  };

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  // Document Handlers
  const addDocument = () => {
    if (!newDocLabel.trim()) {
      showError("Document Label is required.");
      return;
    }
    if (!newDocFile) {
      showError("Please pick a documentation file asset layout.");
      return;
    }
    const label = newDocLabel.trim();
    setDocuments([
      ...documents,
      {
        label,
        file: newDocFile,
        name: newDocFile.name,
        type: normalizeDocumentType(undefined, label),
      },
    ]);
    setNewDocLabel("");
    setNewDocFile(null);
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  // Image Streams Setup Handles
  const handlePrimaryFileSelect = (file: File | null) => {
    if (!file) return;

    const validationError = validateProductImageFile(file, "Main image");
    if (validationError) {
      setPrimaryImageError(validationError);
      showError(validationError);
      return;
    }

    revokeBlobUrl(singleImagePreview);
    setPrimaryImageError("");
    setSingleImageFile(file);
    setSingleImagePreview(registerBlobUrl(URL.createObjectURL(file)));
    setRemovePrimaryImage(false);
  };

  const handleRemovePrimaryImage = () => {
    revokeBlobUrl(singleImagePreview);
    setSingleImageFile(null);
    setSingleImagePreview("");
    setPrimaryImageError("");
    setRemovePrimaryImage(true);
  };

  const addGalleryFiles = (files: File[]) => {
    if (files.length === 0) return;

    const validItems: GalleryItem[] = [];
    let firstError = "";

    for (const file of files) {
      const validationError = validateProductImageFile(file, "Gallery image");
      if (validationError) {
        if (!firstError) firstError = validationError;
        continue;
      }

      const previewUrl = registerBlobUrl(URL.createObjectURL(file));
      validItems.push({
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl,
      });
    }

    if (validItems.length > 0) {
      setGalleryItems((prev) => [...prev, ...validItems]);
    }

    if (firstError) {
      setGalleryImageError(firstError);
      showError(firstError);
    } else {
      setGalleryImageError("");
    }
  };

  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    addGalleryFiles(files);
  };

  const handleGalleryDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setGalleryDragging(false);
    if (disabled) return;
    addGalleryFiles(Array.from(e.dataTransfer.files || []));
  };

  const handleRemoveGalleryImage = (itemId: string) => {
    setGalleryItems((prev) => {
      const target = prev.find((item) => item.id === itemId);
      if (target) {
        revokeBlobUrl(target.previewUrl);
      }
      return prev.filter((item) => item.id !== itemId);
    });
    setGalleryImageError("");
  };

  const cardClass = `${ADMIN_FORM_CARD_CLASS} hover:border-border`;
  const labelClass = ADMIN_LABEL_CLASS;
  const viewFieldOverride = isView
    ? "disabled:opacity-95 disabled:cursor-default"
    : "";
  const inputClass = `${ADMIN_FORM_INPUT_CLASS} ${viewFieldOverride}`.trim();
  const textareaClass = `${ADMIN_FORM_TEXTAREA_CLASS} ${viewFieldOverride}`.trim();

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-blue-500/30">
      <header className="bg-surface/90 border-b border-border backdrop-blur-md sticky top-0 z-30">
        <div className={`${PAGE_CONTAINER_CLASS} h-16 flex items-center justify-between gap-2 sm:gap-4`}>
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <Link
              href="/admin/products"
              className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-lg bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-primary transition-all"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold tracking-tight truncate">
                  {isCreate && "Create Product"}
                  {isEdit && "Edit Product"}
                  {isView && "Product Information"}
                </h1>
              </div>
            </div>
          </div>

          {!isView && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="h-10 sm:h-11 px-3 sm:px-5 shrink-0 whitespace-nowrap rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-40 text-xs sm:text-sm font-semibold tracking-wide text-white flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : isCreate ? (
                <Plus size={16} />
              ) : (
                <Save size={16} />
              )}
              {loading
                ? "Processing..."
                : isCreate
                  ? "Create Product"
                  : "Update Product"}
            </button>
          )}
        </div>
      </header>

      <main className={`${PAGE_CONTAINER_CLASS} py-4 sm:py-6`}>
        <ToastContainer toasts={toasts} onClose={removeToast} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ================= LEFT COLUMN ================= */}
          <div className="min-w-0 lg:col-span-2 space-y-6">
            {/* Product Information */}
            <div className={cardClass}>
              <h2 className="text-sm font-bold uppercase text-foreground mb-5 border-b border-border pb-3">
                Product Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>
                    Product Name
                    <RequiredMark />
                  </label>
                  <input
                    disabled={disabled}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="Enter Product Name"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>
                      CAS Number
                      <RequiredMark />
                    </label>
                    <input
                      disabled={disabled}
                      value={casNumber}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setCasNumber(nextValue);
                        if (casTouched || casError) {
                          setCasError(
                            validateCasNumber(nextValue, { required: true }) || ""
                          );
                        }
                      }}
                      onBlur={() => {
                        setCasTouched(true);
                        setCasError(
                          validateCasNumber(casNumber, { required: true }) || ""
                        );
                      }}
                      className={withFieldError(inputClass, Boolean(casError))}
                      placeholder="e.g. 67-64-1"
                    />
                    {casError ? (
                      <p className="mt-1.5 text-xs font-medium text-red-600 theme-dark:text-red-400">
                        {casError}
                      </p>
                    ) : !disabled ? (
                      <p className="mt-1.5 text-xs text-muted">
                        Format: 2-7 digits, 2 digits, 1 digit (e.g. 00-00-0 or 67-64-1)
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className={labelClass}>Molecular Formula</label>
                    <input
                      disabled={disabled}
                      value={molecularFormula}
                      onChange={(e) => setMolecularFormula(e.target.value)}
                      className={inputClass}
                      placeholder="C3H6O"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Molecular Weight</label>
                  <input
                    disabled={disabled}
                    value={molecularWeight}
                    onChange={(e) => setMolecularWeight(e.target.value)}
                    className={inputClass}
                    placeholder="58.08"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Description
                    <RequiredMark />
                  </label>
                  <textarea
                    disabled={disabled}
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={textareaClass}
                    placeholder="Enter Product Description"
                  />
                </div>

                <div>
                  <label className={labelClass}>Short Description</label>
                  <textarea
                    disabled={disabled}
                    rows={2}
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    className={textareaClass}
                    placeholder="Brief summary shown on the product page"
                  />
                </div>

                <div>
                  <label className={labelClass}>Applications</label>
                  <textarea
                    disabled={disabled}
                    rows={4}
                    value={applications}
                    onChange={(e) => setApplications(e.target.value)}
                    className={textareaClass}
                    placeholder="Describe product applications"
                  />
                </div>

                <div>
                  <label className={labelClass}>Safety Information</label>
                  <textarea
                    disabled={disabled}
                    rows={4}
                    value={safetyInfo}
                    onChange={(e) => setSafetyInfo(e.target.value)}
                    className={textareaClass}
                    placeholder="Enter safety handling and storage information"
                  />
                </div>
              </div>
            </div>

            {/* Specifications System */}
            <div className={cardClass}>
              <h2 className="text-sm font-bold uppercase text-foreground mb-5 border-b border-border pb-3">
                Specifications
              </h2>

              {!disabled && (
                <div className="grid md:grid-cols-3 gap-3 mb-5 items-end">
                  <div>
                    <label className={labelClass}>Test Parameter</label>
                    <input
                      value={newSpecTest}
                      onChange={(e) => setNewSpecTest(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Purity"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Specified Rule Value</label>
                    <input
                      value={newSpecValue}
                      onChange={(e) => setNewSpecValue(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. >= 99.5%"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addSpecification}
                    className={`h-11 ${ADMIN_SECONDARY_BTN_CLASS} flex items-center justify-center gap-2`}
                  >
                    <Plus size={16} /> Add Spec
                  </button>
                </div>
              )}

              {specifications.length === 0 ? (
                <p className="text-sm text-muted italic py-2">No specifications added yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-surface-elevated border-b border-border text-muted font-medium">
                        <th className="px-4 py-3">Test</th>
                        <th className="px-4 py-3">Specification Requirement</th>
                        {!disabled && <th className="px-4 py-3 text-right w-20">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-foreground">
                      {specifications.map((spec, index) => (
                        <tr key={index} className="hover:bg-surface-elevated">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {spec.test || spec.parameter}
                          </td>
                          <td className="px-4 py-3">{spec.result || spec.value}</td>
                          {!disabled && (
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => removeSpecification(index)}
                                className="text-muted hover:text-red-600 theme-dark:hover:text-red-400 p-1 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Documents Subsystem */}
            <div className={cardClass}>
              <h2 className="text-sm font-bold uppercase text-foreground mb-5 border-b border-border pb-3">
                Documents
              </h2>

              {!disabled && (
                <div className="grid md:grid-cols-3 gap-3 mb-5 items-end">
                  <div>
                    <label className={labelClass}>Document Label</label>
                    <input
                      value={newDocLabel}
                      onChange={(e) => setNewDocLabel(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. MSDS, COA"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Upload Attachment</label>
                    <div className="relative overflow-hidden rounded-lg">
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          e.target.value = "";
                          setNewDocFile(file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`${inputClass} flex items-center text-muted pr-4`}>
                        <span className="truncate">
                          {newDocFile ? newDocFile.name : "Choose File..."}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addDocument}
                    className={`h-11 ${ADMIN_SECONDARY_BTN_CLASS} flex items-center justify-center gap-2`}
                  >
                    <Plus size={16} /> Add Doc
                  </button>
                </div>
              )}

              {documents.length === 0 ? (
                <p className="text-sm text-muted italic py-2">No documents attached yet.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-elevated text-sm hover:border-primary transition-colors"
                    >
                      <div className="flex items-center gap-3 truncate min-w-0">
                        <FileText className="text-primary flex-shrink-0" size={18} />
                        <div className="truncate">
                          <p className="font-medium text-foreground truncate">{doc.label}</p>
                          <p className="text-xs text-muted truncate">{doc.name || "Remote File Layout Entity"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {doc.fileUrl ? (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-primary hover:border-primary/50 transition-colors"
                          >
                            View <ExternalLink size={12} />
                          </a>
                        ) : null}
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            className="text-muted hover:text-red-600 theme-dark:hover:text-red-400 p-2 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="min-w-0 space-y-6 lg:sticky lg:top-24 self-start">
            {/* Purchase Information */}
            <div className={cardClass}>
              <h2 className="text-sm font-bold uppercase text-foreground mb-5 border-b border-border pb-3">
                Purchase Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>
                    Category
                    <RequiredMark />
                  </label>
                  <select
                    disabled={disabled}
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setSubCategoryId("");
                    }}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {(categoryId || isView) && (
                  <div>
                    <label className={labelClass}>
                      Sub Category
                      <RequiredMark />
                    </label>
                    <select
                      disabled={disabled || !categoryId}
                      value={subCategoryId}
                      onChange={(e) => setSubCategoryId(e.target.value)}
                      className={`${inputClass} appearance-none`}
                    >
                      <option value="">
                        {filteredSubcategories.length > 0
                          ? "Select Sub Category"
                          : "No sub categories available"}
                      </option>
                      {filteredSubcategories.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    disabled={disabled}
                    value={packSize}
                    onChange={(e) => setPackSize(e.target.value)}
                    className={inputClass}
                    placeholder="Pack Size"
                  />

                  <input
                    disabled={disabled}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className={inputClass}
                    placeholder="Quantity"
                  />

                  <select
                    disabled={disabled}
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="">Unit</option>
                    <option value="mg">mg</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Price ($)</label>
                  <input
                    disabled={disabled}
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Stock Available</label>
                  <input
                    disabled={disabled}
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div className={cardClass}>
              <h2 className="text-sm font-bold uppercase text-foreground mb-5 border-b border-border pb-3">
                Status Badges
              </h2>

              <div className="flex flex-col gap-3">
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border border-border transition-colors ${
                    disabled ? "cursor-default" : "cursor-pointer hover:bg-surface-elevated"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={arGrade}
                    disabled={disabled}
                    onChange={(e) => setArGrade(e.target.checked)}
                    className="rounded border-border text-blue-600 bg-surface focus:ring-0"
                  />
                  <span className="text-sm text-foreground">AR Grade</span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border border-border transition-colors ${
                    disabled ? "cursor-default" : "cursor-pointer hover:bg-surface-elevated"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={inStock}
                    disabled={disabled}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="rounded border-border text-blue-600 bg-surface focus:ring-0"
                  />
                  <span className="text-sm text-foreground">In Stock</span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border border-border transition-colors ${
                    disabled ? "cursor-default" : "cursor-pointer hover:bg-surface-elevated"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={bestSeller}
                    disabled={disabled}
                    onChange={(e) => setBestSeller(e.target.checked)}
                    className="rounded border-border text-blue-600 bg-surface focus:ring-0"
                  />
                  <span className="text-sm text-foreground">Best Seller</span>
                </label>
              </div>
            </div>

            {/* Product Media */}
            <div className={cardClass}>
              <h2 className="text-sm font-bold uppercase text-foreground mb-5 border-b border-border pb-3">
                Product Media
              </h2>

              <div className="space-y-5">
                {disabled ? (
                  <div>
                    <label className={labelClass}>Main Image</label>
                    <div className="h-48 overflow-hidden rounded-xl border border-border bg-surface">
                      <img
                        src={singleImagePreview || DEFAULT_PRODUCT_IMAGE}
                        alt={name || "Product primary image"}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                        }}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                  </div>
                ) : (
                  <SimpleImageUpload
                    label="Main Image"
                    previewUrl={singleImagePreview || null}
                    onChange={handlePrimaryFileSelect}
                    onRemove={singleImagePreview ? handleRemovePrimaryImage : undefined}
                    accept={ALLOWED_PRODUCT_IMAGE_ACCEPT}
                    error={primaryImageError}
                    hint="Click or drag & drop main image (PNG, JPG, WEBP, max 10MB)"
                    className="h-44"
                  />
                )}

                <div>
                  <label className={labelClass}>Gallery Images</label>

                  {galleryItems.length > 0 && (
                    <div className="grid grid-cols-3 gap-2.5 mb-3">
                      {galleryItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="relative aspect-square rounded-xl overflow-hidden border border-border bg-surface"
                        >
                          <img
                            src={item.previewUrl}
                            alt={`Gallery image ${index + 1}`}
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                            }}
                            className="h-full w-full object-cover"
                          />
                          {!disabled && (
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(item.id)}
                              aria-label="Remove gallery image"
                              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {disabled ? (
                    galleryItems.length === 0 ? (
                      <p className="text-xs italic text-muted">No gallery images uploaded.</p>
                    ) : null
                  ) : (
                    <>
                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          setGalleryDragging(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setGalleryDragging(false);
                        }}
                        onDrop={handleGalleryDrop}
                        className={`flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed bg-surface-elevated px-4 text-center transition ${
                          galleryDragging
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        <ImagePlus size={18} className="text-muted" />
                        <span className="text-[11px] font-medium text-muted">
                          Click or drag & drop gallery images (Max 10MB each)
                        </span>
                        <input
                          type="file"
                          multiple
                          accept={ALLOWED_PRODUCT_IMAGE_ACCEPT}
                          onChange={handleGalleryImagesChange}
                          className="hidden"
                        />
                      </label>

                      {galleryImageError && (
                        <p className="mt-1.5 text-[11px] font-medium text-red-600 theme-dark:text-red-400">
                          {galleryImageError}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}