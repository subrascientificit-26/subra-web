"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { RequiredMark } from "@/components/ui/FieldLabel";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import AdminListLayout from "@/components/admin/AdminListLayout";
import AdminTableSection from "@/components/admin/AdminTableSection";
import AdminActionButtons from "@/components/admin/AdminActionButtons";
import { DescriptionCell, ImageCell } from "@/components/admin/DetailCells";
import SimpleImageUpload from "@/components/admin/SimpleImageUpload";
import type { TableColumn } from "react-data-table-component";
import {
  ADMIN_CARD_CLASS,
  ADMIN_EMPTY_BADGE_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_LABEL_CLASS,
  ADMIN_SECONDARY_BTN_CLASS,
  ADMIN_TEXTAREA_CLASS,
  withFieldError,
} from "@/lib/admin/formStyles";

// =========================
// VALIDATION SCHEMAS
// =========================
const categoryFormSchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(40, "Category name cannot exceed 40 characters")
    .trim(),
  description: z
    .string()
    .max(160, "Description cannot exceed 160 characters")
    .trim()
    .optional()
    .or(z.literal("")),
});

export default function CategoryPage() {
  const router = useRouter();

  // Core Data States
  const [categories, setCategories] = useState<any[]>([]);

  // Form States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // UI Flow States
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const { toasts, removeToast, showError, showSuccess } = useToast();
  const [success, setSuccess] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // =========================
  // DATA SYNC LOGIC
  // =========================
  const loadCategories = useCallback(async () => {
    try {
      setTableLoading(true);
      const res = await fetch("/api/category", { cache: "no-store" });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      showError("Failed to synchronize category engine registry.");
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // =========================
  // MUTATION HANDLERS
  // =========================
  const handleSave = async () => {
    setSuccess("");
    setFormErrors({});

    // Client-side Validation Execution
    const validation = categoryFormSchema.safeParse({ name, description });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      const flattenedErrors = validation.error.flatten().fieldErrors;

      Object.entries(flattenedErrors).forEach(([key, messages]) => {
        if (messages && messages[0]) {
          fieldErrors[key] = messages[0];
        }
      });

      setFormErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (editingId) formData.append("id", String(editingId));
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch("/api/category", {
        method: editingId ? "PUT" : "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok)
        throw new Error(data.error || "Failed to commit modifications.");

      setSuccess(
        editingId
          ? "Category updated successfully"
          : "Category created successfully",
      );
      showSuccess(
        editingId
          ? "Category updated successfully"
          : "Category created successfully",
      );
      resetForm();
      loadCategories();
    } catch (err: any) {
      showError(err.message || "An unexpected system anomaly occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const res = await fetch(`/api/category?id=${confirmDeleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok)
        throw new Error(data.error || "Database drop instruction failed.");

      setSuccess("Category dropped from root node successfully");
      showSuccess("Category dropped from root node successfully");
      setConfirmDeleteId(null);
      loadCategories();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // =========================
  // UTILITIES & WORKFLOWS
  // =========================
  const resetForm = () => {
    setName("");
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    setFormErrors({});
  };

  const populateEditForm = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description || "");
    setImageFile(null);
    setImagePreview(item.image || null);
    setFormErrors({});
  };

  const filteredCategories = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return categories;
    return categories.filter((cat) =>
      [cat.name, cat.description]
        .filter(Boolean)
        .some((val) => val.toString().toLowerCase().includes(query)),
    );
  }, [categories, search]);

  // =========================
  // DATATABLE CONFIGURATION
  // =========================
  const columns: TableColumn<any>[] = [
    {
      name: "Image",
      width: "80px",
      cell: (row) => <ImageCell src={row.image} alt={row.name} size="sm" />,
    },
    {
      name: "Category Name",
      grow: 2,
      sortable: true,
      selector: (row) => row.name,
      cell: (row) => (
        <div className="py-2">
          <div className="font-semibold text-foreground text-sm tracking-wide">
            {row.name}
          </div>
        </div>
      ),
    },
    {
      name: "Description",
      grow: 2,
      cell: (row) => <DescriptionCell text={row.description} />,
    },
    {
      name: "Subcategories",
      width: "140px",
      sortable: true,
      center: true,
      selector: (row) => row.subcategories?.length,
      cell: (row) => (
        <span
          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full font-mono ${
            row.subcategories?.length
              ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
              : ADMIN_EMPTY_BADGE_CLASS
          }`}
        >
          {row.subcategories?.length || 0}
        </span>
      ),
    },
    {
      name: "Products",
      width: "120px",
      sortable: true,
      center: true,
      selector: (row) => row.productCount ?? 0,
      cell: (row) => (
        <span
          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full font-mono ${
            row.productCount
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : ADMIN_EMPTY_BADGE_CLASS
          }`}
        >
          {row.productCount ?? 0}
        </span>
      ),
    },
    {
      name: "Actions",
      width: "140px",
      center: true,
      cell: (row) => (
        <AdminActionButtons
          onEdit={() => populateEditForm(row)}
          onDelete={() => setConfirmDeleteId(row.id)}
        />
      ),
    },
  ];

  return (
    <AdminListLayout>
      <h2 className="text-xl font-bold text-foreground mb-3">Category</h2>
      <div className="bg-background text-foreground p-4 lg:p-0 selection:bg-blue-500/30 antialiased">
        <div className="max-w-7xl mx-auto space-y-6">
          <ToastContainer toasts={toasts} onClose={removeToast} />

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
            <div className={`xl:col-span-1 ${ADMIN_CARD_CLASS} sticky top-6 space-y-5`}>
              <div className="space-y-4">
                <div>
                  <label className={ADMIN_LABEL_CLASS}>
                    Category Name
                    <RequiredMark />
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Industrial Hardware"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={withFieldError(ADMIN_INPUT_CLASS, Boolean(formErrors.name))}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1 font-medium">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <SimpleImageUpload
                    label="Category Image"
                    previewUrl={imagePreview}
                    onChange={(file) => {
                      setImageFile(file);
                      if (file) {
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    onRemove={
                      imagePreview
                        ? () => {
                            setImageFile(null);
                            setImagePreview(null);
                          }
                        : undefined
                    }
                    hint="Upload category image"
                  />
                </div>

                <div>
                  <label className={ADMIN_LABEL_CLASS}>
                    Category Summary
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the category..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={withFieldError(ADMIN_TEXTAREA_CLASS, Boolean(formErrors.description))}
                  />
                  {formErrors.description && (
                    <p className="text-[11px] text-red-400 mt-1.5 font-medium">
                      {formErrors.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm disabled:opacity-40 transition-all shadow-lg shadow-blue-600/10"
                  >
                    {loading
                      ? "Processing Payload..."
                      : editingId
                        ? "Update Category"
                        : "Create Category"}
                  </button>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className={`w-full h-11 ${ADMIN_SECONDARY_BTN_CLASS}`}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* MASTER METADATA DATAGRID PIPELINE */}
            <AdminTableSection
              columns={columns}
              data={filteredCategories}
              loading={tableLoading}
              search={{
                value: search,
                onChange: setSearch,
                placeholder: "Search categories...",
              }}
              noDataMessage="No categories found. Try adjusting your search criteria."
            />
          </div>
        </div>

        <ConfirmDialog
          open={confirmDeleteId !== null}
          title="Execute Destructive Drops"
          description="Proceeding will un-bind and sever downstream child subcategory records mapping links directly attached to this index context. Are you sure?"
          confirmLabel="Drop Element Pipeline"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      </div>
    </AdminListLayout>
  );
}
