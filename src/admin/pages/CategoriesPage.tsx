import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Category, Photo } from '../types';
import {
  GripVertical,
  Pencil,
  Eye,
  EyeOff,
  Image as ImageIcon,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';

interface CategoryWithEdit extends Category {
  isEditing?: boolean;
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithEdit[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryWithEdit | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, photosData] = await Promise.all([
          api.getCategories(),
          api.getPhotos(),
        ]);
        setCategories(categoriesData);
        setPhotos(photosData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTogglePublished = async (id: string, isPublished: boolean) => {
    try {
      await api.updateCategory(id, { isPublished });
      setCategories(prev =>
        prev.map(c => (c.id === id ? { ...c, isPublished } : c))
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

    const draggedIndex = categories.findIndex(c => c.id === draggedId);
    const targetIndex = categories.findIndex(c => c.id === targetId);

    const newCategories = [...categories];
    const [draggedCategory] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, draggedCategory);

    setCategories(newCategories);

    try {
      await api.reorderCategories(newCategories.map(c => c.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder categories');
      const [categoriesData] = await Promise.all([api.getCategories()]);
      setCategories(categoriesData);
    }

    setDraggedId(null);
  };

  const getCoverPhoto = (coverPhotoId: string | null) => {
    return photos.find(p => p.id === coverPhotoId);
  };

  const getPhotoCount = (categoryId: string) => {
    return photos.filter(p => p.categories.includes(categoryId)).length;
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
        <button onClick={() => setError(null)} className="ml-auto hover:text-red-900">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
        <p className="text-gray-500 mt-1">
          Manage your portfolio categories. Drag to reorder.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {categories.map(category => {
            const coverPhoto = getCoverPhoto(category.coverPhotoId);
            const photoCount = getPhotoCount(category.id);

            return (
              <div
                key={category.id}
                draggable
                onDragStart={e => handleDragStart(e, category.id)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, category.id)}
                className={`group flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  draggedId === category.id ? 'bg-blue-50 opacity-50' : ''
                }`}
              >
                <div className="cursor-move p-1 text-gray-400 hover:text-gray-600">
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="w-20 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                  {coverPhoto ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                    <span className="text-xs text-gray-400">/{category.slug}</span>
                    {category.isPublished ? (
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
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {category.description || 'No description'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{photoCount} photos</p>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleTogglePublished(category.id, !category.isPublished)}
                    className={`p-2 rounded-lg ${
                      category.isPublished
                        ? 'text-gray-600 hover:bg-gray-100'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={category.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {category.isPublished ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editingCategory && (
        <CategoryEditModal
          category={editingCategory}
          photos={photos}
          onClose={() => setEditingCategory(null)}
          onSave={async data => {
            try {
              await api.updateCategory(editingCategory.id, data);
              const categoriesData = await api.getCategories();
              setCategories(categoriesData);
              setEditingCategory(null);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to update category');
            }
          }}
        />
      )}
    </div>
  );
}

interface CategoryEditModalProps {
  category: Category;
  photos: Photo[];
  onClose: () => void;
  onSave: (data: Partial<Category>) => Promise<void>;
}

function CategoryEditModal({ category, photos, onClose, onSave }: CategoryEditModalProps) {
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [description, setDescription] = useState(category.description);
  const [seoTitle, setSeoTitle] = useState(category.seoTitle);
  const [seoDescription, setSeoDescription] = useState(category.seoDescription);
  const [coverPhotoId, setCoverPhotoId] = useState(category.coverPhotoId);
  const [isPublished, setIsPublished] = useState(category.isPublished);
  const [isSaving, setIsSaving] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(value));
    }
  };

  const slugify = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const categoryPhotos = photos.filter(p => p.categories.includes(category.id));

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({
      name,
      slug,
      description,
      seoTitle,
      seoDescription,
      coverPhotoId,
      isPublished,
    });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Edit Category</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-2 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">SEO Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SEO page title"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea
                  value={seoDescription}
                  onChange={e => setSeoDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="SEO meta description"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Photo
            </label>
            <div className="grid grid-cols-5 gap-2">
              {categoryPhotos.length === 0 ? (
                <p className="col-span-5 text-sm text-gray-500 py-4 text-center">
                  No photos in this category
                </p>
              ) : (
                categoryPhotos.map(photo => (
                  <button
                    key={photo.id}
                    onClick={() => setCoverPhotoId(photo.id)}
                    className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                      coverPhotoId === photo.id
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-gray-300" />
                    </div>
                    {coverPhotoId === photo.id && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={e => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Published</span>
          </label>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
