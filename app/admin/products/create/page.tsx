"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  FileText,
  X,
} from "lucide-react";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import { RequiredMark } from "@/components/ui/FieldLabel";
import {
  getGalleryImagesFromList,
  getPrimaryImageFromList,
} from "@/lib/productImageUtils";
import { resolveProductImageUrl } from "@/lib/productImageUrl";
import { normalizeDocumentType } from "@/lib/productDocumentTypes";
import {
  ADMIN_FORM_CARD_CLASS,
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_FORM_TEXTAREA_CLASS,
  ADMIN_LABEL_CLASS,
  ADMIN_SECONDARY_BTN_CLASS,
} from "@/lib/admin/formStyles";

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
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toasts, removeToast, showError, showSuccess } = useToast();

  // Core Product Payload Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [applications, setApplications] = useState("");
  const [safetyInfo, setSafetyInfo] = useState("");
  const [casNumber, setCasNumber] = useState("");
  const [molecularFormula, setMolecularFormula] = useState("");
  const [molecularWeight, setMolecularWeight] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [specifications, setSpecifications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  // Isolated State Architecture for Assets
  const [singleImageFile, setSingleImageFile] = useState<File | null>(null);
  const [singleImagePreview, setSingleImagePreview] = useState<string>("");
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  const [imagesFiles, setImagesFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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

  // Type-robust subcategory filtering matching both String and Number formats
  const filteredSubcategories = categoryId
    ? subcategories.filter(
        (item: any) => String(item.categoryId) === String(categoryId),
      )
    : subcategories;

  useEffect(() => {
    loadInitialData();
  }, [id, isEdit, isView]);

  useEffect(() => {
    return () => {
      if (singleImagePreview && singleImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(singleImagePreview);
      }
      imagePreviews.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setPageLoading(true);

      if (isCreate) {
        setName("");
        setDescription("");
        setShortDescription("");
        setApplications("");
        setSafetyInfo("");
        setCasNumber("");
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
        setExistingGalleryUrls([]);
        setImagesFiles([]);
        setImagePreviews([]);
        setPackSize("");
        setQuantity("");
        setUnits("");
        setArGrade(false);
        setInStock(true);
        setBestSeller(false);
      }

      const [catRes, subRes] = await Promise.all([
        fetch("/api/category", { cache: "force-cache" }),
        fetch("/api/subcategory", { cache: "force-cache" }),
      ]);

      if (catRes.ok) setCategories(await catRes.json());
      if (subRes.ok) setSubcategories(await subRes.json());

      if ((isEdit || isView) && id) {
        const productRes = await fetch(`/api/products/${id}`, {
          cache: "no-store",
        });
        const product = await productRes.json();

        if (!productRes.ok) {
          showError(product.error || "Failed to load product");
          return;
        }

        if (product) {
          setName(product.name || "");
          setDescription(product.description || "");
          setShortDescription(product.shortDescription || "");
          setApplications(product.applications || "");
          setSafetyInfo(product.safetyInfo || "");
          setCasNumber(product.casNumber || "");
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
        
        console.log("DB image:", primaryImage?.imageUrl);
        console.log("Resolved URL:", resolvedUrl);
        console.log(product.images);
        setSingleImagePreview(resolvedUrl);
          setExistingGalleryUrls(
            galleryImages
              .map((img) =>
                img.imageUrl ? resolveProductImageUrl(img.imageUrl) : ""
              )
              .filter(Boolean)
          );
          setImagePreviews(
            galleryImages
              .map((img) =>
                img.imageUrl ? resolveProductImageUrl(img.imageUrl) : ""
              )
              .filter(Boolean)
          );
          setImagesFiles([]);
          setSingleImageFile(null);

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
      showError("Failed to load configuration configurations");
    } finally {
      setPageLoading(false);
    }
  };

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

    if (!casNumber.trim()) {
      showError("CAS Number required.");
      return false;
    }

    const casRegex = /^\d{2,7}-\d{2}-\d$/;
    if (!casRegex.test(casNumber.trim())) {
      showError("CAS Number format should be like 67-64-1");
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

    const maxFileSize = 5 * 1024 * 1024;

    if (singleImageFile && singleImageFile.size > maxFileSize) {
      showError("Primary image must be less than 5MB.");
      return false;
    }

    const invalidGallery = imagesFiles.some((file) => file.size > maxFileSize);
    if (invalidGallery) {
      showError("Gallery image size must be less than 5MB.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("shortDescription", shortDescription);
      formData.append("applications", applications);
      formData.append("safetyInfo", safetyInfo);
      formData.append("casNumber", casNumber);
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

      if (singleImageFile) {
        formData.append("primaryImage", singleImageFile);
      }
      imagesFiles.forEach((file) => {
        formData.append("galleryImages", file);
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

      showSuccess(isCreate ? "Product created successfully" : "Product updated successfully");
      setTimeout(() => router.push("/admin/products"), 1500);
    } catch (err: any) {
      showError(err.message || "Execution error encountered");
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
  const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (singleImagePreview && singleImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(singleImagePreview);
      }
      setSingleImageFile(file);
      setSingleImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePrimaryImage = () => {
    if (singleImagePreview && singleImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(singleImagePreview);
    }
    setSingleImageFile(null);
    setSingleImagePreview("");
  };

  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImagesFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    const previewUrl = imagePreviews[indexToRemove];
    const existingCount = existingGalleryUrls.length;

    if (indexToRemove < existingCount) {
      setExistingGalleryUrls((prev) => prev.filter((_, i) => i !== indexToRemove));
    } else {
      const fileIndex = indexToRemove - existingCount;
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setImagesFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }

    setImagePreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const cardClass = `${ADMIN_FORM_CARD_CLASS} hover:border-border`;
  const labelClass = ADMIN_LABEL_CLASS;
  const inputClass = ADMIN_FORM_INPUT_CLASS;
  const textareaClass = ADMIN_FORM_TEXTAREA_CLASS;

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-blue-500/30">
      <header className="backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/products"
              className="h-10 w-10 rounded-lg bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-primary transition-all"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">
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
              className="h-11 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-sm font-semibold tracking-wide text-white flex items-center gap-2 shadow-lg shadow-blue-600/10 transition-all active:scale-[0.98]"
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

      <main className="max-w-7xl mx-auto px-6 py-6">
        <ToastContainer toasts={toasts} onClose={removeToast} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-2 space-y-6">
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
                      onChange={(e) => setCasNumber(e.target.value)}
                      className={inputClass}
                      placeholder="67-64-1"
                    />
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
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-surface border-b border-border text-muted font-medium">
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
                                className="text-muted hover:text-red-400 p-1 transition-colors"
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
                    <div className="relative">
                      <input
                        type="file"
                        onChange={(e) => setNewDocFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`${inputClass} flex items-center text-muted truncate pr-4`}>
                        {newDocFile ? newDocFile.name : "Choose File..."}
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
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface text-sm hover:border-primary transition-colors"
                    >
                      <div className="flex items-center gap-3 truncate min-w-0">
                        <FileText className="text-blue-500 flex-shrink-0" size={18} />
                        <div className="truncate">
                          <p className="font-medium text-foreground truncate">{doc.label}</p>
                          <p className="text-xs text-muted truncate">{doc.name || "Remote File Layout Entity"}</p>
                        </div>
                      </div>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-muted hover:text-red-400 p-2 transition-colors ml-4"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="space-y-6 lg:sticky lg:top-24 self-start">
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
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Sub Category
                    <RequiredMark />
                  </label>
                  <select
                    disabled={disabled}
                    value={subCategoryId}
                    onChange={(e) => setSubCategoryId(e.target.value)}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="">Select Sub Category</option>
                    {filteredSubcategories.map((item: any) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

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
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-surface-elevated transition-colors">
                  <input
                    type="checkbox"
                    checked={arGrade}
                    disabled={disabled}
                    onChange={(e) => setArGrade(e.target.checked)}
                    className="rounded border-border text-blue-600 bg-surface focus:ring-0"
                  />
                  <span className="text-sm text-foreground">AR Grade</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-surface-elevated transition-colors">
                  <input
                    type="checkbox"
                    checked={inStock}
                    disabled={disabled}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="rounded border-border text-blue-600 bg-surface focus:ring-0"
                  />
                  <span className="text-sm text-foreground">In Stock</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-surface-elevated transition-colors">
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

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Main Image</label>

                  {singleImagePreview && (
                    <div className="relative mb-3 h-48 overflow-hidden rounded-lg border border-border group">
                      <img
                        src={singleImagePreview}
                        alt="Product Primary layout representation"
                        className="h-full w-full object-cover"
                      />
                      {!disabled && (
                        <button
                          type="button"
                          onClick={handleRemovePrimaryImage}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-surface border border-border text-muted hover:text-red-400 hover:border-red-500/30 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  )}

                  {!disabled && (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePrimaryImageChange}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                      <div className={`${inputClass} flex items-center text-muted`}>
                        {singleImageFile ? singleImageFile.name : "Choose main image..."}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Gallery Images</label>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {imagePreviews.map((img, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden border border-border group"
                        >
                          <img
                            src={img}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          {!disabled && (
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(index)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-surface border border-border text-muted hover:text-red-400 hover:border-red-500/30 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!disabled && (
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleGalleryImagesChange}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                      <div className={`${inputClass} flex items-center text-muted`}>
                        {imagesFiles.length > 0
                          ? `${imagesFiles.length} new gallery image(s) selected`
                          : "Choose gallery images..."}
                      </div>
                    </div>
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