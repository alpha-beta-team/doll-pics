import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Package } from '../types';
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
} from 'lucide-react';

export function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const data = await api.getPackages();
      setPackages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package? This cannot be undone.')) return;
    try {
      await api.deletePackage(id);
      await fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete package');
    }
  };

  const handleTogglePublished = async (id: string, isPublished: boolean) => {
    try {
      await api.updatePackage(id, { isPublished });
      setPackages(prev =>
        prev.map(p => (p.id === id ? { ...p, isPublished } : p))
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

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = packages.findIndex(p => p.id === draggedId);
    const targetIndex = packages.findIndex(p => p.id === targetId);

    const newPackages = [...packages];
    const [draggedPackage] = newPackages.splice(draggedIndex, 1);
    newPackages.splice(targetIndex, 0, draggedPackage);

    setPackages(newPackages);

    try {
      await api.reorderPackages(newPackages.map(p => p.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder packages');
      fetchPackages();
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
        <button onClick={() => setError(null)} className="ml-auto hover:text-red-900">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Packages</h1>
          <p className="text-gray-500 mt-1">
            Manage your photography service packages
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Package
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">No packages yet</h3>
          <p className="text-gray-500 mt-1">Create your first service package</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {packages.map(pkg => (
              <div
                key={pkg.id}
                draggable
                onDragStart={e => handleDragStart(e, pkg.id)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, pkg.id)}
                className={`group flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  draggedId === pkg.id ? 'bg-blue-50 opacity-50' : ''
                }`}
              >
                <div className="cursor-move p-1 text-gray-400 hover:text-gray-600 mt-1">
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900">{pkg.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {pkg.shootType}
                    </span>
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
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{pkg.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm font-medium text-blue-600">
                      {formatPrice(pkg)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {pkg.inclusions.length} inclusions
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingPackage(pkg)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleTogglePublished(pkg.id, !pkg.isPublished)}
                    className={`p-2 rounded-lg ${
                      pkg.isPublished
                        ? 'text-gray-600 hover:bg-gray-100'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={pkg.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {pkg.isPublished ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(editingPackage || isCreating) && (
        <PackageEditModal
          pkg={isCreating ? null : editingPackage}
          onClose={() => {
            setEditingPackage(null);
            setIsCreating(false);
          }}
          onSave={async data => {
            if (isCreating) {
              await api.createPackage(data as Omit<Package, 'id'>);
            } else if (editingPackage) {
              await api.updatePackage(editingPackage.id, data);
            }
            await fetchPackages();
            setEditingPackage(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}

interface PackageEditModalProps {
  pkg: Package | null;
  onClose: () => void;
  onSave: (data: Partial<Package>) => Promise<void>;
}

function PackageEditModal({ pkg, onClose, onSave }: PackageEditModalProps) {
  const [name, setName] = useState(pkg?.name || '');
  const [shootType, setShootType] = useState(pkg?.shootType || 'Wedding');
  const [description, setDescription] = useState(pkg?.description || '');
  const [inclusions, setInclusions] = useState<string[]>(pkg?.inclusions || []);
  const [newInclusion, setNewInclusion] = useState('');
  const [pricingMode, setPricingMode] = useState<'price' | 'startingFrom' | 'enquire'>(
    pkg?.pricingMode || 'price'
  );
  const [price, setPrice] = useState(pkg?.price?.toString() || '');
  const [isPublished, setIsPublished] = useState(pkg?.isPublished ?? true);
  const [icon, setIcon] = useState(pkg?.icon || 'Heart');
  const [imageUrl, setImageUrl] = useState(pkg?.imageUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const shootTypes = ['Wedding', 'Pre-Wedding', 'Baby Shower', 'Outdoor', 'Indoor'];

  const handleAddInclusion = () => {
    if (newInclusion.trim()) {
      setInclusions(prev => [...prev, newInclusion.trim()]);
      setNewInclusion('');
    }
  };

  const handleRemoveInclusion = (index: number) => {
    setInclusions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        name,
        shootType,
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
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
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
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Wedding Premium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shoot Type
              </label>
              <select
                value={shootType}
                onChange={e => setShootType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {shootTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
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
                onChange={e => setIcon(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Heart, Camera, Gift..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
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
                    onClick={() => handleRemoveInclusion(index)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInclusion}
                  onChange={e => setNewInclusion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddInclusion())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add an inclusion..."
                />
                <button
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
                      onChange={e => setPrice(e.target.value)}
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
            disabled={isSaving || !name}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : pkg ? 'Save Changes' : 'Create Package'}
          </button>
        </div>
      </div>
    </div>
  );
}
