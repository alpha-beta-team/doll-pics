import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Package, PackageCategory } from '../types';
import {
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  DollarSign,
  FolderOpen,
} from 'lucide-react';

const UNCATEGORIZED_KEY = '__uncategorized__';
const ALL_CATEGORIES_KEY = '__all__';

interface PackageGroup {
  key: string;
  categoryId: string;
  name: string;
  isPublished?: boolean;
  packages: Package[];
}

export function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createCategoryId, setCreateCategoryId] = useState<string>('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(ALL_CATEGORIES_KEY);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pkgs, cats] = await Promise.all([
        api.getPackages(),
        api.getPackageCategories().catch(() => [] as PackageCategory[]),
      ]);
      setPackages(pkgs);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packages');
    } finally {
      setIsLoading(false);
    }
  };

  const groups = useMemo((): PackageGroup[] => {
    const byCategoryId = new Map<string, Package[]>();
    for (const pkg of packages) {
      const key = pkg.categoryId || UNCATEGORIZED_KEY;
      const list = byCategoryId.get(key) || [];
      list.push(pkg);
      byCategoryId.set(key, list);
    }

    const ordered: PackageGroup[] = categories.map((cat) => ({
      key: cat.id,
      categoryId: cat.id,
      name: cat.name,
      isPublished: cat.isPublished,
      packages: byCategoryId.get(cat.id) || [],
    }));

    const knownIds = new Set(categories.map((c) => c.id));
    for (const [key, pkgs] of byCategoryId) {
      if (key === UNCATEGORIZED_KEY || !knownIds.has(key)) {
        ordered.push({
          key,
          categoryId: key === UNCATEGORIZED_KEY ? '' : key,
          name:
            pkgs[0]?.categoryName ||
            pkgs[0]?.shootType ||
            (key === UNCATEGORIZED_KEY ? 'Uncategorized' : 'Unknown category'),
          packages: pkgs,
        });
      }
    }

    return ordered;
  }, [packages, categories]);

  const categoryPills = useMemo(() => {
    return [
      {
        key: ALL_CATEGORIES_KEY,
        label: 'All',
        count: packages.length,
      },
      ...groups.map((group) => ({
        key: group.key,
        label: group.name,
        count: group.packages.length,
      })),
    ];
  }, [groups, packages.length]);

  const activeCategoryKey = useMemo(() => {
    if (
      selectedCategoryKey === ALL_CATEGORIES_KEY ||
      groups.some((group) => group.key === selectedCategoryKey)
    ) {
      return selectedCategoryKey;
    }
    return ALL_CATEGORIES_KEY;
  }, [groups, selectedCategoryKey]);

  const visibleGroups = useMemo(() => {
    if (activeCategoryKey === ALL_CATEGORIES_KEY) return groups;
    return groups.filter((group) => group.key === activeCategoryKey);
  }, [groups, activeCategoryKey]);

  const openCreate = (categoryId = '') => {
    const preferred =
      categoryId ||
      (activeCategoryKey !== ALL_CATEGORIES_KEY &&
      activeCategoryKey !== UNCATEGORIZED_KEY
        ? activeCategoryKey
        : '') ||
      categories[0]?.id ||
      '';
    setCreateCategoryId(preferred);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package? This cannot be undone.')) return;
    try {
      await api.deletePackage(id);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete package');
    }
  };

  const handleTogglePublished = async (id: string, isPublished: boolean) => {
    try {
      await api.updatePackage(id, { isPublished });
      setPackages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isPublished } : p)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update package');
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

  const handleDrop = async (e: React.DragEvent, targetId: string, groupKey: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const dragged = packages.find((p) => p.id === draggedId);
    const target = packages.find((p) => p.id === targetId);
    if (!dragged || !target) {
      setDraggedId(null);
      return;
    }

    const draggedKey = dragged.categoryId || UNCATEGORIZED_KEY;
    if (draggedKey !== groupKey || (target.categoryId || UNCATEGORIZED_KEY) !== groupKey) {
      setDraggedId(null);
      return;
    }

    const groupIds = packages
      .filter((p) => (p.categoryId || UNCATEGORIZED_KEY) === groupKey)
      .map((p) => p.id);
    const from = groupIds.indexOf(draggedId);
    const to = groupIds.indexOf(targetId);
    if (from < 0 || to < 0) {
      setDraggedId(null);
      return;
    }

    const reorderedGroup = [...groupIds];
    const [moved] = reorderedGroup.splice(from, 1);
    reorderedGroup.splice(to, 0, moved);

    const byId = new Map(packages.map((p) => [p.id, p]));
    const nextPackages: Package[] = [];
    let groupCursor = 0;
    for (const pkg of packages) {
      const key = pkg.categoryId || UNCATEGORIZED_KEY;
      if (key === groupKey) {
        const id = reorderedGroup[groupCursor++];
        nextPackages.push(byId.get(id)!);
      } else {
        nextPackages.push(pkg);
      }
    }

    setPackages(nextPackages);

    try {
      await api.reorderPackages(nextPackages.map((p) => p.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder packages');
      fetchData();
    }

    setDraggedId(null);
  };

  const formatPrice = (pkg: Package) => {
    if (pkg.pricingMode === 'enquire') {
      return 'Enquire for price';
    }
    const prefix = pkg.pricingMode === 'startingFrom' ? 'From ' : '';
    return `${prefix}$${pkg.price?.toLocaleString()}`;
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Packages</h1>
          <p className="text-gray-500 mt-1">
            Manage photography packages grouped by category
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Package
        </button>
      </div>

      {(categories.length > 0 || packages.length > 0) && (
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1"
          role="tablist"
          aria-label="Filter packages by category"
        >
          {categoryPills.map((pill) => {
            const isActive = activeCategoryKey === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategoryKey(pill.key)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pill.label}
                <span
                  className={`text-xs tabular-nums ${
                    isActive ? 'text-blue-100' : 'text-gray-400'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {packages.length === 0 && categories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">No packages yet</h3>
          <p className="text-gray-500 mt-1">
            Create a package category first, then add packages under it
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleGroups.map((group) => {
            const publishedCount = group.packages.filter((p) => p.isPublished).length;
            return (
              <section
                key={group.key}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-500">
                      <FolderOpen className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-semibold text-gray-900 truncate">
                          {group.name}
                        </h2>
                        {group.isPublished === false && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                            Category draft
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {group.packages.length}{' '}
                        {group.packages.length === 1 ? 'package' : 'packages'}
                        {group.packages.length > 0 && (
                          <>
                            {' · '}
                            {publishedCount} published
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  {group.categoryId && (
                    <button
                      type="button"
                      onClick={() => openCreate(group.categoryId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  )}
                </div>

                {group.packages.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-gray-500">No packages in this category yet</p>
                    {group.categoryId && (
                      <button
                        type="button"
                        onClick={() => openCreate(group.categoryId)}
                        className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Add a package
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {group.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, pkg.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, pkg.id, group.key)}
                        className={`group flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50/80 transition-colors ${
                          draggedId === pkg.id ? 'bg-blue-50 opacity-50' : ''
                        }`}
                      >
                        <div className="cursor-move p-1 text-gray-300 group-hover:text-gray-500 mt-0.5">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-medium text-gray-900">{pkg.name}</h3>
                            {pkg.isPublished ? (
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
                          {pkg.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {pkg.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-sm font-medium text-blue-600">
                              {formatPrice(pkg)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {pkg.inclusions.length} inclusions
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setEditingPackage(pkg)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            aria-label="Edit package"
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePublished(pkg.id, !pkg.isPublished)}
                            className={`p-2 rounded-lg ${
                              pkg.isPublished
                                ? 'text-gray-600 hover:bg-gray-100'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            aria-label={pkg.isPublished ? 'Unpublish' : 'Publish'}
                          >
                            {pkg.isPublished ? (
                              <EyeOff className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <Eye className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(pkg.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            aria-label="Delete package"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {(editingPackage || isCreating) && (
        <PackageEditModal
          pkg={isCreating ? null : editingPackage}
          categories={categories}
          defaultCategoryId={isCreating ? createCategoryId : undefined}
          onClose={() => {
            setEditingPackage(null);
            setIsCreating(false);
            setCreateCategoryId('');
          }}
          onSave={async (data) => {
            if (isCreating) {
              await api.createPackage(data as Omit<Package, 'id'>);
            } else if (editingPackage) {
              await api.updatePackage(editingPackage.id, data);
            }
            await fetchData();
            setEditingPackage(null);
            setIsCreating(false);
            setCreateCategoryId('');
          }}
        />
      )}
    </div>
  );
}

interface PackageEditModalProps {
  pkg: Package | null;
  categories: PackageCategory[];
  defaultCategoryId?: string;
  onClose: () => void;
  onSave: (data: Partial<Package>) => Promise<void>;
}

function PackageEditModal({
  pkg,
  categories,
  defaultCategoryId,
  onClose,
  onSave,
}: PackageEditModalProps) {
  const initialCategoryId =
    pkg?.categoryId || defaultCategoryId || categories[0]?.id || '';
  const [name, setName] = useState(pkg?.name || '');
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [description, setDescription] = useState(pkg?.description || '');
  const [inclusions, setInclusions] = useState<string[]>(pkg?.inclusions || []);
  const [newInclusion, setNewInclusion] = useState('');
  const [pricingMode, setPricingMode] = useState<'price' | 'startingFrom' | 'enquire'>(
    pkg?.pricingMode || 'price',
  );
  const [price, setPrice] = useState(pkg?.price?.toString() || '');
  const [isPublished, setIsPublished] = useState(pkg?.isPublished ?? true);
  const [icon, setIcon] = useState(pkg?.icon || 'Heart');
  const [imageUrl, setImageUrl] = useState(pkg?.imageUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleAddInclusion = () => {
    if (newInclusion.trim()) {
      setInclusions((prev) => [...prev, newInclusion.trim()]);
      setNewInclusion('');
    }
  };

  const handleRemoveInclusion = (index: number) => {
    setInclusions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        name,
        categoryId,
        categoryName: selectedCategory?.name,
        categorySlug: selectedCategory?.slug,
        shootType: selectedCategory?.name,
        description,
        inclusions,
        pricingMode,
        price: pricingMode !== 'enquire' && price ? parseFloat(price) : undefined,
        isPublished,
        icon,
        imageUrl,
        order: pkg?.order ?? 0,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {pkg ? 'Edit Package' : 'Create Package'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Wedding Premium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.length === 0 ? (
                  <option value="">No categories — create one first</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Brief description of this package..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Lucide name)</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Heart, Camera, Gift..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inclusions
            </label>
            <div className="space-y-2">
              {inclusions.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <span className="flex-1 text-sm text-gray-700">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInclusion(index)}
                    aria-label={`Remove inclusion: ${item}`}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInclusion}
                  onChange={(e) => setNewInclusion(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), handleAddInclusion())
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add an inclusion..."
                />
                <button
                  type="button"
                  onClick={handleAddInclusion}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pricing
            </label>
            <div className="space-y-3">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pricingMode"
                    checked={pricingMode === 'price'}
                    onChange={() => setPricingMode('price')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Show price</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pricingMode"
                    checked={pricingMode === 'startingFrom'}
                    onChange={() => setPricingMode('startingFrom')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Starting from</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pricingMode"
                    checked={pricingMode === 'enquire'}
                    onChange={() => setPricingMode('enquire')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Enquire only</span>
                </label>
              </div>

              {pricingMode !== 'enquire' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Price Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Published</span>
          </label>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
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
            disabled={isSaving || !name || !categoryId}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : pkg ? 'Save Changes' : 'Create Package'}
          </button>
        </div>
      </div>
    </div>
  );
}
