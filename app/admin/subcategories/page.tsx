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
import { BadgeCell, DescriptionCell, ImageCell } from "@/components/admin/DetailCells";
import SimpleImageUpload from "@/components/admin/SimpleImageUpload";
import type { TableColumn } from "react-data-table-component";
import {
  ADMIN_CARD_CLASS,
  ADMIN_EMPTY_BADGE_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_LABEL_CLASS,
  ADMIN_SECONDARY_BTN_CLASS,
  ADMIN_SELECT_CLASS,
  ADMIN_TEXTAREA_CLASS,
  withFieldError,
} from "@/lib/admin/formStyles";

// =========================
// VALIDATION SCHEMAS
// =========================
const subcategoryFormSchema = z.object({
  categoryId: z.string().min(1, "Please select a subcategory"),
  name: z.string().min(2, "Subcategory name must be at least 2 characters").max(50),
  description: z.string().max(200, "Description cannot exceed 200 characters").optional(),
});

export default function SubCategoryPage() {
  const router = useRouter();

  // Core Data States
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Form States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
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
  const loadSubcategories = useCallback(async () => {
    try {
      setTableLoading(true);
      const res = await fetch("/api/subcategory", { cache: "no-store" });
      const data = await res.json();
      setSubcategories(Array.isArray(data) ? data : []);
    } catch {
      showError("Failed to sync subcategories matrix.");
    } finally {
      setTableLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/category");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      showError("Failed to sync subcategories.");
    }
  }, []);

  useEffect(() => {
    loadSubcategories();
    loadCategories();
  }, [loadSubcategories, loadCategories]);

  // =========================
  // MUTATION HANDLERS
  // =========================
  const handleSave = async () => {
    setSuccess("");
    setFormErrors({});

    // Client-side Validation Checks
    const validation = subcategoryFormSchema.safeParse({ categoryId, name, description });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      const flattenedErrors = validation.error.flatten().fieldErrors;

      // Map the errors type-safely into your form errors state
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
      formData.append("categoryId", categoryId);
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch("/api/subcategory", {
        method: editingId ? "PUT" : "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to commit modifications.");

      setSuccess(editingId ? "Subcategory updated successfully" : "Subcategory created successfully");
      resetForm();
      loadSubcategories();
    } catch (err: any) {
      showError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (confirmDeleteId === null) return;
    try {
      const res = await fetch(`/api/subcategory?id=${confirmDeleteId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Disposal failed.");

      setSuccess("Subcategory dropped successfully");
      showSuccess("Subcategory dropped successfully");
      setConfirmDeleteId(null);
      loadSubcategories();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // =========================
  // UTILITIES & STYLES
  // =========================
  const resetForm = () => {
    setName("");
    setDescription("");
    setCategoryId("");
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    setFormErrors({});
  };

  const populateEditForm = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description || "");
    setCategoryId(String(item.category?.id || ""));
    setImageFile(null);
    setImagePreview(item.image || null);
    setFormErrors({});
  };

  const filteredSubcategories = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return subcategories;
    return subcategories.filter((sub) =>
      [sub.name, sub.description, sub.category?.name]
        .filter(Boolean)
        .some((val) => val.toString().toLowerCase().includes(query))
    );
  }, [subcategories, search]);

  // =========================
  // UI DATATABLE SCHEMA
  // =========================
  const columns: TableColumn<any>[] = [
    {
      name: "Image",
      width: "80px",
      cell: (row) => <ImageCell src={row.image} alt={row.name} size="sm" />,
    },
    {
      name: "Subcategory Name",
      grow: 2,
      sortable: true,
      selector: (row) => row.name,
      cell: (row) => (
        <div className="py-2">
          <div className="font-semibold text-foreground text-sm">{row.name}</div>
        </div>
      ),
    },
    {
      name: "Category Name",
      sortable: true,
      selector: (row) => row.category?.name,
      cell: (row) => (
        <BadgeCell label={row.category?.name || "Unassigned"} tone="blue" />
      ),
    },
    {
      name: "Description",
      grow: 2,
      cell: (row) => <DescriptionCell text={row.description} />,
    },
    {
      name: "Products",
      width: "120px",
      sortable: true,
      center: true,
      selector: (row) => row._count?.products ?? 0,
      cell: (row) => (
        <span
          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full font-mono ${
            row._count?.products
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : ADMIN_EMPTY_BADGE_CLASS
          }`}
        >
          {row._count?.products ?? 0}
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
      
      <h2 className="text-xl font-bold text-foreground mb-3">Subcategory</h2>
    <div className="bg-background text-foreground p-4 lg:p-0 selection:bg-blue-500/30">
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
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={withFieldError(ADMIN_SELECT_CLASS, Boolean(formErrors.categoryId))}>
                  <option value="">Choose active node...</option>
                  {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                {formErrors.categoryId && <p className="text-[11px] text-red-400 mt-1">{formErrors.categoryId}</p>}
              </div>

              <div>
                <label className={ADMIN_LABEL_CLASS}>
                  Subcategory Name
                  <RequiredMark />
                </label>
                <input value={name} placeholder="e.g., Aliphatic Hydrocarbons" onChange={(e) => setName(e.target.value)} className={withFieldError(ADMIN_INPUT_CLASS, Boolean(formErrors.name))} />
                {formErrors.name && <p className="text-[11px] text-red-400 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <SimpleImageUpload
                  label="Subcategory Image"
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
                  hint="Upload subcategory image"
                />
              </div>

              <div>
                <label className={ADMIN_LABEL_CLASS}>Subcategory Summary</label>
                <textarea rows={2} value={description} placeholder="Describe the subcategory..." onChange={(e) => setDescription(e.target.value)} className={withFieldError(ADMIN_TEXTAREA_CLASS, Boolean(formErrors.description))} />
                {formErrors.description && <p className="text-[11px] text-red-400 mt-1">{formErrors.description}</p>}
              </div>

              <div className="flex gap-2">
                <button onClick={handleSave} disabled={loading} className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm disabled:opacity-40 transition-all shadow-lg shadow-blue-600/10">
                  {loading ? "Processing..." : editingId ? "Update Subcategory" : "Create Subcategory"}
                </button>
                {editingId && (
                  <button onClick={resetForm} className={`h-11 px-4 ${ADMIN_SECONDARY_BTN_CLASS}`}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MASTER REGISTRY CONTROL */}
          <AdminTableSection
            columns={columns}
            data={filteredSubcategories}
            loading={tableLoading}
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Search subcategories...",
            }}
            noDataMessage="No matching subcategory nodes detected."
          />

        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Confirm Pipeline Deletion"
        description="Proceeding will break operational dependencies bound to this subcategory mapping link. Are you sure?"
        confirmLabel="Drop Mapping"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
    </AdminListLayout>
  );
}