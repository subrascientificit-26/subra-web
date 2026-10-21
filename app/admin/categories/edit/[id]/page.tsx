'use client';

import { useEffect, useState } from 'react';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/lib/useToast';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import SimpleImageUpload from '@/components/admin/SimpleImageUpload';
import LoadingState from '@/components/ui/LoadingState';
import {
  ADMIN_FORM_CARD_CLASS,
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_FORM_TEXTAREA_CLASS,
  ADMIN_LABEL_CLASS,
} from '@/lib/admin/formStyles';

export default function CategoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const { toasts, removeToast, showError, showSuccess } = useToast();

  useEffect(() => {
    if (!id) return;

    const loadCategory = async () => {
      setPageLoading(true);
      try {
        const res = await fetch(`/api/category/${id}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || 'Failed to load category');
        }

        const category = await res.json();
        setName(category.name || '');
        setDescription(category.description || '');
        setImagePreview(category.image || null);
      } catch (err: any) {
        showError(err.message || 'Failed to load category');
      } finally {
        setPageLoading(false);
      }
    };

    loadCategory();
  }, [id, showError]);

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Category name is required');
      return;
    }

    if (!id) {
      showError('Invalid category ID');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('id', String(id));
      formData.append('name', name);
      formData.append('description', description);
      if (imageFile) formData.append('image', imageFile);

      const res = await fetch('/api/category', {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || 'Failed to update category');
        return;
      }

      showSuccess('Category updated successfully');
      setTimeout(() => router.push('/admin/categories'), 1000);
    } catch (err: any) {
      showError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <LoadingState message="Loading category..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 text-foreground">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/categories"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:bg-surface-elevated transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Category</h1>
            <p className="text-sm text-muted">Update category details and save changes.</p>
          </div>
        </div>

        <ToastContainer toasts={toasts} onClose={removeToast} />

        <div className={`${ADMIN_FORM_CARD_CLASS} grid gap-4 lg:grid-cols-2`}>
          <div>
            <label className={ADMIN_LABEL_CLASS}>Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={ADMIN_FORM_INPUT_CLASS}
            />
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
        </div>

        <div className={ADMIN_FORM_CARD_CLASS}>
          <label className={ADMIN_LABEL_CLASS}>Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={ADMIN_FORM_TEXTAREA_CLASS}
          />
        </div>

        <button
          disabled={loading}
          onClick={handleSave}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save size={16} className="mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
