"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileSpreadsheet, Plus, Upload, X } from "lucide-react";
import type { TableColumn } from "react-data-table-component";

import ConfirmDialog from "@/components/ConfirmDialog";
import ImportResultsModal, {
  type ImportResultRow,
} from "@/components/admin/ImportResultsModal";
import SampleExcelModal, {
  type SampleExcelSheet,
} from "@/components/admin/SampleExcelModal";
import AdminListLayout from "@/components/admin/AdminListLayout";
import AdminTableSection from "@/components/admin/AdminTableSection";
import AdminActionButtons from "@/components/admin/AdminActionButtons";
import { BadgeCell } from "@/components/admin/DetailCells";
import { ToastContainer } from "@/components/Toast";
import { RequiredMark } from "@/components/ui/FieldLabel";
import { useToast } from "@/lib/useToast";
import { useLiveUpdates } from "@/lib/hooks/useLiveUpdates";
import {
  ADMIN_INPUT_CLASS,
  ADMIN_LABEL_CLASS,
  ADMIN_TOOLBAR_BTN_CLASS,
  ADMIN_TOOLBAR_SELECT_CLASS,
} from "@/lib/admin/formStyles";
import {
  EXTERNAL_PRODUCT_TEMPLATE_PATH,
  formatExternalRate,
  validateExternalProductInput,
  type ExternalProductRecord,
} from "@/lib/externalProducts";

interface FormState {
  productCode: string;
  productName: string;
  casNo: string;
  type: string;
  brand: string;
  pack: string;
  hsn: string;
  gstPercent: string;
  sellingRate: string;
  units: string;
}

const EMPTY_FORM: FormState = {
  productCode: "",
  productName: "",
  casNo: "",
  type: "",
  brand: "",
  pack: "",
  hsn: "",
  gstPercent: "18",
  sellingRate: "",
  units: "",
};

export default function AdminExternalProductsPage() {
  const [products, setProducts] = useState<ExternalProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, removeToast, showError, showSuccess } = useToast();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<ExternalProductRecord | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExternalProductRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    summary: string | null;
    rows: ImportResultRow[];
    errors: string[];
  } | null>(null);

  const [samplePreviewOpen, setSamplePreviewOpen] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const [sampleSheets, setSampleSheets] = useState<SampleExcelSheet[]>([]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/external-products", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Failed to load external products");
        return;
      }

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to load external products"
      );
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const res = await fetch("/api/external-products", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (!active) return;

        if (!res.ok) {
          showError(data.error || "Failed to load external products");
          return;
        }

        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!active) return;
        showError(
          err instanceof Error ? err.message : "Failed to load external products"
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, [showError]);

  useLiveUpdates(["external-products"], () => {
    void loadProducts();
  });

  const types = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.type).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [products]
  );

  const brands = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [products]
  );

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return products.filter((item) => {
      if (selectedType && item.type !== selectedType) return false;
      if (selectedBrand && item.brand !== selectedBrand) return false;
      if (!query) return true;

      return [
        item.productCode,
        item.productName,
        item.casNo,
        item.type,
        item.brand,
        item.pack,
        item.hsn,
        item.units,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(query));
    });
  }, [products, search, selectedType, selectedBrand]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setFormErrors([]);
    setFormOpen(true);
  };

  const openEditModal = (item: ExternalProductRecord) => {
    setEditingItem(item);
    setForm({
      productCode: item.productCode,
      productName: item.productName,
      casNo: item.casNo ?? "",
      type: item.type,
      brand: item.brand,
      pack: item.pack,
      hsn: item.hsn,
      gstPercent: String(item.gstPercent),
      sellingRate: item.sellingRate !== null && item.sellingRate !== undefined ? String(item.sellingRate) : "",
      units: item.units,
    });
    setFormErrors([]);
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateExternalProductInput(form);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors([]);
    setSaving(true);
    try {
      const isEdit = editingItem !== null;
      const res = await fetch("/api/external-products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          isEdit ? { id: editingItem.id, ...validation.data } : validation.data
        ),
      });

      const data = await res.json();
      if (!res.ok) {
        const errs = Array.isArray(data.errors)
          ? data.errors
          : [data.error || "Failed to save external product"];
        setFormErrors(errs);
        showError(data.error || "Failed to save external product");
        return;
      }

      showSuccess(
        isEdit
          ? "External product updated successfully."
          : "External product created successfully."
      );
      setFormOpen(false);
      setEditingItem(null);
      setForm(EMPTY_FORM);
      await loadProducts();
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to save external product"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const res = await fetch(`/api/external-products?id=${confirmDeleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Failed to delete external product");
        return;
      }

      showSuccess("External product deleted successfully.");
      setProducts((prev) => prev.filter((item) => item.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to delete external product"
      );
    }
  };

  const handleOpenSamplePreview = async () => {
    setSamplePreviewOpen(true);

    if (sampleSheets.length > 0 && !sampleError) {
      return;
    }

    setSampleLoading(true);
    setSampleError(null);

    try {
      const response = await fetch(EXTERNAL_PRODUCT_TEMPLATE_PATH, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Could not load sample Excel file.");
      }

      const arrayBuffer = await response.arrayBuffer();
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      const parsedSheets: SampleExcelSheet[] = workbook.SheetNames.map(
        (sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
            header: 1,
            defval: "",
          });

          const nonEmptyRows = matrix.filter(
            (row) =>
              Array.isArray(row) &&
              row.some((cell) => String(cell ?? "").trim() !== "")
          );

          const headerRow = (nonEmptyRows[0] ?? []).map((cell) =>
            String(cell ?? "").trim()
          );
          const bodyRows = nonEmptyRows
            .slice(1)
            .map((row) =>
              headerRow.map((_, colIdx) => String(row[colIdx] ?? ""))
            );

          return {
            name: sheetName,
            headers: headerRow,
            rows: bodyRows,
          };
        }
      ).filter((sheet) => sheet.headers.length > 0);

      if (parsedSheets.length === 0) {
        throw new Error("Sample Excel template has no readable columns.");
      }

      setSampleSheets(parsedSheets);
    } catch (err) {
      setSampleError(
        err instanceof Error
          ? err.message
          : "Failed to load sample Excel preview."
      );
    } finally {
      setSampleLoading(false);
    }
  };

  const handleExcelImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/external-products/import", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      const rowResults: ImportResultRow[] = Array.isArray(data.rowResults)
        ? data.rowResults
        : [];

      if (!res.ok) {
        const errors = Array.isArray(data.errors)
          ? data.errors
          : data.error
            ? [data.error]
            : ["Failed to import external products"];

        setImportResult({
          summary:
            data.error ||
            "Import failed. Please fix the issues below and try again.",
          rows: rowResults,
          errors,
        });
        showError(data.error || "Failed to import external products");
        return;
      }

      const summary =
        data.message ||
        (data.imported > 0
          ? `Imported ${data.imported} external product(s) successfully.`
          : "Import completed.");

      const errors =
        rowResults.length === 0 && Array.isArray(data.errors)
          ? data.errors
          : [];

      setImportResult({
        summary,
        rows: rowResults,
        errors,
      });

      if ((data.imported ?? 0) > 0) {
        showSuccess(summary);
        await loadProducts();
      } else if ((data.unchanged ?? 0) > 0) {
        showSuccess(summary);
      } else if (rowResults.length === 0 && errors.length === 0) {
        showError("No external products were imported. Please check your Excel file.");
      } else {
        showError("Import finished with issues — see the details.");
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Could not import Excel file"
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const dtColumns: TableColumn<ExternalProductRecord>[] = [
    {
      name: "Product Code",
      selector: (row) => row.productCode,
      sortable: true,
      grow: 1,
      minWidth: "120px",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {row.productCode}
        </span>
      ),
    },
    {
      name: "Product Name",
      selector: (row) => row.productName,
      sortable: true,
      wrap: true,
      grow: 1.4,
      minWidth: "160px",
      cell: (row) => (
        <div className="py-2 font-semibold text-foreground text-sm">
          {row.productName}
        </div>
      ),
    },
    {
      name: "CAS No.",
      selector: (row) => row.casNo || "",
      sortable: true,
      grow: 0.9,
      minWidth: "110px",
      center: true,
      cell: (row) => (
        <span className="font-mono text-xs text-muted">
          {row.casNo || "—"}
        </span>
      ),
    },
    {
      name: "Type",
      selector: (row) => row.type,
      sortable: true,
      grow: 0.9,
      minWidth: "110px",
      center: true,
      cell: (row) => <BadgeCell label={row.type} tone="blue" />,
    },
    {
      name: "Brand",
      selector: (row) => row.brand,
      sortable: true,
      grow: 0.9,
      minWidth: "110px",
      center: true,
      cell: (row) => <BadgeCell label={row.brand} tone="indigo" />,
    },
    {
      name: "Pack",
      selector: (row) => row.pack,
      sortable: true,
      grow: 0.8,
      minWidth: "95px",
      center: true,
      cell: (row) => <span className="text-xs text-foreground">{row.pack}</span>,
    },
    {
      name: "HSN",
      selector: (row) => row.hsn,
      sortable: true,
      grow: 0.8,
      minWidth: "100px",
      center: true,
      cell: (row) => <span className="font-mono text-xs text-muted">{row.hsn}</span>,
    },
    {
      name: "GST%",
      selector: (row) => row.gstPercent,
      sortable: true,
      grow: 0.7,
      minWidth: "80px",
      center: true,
      cell: (row) => (
        <span className="text-xs font-semibold text-foreground">
          {row.gstPercent}%
        </span>
      ),
    },
    {
      name: "Selling Rate",
      selector: (row) => row.sellingRate ?? -1,
      sortable: true,
      grow: 1,
      minWidth: "120px",
      center: true,
      cell: (row) => (
        <span className="font-mono font-bold text-emerald-600 theme-dark:text-emerald-400 text-xs sm:text-sm">
          {formatExternalRate(row.sellingRate)}
        </span>
      ),
    },
    {
      name: "Units",
      selector: (row) => row.units,
      sortable: true,
      grow: 0.7,
      minWidth: "85px",
      center: true,
      cell: (row) => <span className="text-xs text-muted">{row.units}</span>,
    },
    {
      name: "Actions",
      grow: 1,
      minWidth: "130px",
      center: true,
      cell: (row) => (
        <AdminActionButtons
          onView={() => setViewItem(row)}
          onEdit={() => openEditModal(row)}
          onDelete={() => setConfirmDeleteId(row.id)}
        />
      ),
    },
  ];

  return (
    <AdminListLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-foreground">External Products</h2>
        <span className="text-xs text-muted">
          Separate external price-list catalog (visible to logged-in users)
        </span>
      </div>

      <AdminTableSection
        columns={dtColumns}
        data={filtered}
        loading={loading}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search code, name, CAS, brand, HSN...",
        }}
        toolbar={
          <>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={`w-full sm:w-40 ${ADMIN_TOOLBAR_SELECT_CLASS}`}
            >
              <option value="">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className={`w-full sm:w-40 ${ADMIN_TOOLBAR_SELECT_CLASS}`}
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-10 items-center gap-1.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white whitespace-nowrap text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus size={14} />
              Add External Product
            </button>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleOpenSamplePreview}
                className={ADMIN_TOOLBAR_BTN_CLASS}
              >
                <FileSpreadsheet size={14} />
                Sample Excel
              </button>

              <label className={ADMIN_TOOLBAR_BTN_CLASS}>
                <Upload size={14} />
                {importing ? "Importing..." : "Import Excel"}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleExcelImport}
                  disabled={importing}
                />
              </label>
            </div>
          </>
        }
        noDataMessage="No external products found. Import an Excel price list or add one manually."
      />

      {/* CREATE / EDIT MODAL */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-lg font-bold text-foreground">
                {editingItem ? "Edit External Product" : "Add External Product"}
              </h3>
              <button
                type="button"
                onClick={() => !saving && setFormOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-elevated hover:text-foreground"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 p-6">
              {formErrors.length > 0 && (
                <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-xs text-red-600 theme-dark:text-red-400">
                  <ul className="list-disc pl-4 space-y-1">
                    {formErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={ADMIN_LABEL_CLASS}>
                    Product Code <RequiredMark />
                  </label>
                  <input
                    type="text"
                    required
                    value={form.productCode}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, productCode: e.target.value }))
                    }
                    placeholder="e.g. EXT-1001"
                    className={ADMIN_INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={ADMIN_LABEL_CLASS}>
                    Product Name <RequiredMark />
                  </label>
                  <input
                    type="text"
                    required
                    value={form.productName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, productName: e.target.value }))
                    }
                    placeholder="e.g. Acetone AR Grade"
                    className={ADMIN_INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={ADMIN_LABEL_CLASS}>CAS No. (Optional)</label>
                  <input
                    type="text"
                    value={form.casNo}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, casNo: e.target.value }))
                    }
                    placeholder="e.g. 67-64-1"
                    className={ADMIN_INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={ADMIN_LABEL_CLASS}>
                    Type <RequiredMark />
                  </label>
                  <input
                    type="text"
                    required
                    value={form.type}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, type: e.target.value }))
                    }
                    placeholder="e.g. Solvent / Reagent / Glassware"
                    className={ADMIN_INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={ADMIN_LABEL_CLASS}>
                    Brand <RequiredMark />
                  </label>
                  <input
                    type="text"
                    required
                    value={form.brand}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, brand: e.target.value }))
                    }
                    placeholder="e.g. Merck / SRL / Borosil"
                    className={ADMIN_INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={ADMIN_LABEL_CLASS}>
                    Pack <RequiredMark />
                  </label>
                  <input
                    type="text"
                    required
                    value={form.pack}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, pack: e.target.value }))
                    }
                    placeholder="e.g. 2.5 L / 500 g"
                    className={ADMIN_INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={ADMIN_LABEL_CLASS}>
                    HSN <RequiredMark />
                  </label>
                  <input
                    type="text"
                    required
                    value={form.hsn}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, hsn: e.target.value }))
                    }
                    placeholder="e.g. 29141100"
                    className={ADMIN_INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={ADMIN_LABEL_CLASS}>
                    GST% <RequiredMark />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={form.gstPercent}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, gstPercent: e.target.value }))
                    }
                    placeholder="e.g. 18"
                    className={ADMIN_INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={ADMIN_LABEL_CLASS}>
                    Selling Rate (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.sellingRate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, sellingRate: e.target.value }))
                    }
                    placeholder="Leave blank for Request Quote"
                    className={ADMIN_INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={ADMIN_LABEL_CLASS}>
                    Units <RequiredMark />
                  </label>
                  <input
                    type="text"
                    required
                    value={form.units}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, units: e.target.value }))
                    }
                    placeholder="e.g. Bottle / Jar / Nos"
                    className={ADMIN_INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-elevated transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingItem
                      ? "Update Product"
                      : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL (READ-ONLY) */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <p className="font-mono text-xs font-semibold text-primary">
                  {viewItem.productCode}
                </p>
                <h3 className="text-lg font-bold text-foreground">
                  {viewItem.productName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-elevated hover:text-foreground"
                aria-label="Close view modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {[
                      ["Product Code", viewItem.productCode],
                      ["Product Name", viewItem.productName],
                      ["CAS No.", viewItem.casNo || "—"],
                      ["Type", viewItem.type],
                      ["Brand", viewItem.brand],
                      ["Pack", viewItem.pack],
                      ["HSN", viewItem.hsn],
                      ["GST%", `${viewItem.gstPercent}%`],
                      ["Selling Rate", formatExternalRate(viewItem.sellingRate)],
                      ["Units", viewItem.units],
                    ].map(([label, val]) => (
                      <tr
                        key={label}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="w-2/5 border-r border-border bg-surface-elevated/50 px-4 py-2.5 text-xs font-medium text-muted">
                          {label}
                        </td>
                        <td className="px-4 py-2.5 text-sm font-medium text-foreground break-words">
                          {val}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewItem(null)}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete External Product"
        description="Are you sure you want to delete this external product? It will be removed from both the admin catalog and the logged-in user listing."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <ImportResultsModal
        open={importResult !== null}
        summary={importResult?.summary}
        rows={importResult?.rows ?? []}
        errors={importResult?.errors ?? []}
        onClose={() => setImportResult(null)}
      />

      <SampleExcelModal
        open={samplePreviewOpen}
        loading={sampleLoading}
        error={sampleError}
        sheets={sampleSheets}
        downloadHref={EXTERNAL_PRODUCT_TEMPLATE_PATH}
        downloadFileName="external-product-import-template.xlsx"
        onClose={() => setSamplePreviewOpen(false)}
      />
    </AdminListLayout>
  );
}

