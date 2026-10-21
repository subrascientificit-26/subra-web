"use client";

import { useEffect, useMemo, useState } from "react";
import type { TableColumn } from "react-data-table-component";
import AdminListLayout from "@/components/admin/AdminListLayout";
import AdminCrudLayout, { AdminFormPanel } from "@/components/admin/AdminCrudLayout";
import AdminDataTable, { AdminTablePanel } from "@/components/admin/AdminDataTable";
import AdminActionButtons from "@/components/admin/AdminActionButtons";
import {
  AdminCheckbox,
  AdminFormActions,
  AdminInput,
  AdminSelect,
} from "@/components/admin/AdminFields";
import { BadgeCell } from "@/components/admin/DetailCells";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import { invalidateSidebarCache } from "@/lib/hooks/useSidebarItems";
import { ADMIN_TOOLBAR_SELECT_CLASS } from "@/lib/admin/formStyles";

interface SidebarItem {
  id: number;
  label: string;
  href: string;
  section: "navbar" | "footer" | "footer_service" | "products_sidebar" | "admin";
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
}

const SECTIONS = [
  { value: "navbar", label: "Navbar" },
  { value: "footer", label: "Footer Quick Links" },
  { value: "footer_service", label: "Footer Customer Service" },
  { value: "products_sidebar", label: "Products Sidebar" },
  { value: "admin", label: "Admin Menu" },
] as const;

const emptyForm = {
  id: 0,
  label: "",
  href: "",
  section: "navbar" as SidebarItem["section"],
  parentId: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminSidebarPage() {
  const [items, setItems] = useState<SidebarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [sectionFilter, setSectionFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const { toasts, removeToast, showError, showSuccess } = useToast();

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sidebar?includeInactive=true");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load sidebar items");
      }
      setItems(Array.isArray(data) ? data : []);
      invalidateSidebarCache();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to load sidebar items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const parentOptions = useMemo(
    () =>
      items.filter(
        (item) =>
          item.section === form.section &&
          item.id !== form.id &&
          item.parentId === null
      ),
    [items, form.section, form.id]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (sectionFilter !== "all" && item.section !== sectionFilter) {
        return false;
      }

      if (activeFilter === "active" && !item.isActive) {
        return false;
      }

      if (activeFilter === "inactive" && item.isActive) {
        return false;
      }

      return true;
    });
  }, [items, sectionFilter, activeFilter]);

  const resetForm = () => setForm(emptyForm);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.label.trim() || !form.href.trim()) {
      showError("Label and link are required");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        id: form.id || undefined,
        label: form.label.trim(),
        href: form.href.trim(),
        section: form.section,
        parentId: form.parentId ? Number(form.parentId) : null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };

      const res = await fetch("/api/sidebar", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save sidebar item");
      }

      showSuccess(form.id ? "Sidebar item updated" : "Sidebar item created");
      resetForm();
      await loadItems();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: SidebarItem) => {
    setForm({
      id: item.id,
      label: item.label,
      href: item.href,
      section: item.section,
      parentId: item.parentId ? String(item.parentId) : "",
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;

    try {
      const res = await fetch(`/api/sidebar?id=${confirmDeleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete sidebar item");
      }

      showSuccess("Sidebar item deleted");
      setConfirmDeleteId(null);
      await loadItems();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const columns: TableColumn<SidebarItem>[] = [
    {
      name: "Label",
      grow: 2,
      selector: (row) => row.label,
      cell: (row) => <span className="font-semibold text-foreground">{row.label}</span>,
    },
    {
      name: "Link",
      grow: 2,
      selector: (row) => row.href,
      cell: (row) => <span className="text-muted">{row.href}</span>,
    },
    {
      name: "Section",
      width: "180px",
      selector: (row) => row.section,
      cell: (row) =>
        SECTIONS.find((section) => section.value === row.section)?.label ?? row.section,
    },
    {
      name: "Order",
      width: "80px",
      center: true,
      selector: (row) => row.sortOrder,
    },
    {
      name: "Status",
      width: "110px",
      center: true,
      cell: (row) => (
        <BadgeCell
          label={row.isActive ? "Active" : "Hidden"}
          tone={row.isActive ? "green" : "blue"}
        />
      ),
    },
    {
      name: "Actions",
      width: "120px",
      center: true,
      cell: (row) => (
        <AdminActionButtons
          onEdit={() => handleEdit(row)}
          onDelete={() => setConfirmDeleteId(row.id)}
        />
      ),
    },
  ];

  return (
    <AdminListLayout>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="h-[calc(100vh-145px)] min-h-0 flex flex-col">
        <AdminCrudLayout
          title="Sidebar Management"
          // description="Create navigation links stored in the database and shown on the website."
          compact
          fitViewport
          form={
            <AdminFormPanel
              compact
              title={form.id ? "Edit Sidebar Item" : "Create Sidebar Item"}
            >
              <form onSubmit={handleSubmit} className="space-y-3">
              <AdminInput
                label="Label"
                required
                value={form.label}
                onChange={(event) => setForm({ ...form, label: event.target.value })}
                placeholder="Products"
              />
              <AdminInput
                label="Link"
                required
                value={form.href}
                onChange={(event) => setForm({ ...form, href: event.target.value })}
                placeholder="/products"
              />
              <AdminSelect
                label="Section"
                value={form.section}
                onChange={(event) =>
                  setForm({
                    ...form,
                    section: event.target.value as SidebarItem["section"],
                    parentId: "",
                  })
                }
                options={SECTIONS.map((section) => ({
                  value: section.value,
                  label: section.label,
                }))}
              />
              {(form.section === "navbar" || form.section === "admin") && (
                <AdminSelect
                  label="Parent Menu (optional)"
                  value={form.parentId}
                  onChange={(event) =>
                    setForm({ ...form, parentId: event.target.value })
                  }
                  placeholder="Top level"
                  options={parentOptions.map((item) => ({
                    value: item.id,
                    label: item.label,
                  }))}
                />
              )}
              <AdminInput
                label="Sort Order"
                type="number"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm({ ...form, sortOrder: Number(event.target.value) })
                }
              />
              <AdminCheckbox
                label="Active"
                checked={form.isActive}
                onChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <AdminFormActions
                submitLabel={form.id ? "Update Item" : "Create Item"}
                saving={saving}
                showCancel={form.id > 0}
                onCancel={resetForm}
              />
            </form>
          </AdminFormPanel>
        }
      >
        <AdminTablePanel fitViewport>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select
              value={sectionFilter}
              onChange={(event) => setSectionFilter(event.target.value)}
              className={ADMIN_TOOLBAR_SELECT_CLASS}
              aria-label="Filter by section"
            >
              <option value="all">All Sections</option>
              {SECTIONS.map((section) => (
                <option key={section.value} value={section.value}>
                  {section.label}
                </option>
              ))}
            </select>

            <select
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value)}
              className={ADMIN_TOOLBAR_SELECT_CLASS}
              aria-label="Filter by active status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <AdminDataTable
            columns={columns}
            data={filteredItems}
            loading={loading}
            noDataMessage="No sidebar items found. Create your first menu link."
          />
        </AdminTablePanel>
      </AdminCrudLayout>
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete Sidebar Item"
        description="Are you sure you want to delete this sidebar item?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </AdminListLayout>
  );
}
