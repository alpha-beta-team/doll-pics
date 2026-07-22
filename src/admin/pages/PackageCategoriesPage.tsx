import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { PackageCategory } from '../types';
import {
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  FolderOpen,
} from 'lucide-react';

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function PackageCategoriesPage() {
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PackageCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await api.getPackageCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load package categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package category? Packages using it may need reassignment.')) {
      return;
    }
    try {
      await api.deletePackageCategory(id);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const handleTogglePublished = async (id: string, isPublished: boolean) => {
    try {
      await api.updatePackageCategory(id, { isPublished });
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isPublished } : c)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = categories.findIndex((c) => c.id === draggedId);
    const targetIndex = categories.findIndex((c) => c.id === targetId);
    const next = [...categories];
    const [dragged] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, dragged);
    setCategories(next);

    try {
      await api.reorderPackageCategories(next.map((c) => c.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder categories');
      fetchCategories();
    }
    setDraggedId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
        <button
          type="button"
          onClick={() => setError(null)}
          aria-label="Dismiss error"
          className="ml-auto hover:text-red-900"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Package categories</h1>
          <p className="text-gray-500 mt-1">
            Group packages by type (Wedding, Maternity, …) for the public nav and pages
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">No categories yet</h3>
          <p className="text-gray-500 mt-1">Create Wedding, Maternity, and other package types</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {categories.map((cat) => (
              <div
                key={cat.id}
                draggable
                onDragStart={(e) => handleDragStart(e, cat.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, cat.id)}
                className={`group flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  draggedId === cat.id ? 'bg-blue-50 opacity-50' : ''
                }`}
              >
                <div className="cursor-move p-1 text-gray-400 hover:text-gray-600 mt-1">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-medium text-gray-900">{cat.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {cat.slug}
                    </span>
                    {cat.path ? (
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                        {cat.path}
                      </span>
                    ) : null}
                    {cat.isPublished ? (
                      <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                        <Eye className="w-3 h-3" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                        <EyeOff className="w-3 h-3" />
                        Draft
                      </span>
                    )}
                  </div>
                  {cat.description ? (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setEditing(cat)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    aria-label="Edit category"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePublished(cat.id, !cat.isPublished)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    aria-label={cat.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {cat.isPublished ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    aria-label="Delete category"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(editing || isCreating) && (
        <CategoryEditModal
          category={isCreating ? null : editing}
          onClose={() => {
            setEditing(null);
            setIsCreating(false);
          }}
          onSave={async (data) => {
            if (isCreating) {
              await api.createPackageCategory(data as Omit<PackageCategory, 'id'>);
            } else if (editing) {
              await api.updatePackageCategory(editing.id, data);
            }
            await fetchCategories();
            setEditing(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}

function CategoryEditModal({
  category,
  onClose,
  onSave,
}: {
  category: PackageCategory | null;
  onClose: () => void;
  onSave: (data: Partial<PackageCategory>) => Promise<void>;
}) {
  const [name, setName] = useState(category?.name || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [slugTouched, setSlugTouched] = useState(Boolean(category?.slug));
  const [path, setPath] = useState(category?.path || '');
  const [pathTouched, setPathTouched] = useState(Boolean(category?.path));
  const [description, setDescription] = useState(category?.description || '');
  const [seoTitle, setSeoTitle] = useState(category?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(
    category?.seoDescription || '',
  );
  const [heading, setHeading] = useState(category?.heading || '');
  const [lead, setLead] = useState(category?.lead || '');
  const [isPublished, setIsPublished] = useState(category?.isPublished ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const pathFromSlug = (value: string) =>
    value ? `/${slugify(value)}-packages-erode` : '';

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      const nextSlug = slugify(value);
      setSlug(nextSlug);
      if (!pathTouched) setPath(pathFromSlug(nextSlug));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const nextSlug = slug || slugify(name);
      await onSave({
        name,
        slug: nextSlug,
        path: path || pathFromSlug(nextSlug),
        description,
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        heading: heading.trim(),
        lead: lead.trim(),
        isPublished,
        order: category?.order ?? 0,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {category ? 'Edit category' : 'Create category'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Wedding"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                const nextSlug = slugify(e.target.value);
                setSlug(nextSlug);
                if (!pathTouched) setPath(pathFromSlug(nextSlug));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="wedding"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Public path
            </label>
            <input
              type="text"
              value={path}
              onChange={(e) => {
                setPathTouched(true);
                const raw = e.target.value.trim();
                setPath(raw.startsWith('/') || !raw ? raw : `/${raw}`);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="/wedding-packages-erode"
            />
            <p className="mt-1 text-xs text-gray-500">
              Live URL for this category. Defaults to /{slug}-packages-erode
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Short blurb for the packages hub"
            />
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Landing SEO</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Overrides static JSON when filled. Leave blank to keep defaults.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO title
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Wedding Photography Packages in Erode | Doll Pictures"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta description
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Compare wedding photography packages in Erode…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page heading (H1)
              </label>
              <input
                type="text"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Wedding photography packages in Erode"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead paragraph
              </label>
              <textarea
                value={lead}
                onChange={(e) => setLead(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Intro copy under the heading"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Published</span>
          </label>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : category ? 'Save changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
