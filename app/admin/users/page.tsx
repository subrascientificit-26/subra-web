"use client";



import { useEffect, useMemo, useState } from "react";

import type { TableColumn } from "react-data-table-component";

import AdminListLayout from "@/components/admin/AdminListLayout";

import AdminCrudLayout, { AdminFormPanel } from "@/components/admin/AdminCrudLayout";

import AdminTableSection from "@/components/admin/AdminTableSection";

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
import { useLiveUpdates } from "@/lib/hooks/useLiveUpdates";



interface UserRow {

  id: number;

  email: string;

  name: string | null;

  role: "admin" | "user";

  profile: string | null;

  emailVerified: boolean;

  createdAt: string;

}



const emptyForm = {

  id: 0,

  name: "",

  email: "",

  password: "",

  role: "user" as "admin" | "user",

  emailVerified: false,

};



export default function AdminUsersPage() {

  const [users, setUsers] = useState<UserRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { toasts, removeToast, showError, showSuccess } = useToast();



  const loadUsers = async (showLoader = true) => {

    if (showLoader) setLoading(true);

    try {

      const res = await fetch("/api/users", { cache: "no-store" });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load users");

      setUsers(Array.isArray(data) ? data : []);

    } catch (error) {

      if (showLoader) {
        showError(error instanceof Error ? error.message : "Failed to load users");
        setUsers([]);
      }

    } finally {

      if (showLoader) setLoading(false);

    }

  };



  useEffect(() => {

    loadUsers(true);

  }, []);

  useLiveUpdates(["users"], () => {
    void loadUsers(false);
  });



  const resetForm = () => setForm(emptyForm);



  const handleSubmit = async (event: React.FormEvent) => {

    event.preventDefault();



    if (!form.email.trim()) {

      showError("Email is required");

      return;

    }



    if (!form.id && !form.password.trim()) {

      showError("Password is required for new users");

      return;

    }



    setSaving(true);



    try {

      const payload = {

        id: form.id || undefined,

        name: form.name.trim(),

        email: form.email.trim(),

        role: form.role,

        emailVerified: form.emailVerified,

        ...(form.password.trim() ? { password: form.password } : {}),

      };



      const res = await fetch("/api/users", {

        method: form.id ? "PUT" : "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(payload),

      });



      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to save user");



      showSuccess(form.id ? "User updated" : "User created");

      resetForm();

      await loadUsers();

    } catch (error) {

      showError(error instanceof Error ? error.message : "Failed to save user");

    } finally {

      setSaving(false);

    }

  };



  const handleEdit = (user: UserRow) => {

    setForm({

      id: user.id,

      name: user.name ?? "",

      email: user.email,

      password: "",

      role: user.role,

      emailVerified: user.emailVerified,

    });

  };



  const handleDelete = async () => {

    if (!confirmDeleteId) return;



    try {

      const res = await fetch(`/api/users?id=${confirmDeleteId}`, {

        method: "DELETE",

      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to delete user");



      showSuccess("User deleted");

      setConfirmDeleteId(null);

      await loadUsers();

    } catch (error) {

      showError(error instanceof Error ? error.message : "Failed to delete user");

    }

  };



  const columns: TableColumn<UserRow>[] = useMemo(

    () => [

      {

        name: "Name",

        grow: 1.5,

        selector: (row) => row.name ?? "",

        cell: (row) => (

          <span className="font-semibold text-foreground">

            {row.name?.trim() || "—"}

          </span>

        ),

      },

      {

        name: "Email",

        grow: 2,

        selector: (row) => row.email,

      },

      {

        name: "Role",

        width: "110px",

        center: true,

        cell: (row) => (

          <BadgeCell

            label={row.role === "admin" ? "Admin" : "User"}

            tone={row.role === "admin" ? "indigo" : "blue"}

          />

        ),

      },

      {

        name: "Verified",

        width: "110px",

        center: true,

        cell: (row) => (

          <BadgeCell

            label={row.emailVerified ? "Verified" : "Pending"}

            tone={row.emailVerified ? "green" : "blue"}

          />

        ),

      },

      {

        name: "Joined",

        width: "120px",

        selector: (row) => row.createdAt,

        cell: (row) =>

          row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—",

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

    ],

    []

  );



  return (

    <AdminListLayout>

      <ToastContainer toasts={toasts} onClose={removeToast} />



      <AdminCrudLayout

        title="User Management"

        // description="View and manage registered users, roles, and account status."

        form={

          <AdminFormPanel title={form.id ? "Edit User" : "Create User"}>

            <form onSubmit={handleSubmit} className="space-y-4">

              <AdminInput

                label="Name"

                value={form.name}

                onChange={(event) => setForm({ ...form, name: event.target.value })}

                placeholder="Full name"

              />



              <AdminInput

                label="Email"

                type="email"

                value={form.email}

                onChange={(event) => setForm({ ...form, email: event.target.value })}

                placeholder="user@example.com"

              />



              <AdminInput

                label={form.id ? "Password (leave blank to keep current)" : "Password"}

                type="password"

                value={form.password}

                onChange={(event) => setForm({ ...form, password: event.target.value })}

                placeholder="Password"

              />



              <AdminSelect

                label="Role"

                value={form.role}

                onChange={(event) =>

                  setForm({

                    ...form,

                    role: event.target.value as "admin" | "user",

                  })

                }

                options={[

                  { value: "user", label: "User" },

                  { value: "admin", label: "Admin" },

                ]}

              />



              <AdminCheckbox

                label="Email verified"

                checked={form.emailVerified}

                onChange={(checked) => setForm({ ...form, emailVerified: checked })}

              />



              <AdminFormActions

                submitLabel={form.id ? "Update User" : "Create User"}

                saving={saving}

                showCancel={form.id > 0}

                onCancel={resetForm}

              />

            </form>

          </AdminFormPanel>

        }

      >

        <AdminTableSection

          columns={columns}

          data={users}

          loading={loading}

          noDataMessage="No users found."

        />

      </AdminCrudLayout>



      <ConfirmDialog

        open={confirmDeleteId !== null}

        title="Delete User"

        description="Are you sure you want to delete this user?"

        onConfirm={handleDelete}

        onCancel={() => setConfirmDeleteId(null)}

      />

    </AdminListLayout>

  );

}


