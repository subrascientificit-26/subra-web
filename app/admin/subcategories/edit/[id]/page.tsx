'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import SimpleImageUpload from '@/components/admin/SimpleImageUpload';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/lib/useToast';
import LoadingState from '@/components/ui/LoadingState';
import { PAGE_CONTAINER_CLASS } from '@/lib/layout';
import { ROUTES } from '@/lib/routes';
import {
  ADMIN_FORM_CARD_CLASS,
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_FORM_TEXTAREA_CLASS,
  ADMIN_LABEL_CLASS,
  ADMIN_SELECT_CLASS,
} from '@/lib/admin/formStyles';

export default function SubcategoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const { toasts, removeToast, showError } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, subRes] = await Promise.all([
          fetch('/api/category', { cache: 'no-store' }),
          id ? fetch(`/api/subcategory/${id}`, { cache: 'no-store' }) : Promise.resolve(null),
        ]);

        if (catRes.ok) {
          setCategories(await catRes.json());
        }

        if (subRes) {
          if (!subRes.ok) {
            const body = await subRes.json();
            throw new Error(body.error || 'Failed to load subcategory');
          }

          const subcategory = await subRes.json();
          setName(subcategory.name || '');
          setDescription(subcategory.description || '');
          setCategoryId(String(subcategory.categoryId || ''));
          setImagePreview(subcategory.image || null);
        }
      } catch (err: any) {
        showError(err.message || 'Failed to load data');
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [id, showError]);

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Subcategory name is required');
      return;
    }

    if (!categoryId) {
      showError('Please select category');
      return;
    }

    if (!id) {
      showError('Invalid subcategory ID');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('id', String(id));
      formData.append('name', name);
      formData.append('description', description);
      formData.append('categoryId', categoryId);
      if (imageFile) formData.append('image', imageFile);

      const res = await fetch('/api/subcategory', {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Failed to update subcategory');
        return;
      }

      toast.success('Subcategory updated successfully');
      router.push(ROUTES.admin.subcategories);
    } catch (err: any) {
      showError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <LoadingState message="Loading subcategory..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-3 text-foreground">
      <div className={`${PAGE_CONTAINER_CLASS} space-y-6`}>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/subcategories"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:bg-surface-elevated transition"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Subcategory</h1>
            <p className="text-sm text-muted">Update subcategory details and save changes.</p>
          </div>
        </div>

        <ToastContainer toasts={toasts} onClose={removeToast} />

        <div className={`${ADMIN_FORM_CARD_CLASS} grid gap-4 lg:grid-cols-2`}>
          <div>
            <label className={ADMIN_LABEL_CLASS}>Subcategory Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={ADMIN_FORM_INPUT_CLASS}
            />
          </div>

          <div>
            <label className={ADMIN_LABEL_CLASS}>Parent Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={ADMIN_SELECT_CLASS}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={ADMIN_FORM_CARD_CLASS}>
          <label className={ADMIN_LABEL_CLASS}>Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={ADMIN_FORM_TEXTAREA_CLASS}
          />
        </div>

        <div className={ADMIN_FORM_CARD_CLASS}>
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
