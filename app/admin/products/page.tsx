"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, Upload } from "lucide-react";

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
import { BadgeCell, ImageCell } from "@/components/admin/DetailCells";
import type { TableColumn } from "react-data-table-component";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import { useLiveUpdates } from "@/lib/hooks/useLiveUpdates";
import { ROUTES } from "@/lib/routes";
import { ADMIN_TOOLBAR_BTN_CLASS, ADMIN_TOOLBAR_SELECT_CLASS } from "@/lib/admin/formStyles";

export default function ProductsPage() {
  // Core API Operational States
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, removeToast, showError, showSuccess } = useToast();
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  // Active Filter Vectors
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
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

  // FETCH CONTROLLER
  const loadProducts = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const res = await fetch("/api/products", {
        cache: "no-store", // Always pull fresh data for administration contexts
      });
      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Failed to sync product registry schema");
        return;
      }

      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showError(err.message || "Execution error during network sync cascade");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data)) setProducts(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        showError(
          err instanceof Error
            ? err.message
            : "Execution error during network sync cascade"
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showError]);

  useLiveUpdates(["products", "categories", "subcategories"], () => {
    void loadProducts(false);
  });

  // STATE-DRIVEN SYSTEM TRANSFORMERS (Deduplication validation mappings)
  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products.map((p: any) => p.subCategory?.category?.name).filter(Boolean),
      ),
    );
  }, [products]);

  const subcategories = useMemo(() => {
    // If a category is selected, scope the subcategories dropdown options down dynamically
    const baseProducts = selectedCategory 
      ? products.filter((p: any) => p.subCategory?.category?.name === selectedCategory)
      : products;

    return Array.from(
      new Set(baseProducts.map((p: any) => p.subCategory?.name).filter(Boolean)),
    );
  }, [products, selectedCategory]);

  // DELETION OPERATIONS
  const handleDelete = (id: number) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;

    try {
      setSuccess("");
      const res = await fetch(`/api/products?id=${confirmDeleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Pipeline request dropped by host wrapper");
        return;
      }

      showSuccess("Target inventory item securely cleared to archive");
      setProducts((prev) => prev.filter((item) => item.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    } catch (err: any) {
      showError(err.message || "Server stack handling mutation crash");
    }
  };

  // ROUTING SLOTS (handled via prefetched Link elements)

  const handleOpenSamplePreview = async () => {
    setSamplePreviewOpen(true);

    if (sampleSheets.length > 0 && !sampleError) {
      return;
    }

    setSampleLoading(true);
    setSampleError(null);

    try {
      const response = await fetch("/templates/product-import-template.xlsx", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load sample Excel file.");
      }

      const arrayBuffer = await response.arrayBuffer();
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      const parsedSheets: SampleExcelSheet[] = workbook.SheetNames.map((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
          header: 1,
          defval: "",
        });

        const nonEmptyRows = matrix.filter(
          (row) => Array.isArray(row) && row.some((cell) => String(cell ?? "").trim() !== "")
        );

        const headerRow = (nonEmptyRows[0] ?? []).map((cell) =>
          String(cell ?? "").trim()
        );
        const bodyRows = nonEmptyRows.slice(1).map((row) =>
          headerRow.map((_, colIdx) => String(row[colIdx] ?? ""))
        );

        return {
          name: sheetName,
          headers: headerRow,
          rows: bodyRows,
        };
      }).filter((sheet) => sheet.headers.length > 0);

      if (parsedSheets.length === 0) {
        throw new Error("Sample Excel template has no readable columns.");
      }

      setSampleSheets(parsedSheets);
    } catch (err) {
      setSampleError(
        err instanceof Error ? err.message : "Failed to load sample Excel preview."
      );
    } finally {
      setSampleLoading(false);
    }
  };

  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      const rowResults: ImportResultRow[] = Array.isArray(data.rowResults)
        ? data.rowResults
        : [];

      if (!res.ok) {
        // Missing-columns / all-failed responses carry only error strings.
        const errors = Array.isArray(data.errors)
          ? data.errors
          : data.error
            ? [data.error]
            : ["Failed to import products"];

        setImportResult({
          summary: data.error || "Import failed. Please fix the issues below and try again.",
          rows: rowResults,
          errors,
        });
        showError(data.error || "Failed to import products");
        return;
      }

      const summary =
        data.message ||
        (data.imported > 0
          ? `Imported ${data.imported} product(s) successfully.`
          : "Import completed.");

      // Validation failures are included inline in rowResults, but also surfaced
      // as top-level errors only when nothing else was imported.
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
        await loadProducts(false);
      } else if ((data.unchanged ?? 0) > 0) {
        showSuccess(summary);
      } else if (rowResults.length === 0 && errors.length === 0) {
        showError("No products were imported. Please check your Excel file.");
      } else {
        showError("Import finished with issues — see the details.");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not import Excel file");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  // RUNTIME COMPUTATIONAL SEARCH BLOCK
  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();

    return products.filter((product) => {
      // 1. Direct Constraints Enforcements
      if (
        selectedCategory &&
        product.subCategory?.category?.name !== selectedCategory
      )
        return false;
      if (
        selectedSubcategory &&
        product.subCategory?.name !== selectedSubcategory
      )
        return false;

      const parsedStock = Number(product.stock) || 0;
      if (stockFilter === "in" && parsedStock <= 0) return false;
      if (stockFilter === "out" && parsedStock > 0) return false;

      // 2. Query Fallback Parsing
      if (!query) return true;
      return [
        product.id?.toString(),
        product.name,
        product.shortDescription,
        product.subCategory?.name,
        product.subCategory?.category?.name,
        product.casNumber,
      ]
        .filter(Boolean)
        .some((val) => val.toString().toLowerCase().includes(query));
    });
  }, [products, search, selectedCategory, selectedSubcategory, stockFilter]);

  // DATA RE-ARCHITECTED DATA TABLE COLUMNS
  const dtColumns: TableColumn<any>[] = [
    {
      name: "Image",
      grow: 1,
      minWidth: "100px",
      center: true,
      cell: (row) => (
        <ImageCell
          src={
            row.images?.find((img: { isPrimary?: boolean }) => img.isPrimary)
              ?.imageUrl ?? row.images?.[0]?.imageUrl
          }
          alt={row.name}
          size="sm"
        />
      ),
    },
    {
      name: "Product Name",
      selector: (row: any) => row.name,
      sortable: true,
      wrap: true,
      grow: 1,
      minWidth: "145px",
      cell: (row: any) => (
        <div className="py-2">
          <div className="font-semibold text-foreground text-sm tracking-tight">
            {row.name || "Unnamed product"}
          </div>
        </div>
      ),
    },
    {
      name: "Category",
      selector: (row: any) => row.subCategory?.category?.name || "",
      sortable: true,
      grow: 1,
      minWidth: "120px",
      center: true,
      cell: (row: any) => (
        <BadgeCell
          label={row.subCategory?.category?.name || "Unclassified"}
          tone="blue"
        />
      ),
    },
    {
      name: "Subcategory",
      selector: (row: any) => row.subCategory?.name || "",
      sortable: true,
      grow: 1,
      minWidth: "140px",
      center: true,
      cell: (row: any) => (
        <BadgeCell
          label={row.subCategory?.name || "Base Segment"}
          tone="indigo"
        />
      ),
    },
    {
      name: "Unit Price",
      selector: (row: any) => Number(row.price) || 0,
      sortable: true,
      grow: 1,
      minWidth: "120px",
      center: true,
      cell: (row: any) => (
        <span className="font-mono font-bold text-emerald-600 theme-dark:text-emerald-400 text-sm">
          ₹
          {(Number(row.price) || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      name: "Stock",
      selector: (row: any) => Number(row.stock) || 0,
      sortable: true,
      grow: 1,
      minWidth: "130px",
      center: true,
      cell: (row: any) => {
        const amt = Number(row.stock) || 0;
        return amt > 0 ? (
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 theme-dark:bg-emerald-500/15 theme-dark:text-emerald-300 theme-dark:border-emerald-500/35 w-fit">
              Active Stock
            </span>
            <span className="text-xs font-mono text-muted font-semibold">
              {amt} units left
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-300 theme-dark:bg-rose-500/15 theme-dark:text-rose-300 theme-dark:border-rose-500/35">
            Depleted Out
          </span>
        );
      },
    },
    {
      name: "Actions",
      grow: 1,
      minWidth: "135px",
      center: true,
      cell: (row) => (
        <AdminActionButtons
          viewHref={ROUTES.admin.productView(row.id)}
          editHref={ROUTES.admin.productEdit(row.id)}
          onDelete={() => handleDelete(row.id)}
        />
      ),
    },
  ];

  return (
    <AdminListLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <h2 className="text-xl font-bold text-foreground mb-3">Product List</h2>

      <AdminTableSection
        columns={dtColumns}
        data={filtered}
        loading={loading}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search products...",
        }}
        toolbar={
          <>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory("");
              }}
              className={`w-full sm:w-44 ${ADMIN_TOOLBAR_SELECT_CLASS}`}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className={`w-full sm:w-44 ${ADMIN_TOOLBAR_SELECT_CLASS}`}
            >
              <option value="">All Sub Categories</option>
              {subcategories.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className={`w-full sm:w-40 ${ADMIN_TOOLBAR_SELECT_CLASS}`}
            >
              <option value="all">All Stock</option>
              <option value="in">In Stock</option>
              <option value="out">Out Of Stock</option>
            </select>

            <Link
              href={ROUTES.admin.productCreate}
              className="inline-flex h-10 items-center px-5 rounded-xl bg-primary hover:bg-primary-hover text-white whitespace-nowrap text-xs font-semibold transition-colors shadow-sm"
            >
              Create Product
            </Link>

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
        noDataMessage="No products found. Adjust filters or create a new product."
      />

      {/* RE-ARCHIVED STRUCTURAL DELETE MODAL */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Archive Target Material Entity"
        description="Are you certain you want to shift this entity into the archive pool sequence? Active listings across client-facing layout interfaces will be systematically closed out."
        confirmLabel="Confirm Relocation"
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
        downloadHref="/templates/product-import-template.xlsx"
        downloadFileName="product-import-template.xlsx"
        onClose={() => setSamplePreviewOpen(false)}
      />
    </AdminListLayout>
  );
}