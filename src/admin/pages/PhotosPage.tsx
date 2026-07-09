import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api/client';
import type { Photo, Category } from '../types';
import {
  Search,
  Filter,
  Upload,
  X,
  Check,
  Star,
  Eye,
  EyeOff,
  Trash2,
  MoreVertical,
  Image as ImageIcon,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

function resolvePhotoUrl(url: string): string {
  if (!url) return '';
  if (/^(https?:|blob:|data:)/.test(url)) return url;
  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
}

function getPhotoSrc(photo: Photo): string {
  return resolvePhotoUrl(photo.variants.webp || photo.variants.avif);
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  preview: string;
  status: 'uploading' | 'complete' | 'error';
}

interface PhotoEdit extends Photo {
  isEditing?: boolean;
}

export function PhotosPage() {
  const [photos, setPhotos] = useState<PhotoEdit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPublished, setSelectedPublished] = useState<string>('');
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const [photosData, categoriesData] = await Promise.all([
        api.getPhotos({
          category: selectedCategory || undefined,
          published: selectedPublished === '' ? undefined : selectedPublished === 'true',
          search: searchQuery || undefined,
        }),
        api.getCategories(),
      ]);
      setPhotos(photosData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedPublished, searchQuery]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleSelectPhoto = (id: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPhotos(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const uploadFiles: UploadingFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      progress: 0,
      preview: URL.createObjectURL(file),
      status: 'uploading' as const,
    }));

    setUploadingFiles(uploadFiles);
    setShowUploadModal(true);
    setIsUploading(true);

    try {
      await api.uploadFiles(
        files,
        (fileId, progress) => {
          setUploadingFiles(prev =>
            prev.map(f => (f.id === fileId ? { ...f, progress } : f))
          );
        }
      );

      setUploadingFiles(prev =>
        prev.map(f => ({ ...f, status: 'complete' as const, progress: 100 }))
      );

      await fetchPhotos();

      setTimeout(() => {
        setShowUploadModal(false);
        setUploadingFiles([]);
        setIsUploading(false);
      }, 1500);
    } catch (err) {
      setUploadingFiles(prev =>
        prev.map(f => ({ ...f, status: 'error' as const }))
      );
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBulkPublish = async (isPublished: boolean) => {
    if (selectedPhotos.size === 0) return;
    try {
      await api.bulkUpdatePhotos(Array.from(selectedPhotos), { isPublished });
      await fetchPhotos();
      setSelectedPhotos(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update photos');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPhotos.size === 0) return;
    if (!confirm(`Delete ${selectedPhotos.size} photo(s)? This cannot be undone.`)) return;

    try {
      await api.bulkDeletePhotos(Array.from(selectedPhotos));
      await fetchPhotos();
      setSelectedPhotos(new Set());
      setShowBulkActions(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photos');
    }
  };

  const handleFeatureToggle = async (id: string, isFeatured: boolean) => {
    try {
      await api.updatePhoto(id, { isFeatured });
      await fetchPhotos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update photo');
    }
  };

  const handlePublishToggle = async (id: string, isPublished: boolean) => {
    try {
      await api.updatePhoto(id, { isPublished });
      await fetchPhotos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update photo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    try {
      await api.deletePhoto(id);
      await fetchPhotos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedPhotoId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedPhotoId || draggedPhotoId === targetId) {
      setDraggedPhotoId(null);
      return;
    }

    const draggedIndex = photos.findIndex(p => p.id === draggedPhotoId);
    const targetIndex = photos.findIndex(p => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newPhotos = [...photos];
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(targetIndex, 0, draggedPhoto);

    setPhotos(newPhotos);

    try {
      await api.reorderPhotos(newPhotos.map(p => p.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder photos');
      fetchPhotos();
    }

    setDraggedPhotoId(null);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  useEffect(() => {
    setShowBulkActions(selectedPhotos.size > 0);
  }, [selectedPhotos.size]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Photos</h1>
          <p className="text-gray-500 mt-1">
            {photos.length} photo{photos.length !== 1 ? 's' : ''} in portfolio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Photos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search photos by title..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
            showFilters || selectedCategory || selectedPublished
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {(selectedCategory || selectedPublished) && (
            <span className="w-2 h-2 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={selectedPublished}
              onChange={e => setSelectedPublished(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSelectedCategory('');
              setSelectedPublished('');
              setSearchQuery('');
            }}
            className="self-end px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear filters
          </button>
        </div>
      )}

      {showBulkActions && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedPhotos.size} selected
          </span>
          <div className="h-4 w-px bg-blue-200" />
          <button
            onClick={() => handleBulkPublish(true)}
            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            <Eye className="w-4 h-4" />
            Publish
          </button>
          <button
            onClick={() => handleBulkPublish(false)}
            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            <EyeOff className="w-4 h-4" />
            Unpublish
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={() => setSelectedPhotos(new Set())}
            className="ml-auto text-sm text-gray-500 hover:text-gray-700"
          >
            Clear selection
          </button>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">No photos found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery || selectedCategory || selectedPublished
              ? 'Try adjusting your filters'
              : 'Upload your first photo to get started'}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={selectedPhotos.size === photos.length && photos.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm text-gray-600">Select all</label>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {photos.map(photo => (
          <div
            key={photo.id}
            draggable
            onDragStart={e => handleDragStart(e, photo.id)}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, photo.id)}
            className={`group relative bg-white rounded-xl border overflow-hidden transition-all cursor-move ${
              draggedPhotoId === photo.id
                ? 'border-blue-500 ring-2 ring-blue-500 opacity-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${selectedPhotos.has(photo.id) ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="aspect-[4/3] bg-gray-100 relative">
              <PhotoThumbnail photo={photo} onPreview={() => setPreviewPhoto(photo)} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div className="absolute top-2 left-2">
                <input
                  type="checkbox"
                  checked={selectedPhotos.has(photo.id)}
                  onChange={() => handleSelectPhoto(photo.id)}
                  onClick={e => e.stopPropagation()}
                  className="w-4 h-4 rounded border-white/50 bg-white/20 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="absolute top-2 right-2 flex gap-1">
                {photo.isFeatured && (
                  <span className="p-1 bg-yellow-500 rounded">
                    <Star className="w-3 h-3 text-white fill-white" />
                  </span>
                )}
                {photo.isPublished ? (
                  <span className="p-1 bg-green-500 rounded">
                    <Eye className="w-3 h-3 text-white" />
                  </span>
                ) : (
                  <span className="p-1 bg-gray-500 rounded">
                    <EyeOff className="w-3 h-3 text-white" />
                  </span>
                )}
              </div>

              <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setPreviewPhoto(photo)}
                  className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                  title="Preview"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFeatureToggle(photo.id, !photo.isFeatured)}
                  className={`p-2 rounded-lg ${
                    photo.isFeatured ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700'
                  }`}
                  title={photo.isFeatured ? 'Remove from featured' : 'Feature on homepage'}
                >
                  <Star className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePublishToggle(photo.id, !photo.isPublished)}
                  className={`p-2 rounded-lg ${
                    photo.isPublished ? 'bg-white text-gray-700' : 'bg-green-500 text-white'
                  }`}
                  title={photo.isPublished ? 'Unpublish' : 'Publish'}
                >
                  {photo.isPublished ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setEditingPhoto(photo)}
                  className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                  title="Edit"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3">
              <h3 className="text-sm font-medium text-gray-900 truncate">{photo.title}</h3>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {photo.categories.slice(0, 2).map(catId => (
                  <span
                    key={catId}
                    className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                  >
                    {getCategoryName(catId)}
                  </span>
                ))}
                {photo.categories.length > 2 && (
                  <span className="text-xs text-gray-400">
                    +{photo.categories.length - 2}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Uploading Photos</h2>
              {!isUploading && (
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadingFiles([]);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-3 gap-4">
                {uploadingFiles.map(file => (
                  <div key={file.id} className="relative">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                      {file.status === 'complete' && (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                      {file.status === 'error' && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <X className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 truncate">{file.file.name}</p>
                      <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            file.status === 'complete'
                              ? 'bg-green-500'
                              : file.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {previewPhoto && (
        <PhotoPreviewModal
          photo={previewPhoto}
          photos={photos}
          onClose={() => setPreviewPhoto(null)}
          onNavigate={setPreviewPhoto}
        />
      )}

      {editingPhoto && (
        <PhotoEditModal
          photo={editingPhoto}
          categories={categories}
          onClose={() => setEditingPhoto(null)}
          onSave={async data => {
            try {
              await api.updatePhoto(editingPhoto.id, data);
              await fetchPhotos();
              setEditingPhoto(null);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to update photo');
            }
          }}
        />
      )}
    </div>
  );
}

interface PhotoThumbnailProps {
  photo: Photo;
  onPreview: () => void;
}

function PhotoThumbnail({ photo, onPreview }: PhotoThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const src = getPhotoSrc(photo);

  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-gray-300" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onPreview}
      className="absolute inset-0 w-full h-full cursor-pointer"
      title="Click to preview"
    >
      <img
        src={src}
        alt={photo.altText || photo.title}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
        draggable={false}
      />
    </button>
  );
}

interface PhotoPreviewModalProps {
  photo: Photo;
  photos: Photo[];
  onClose: () => void;
  onNavigate: (photo: Photo) => void;
}

function PhotoPreviewModal({ photo, photos, onClose, onNavigate }: PhotoPreviewModalProps) {
  const [failed, setFailed] = useState(false);
  const src = getPhotoSrc(photo);
  const currentIndex = photos.findIndex(p => p.id === photo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < photos.length - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(photos[currentIndex - 1]);
      if (e.key === 'ArrowRight' && hasNext) onNavigate(photos[currentIndex + 1]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, hasPrev, hasNext, onClose, onNavigate, photos]);

  useEffect(() => {
    setFailed(false);
  }, [photo.id]);

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
        title="Close"
      >
        <X className="w-6 h-6" />
      </button>

      {hasPrev && (
        <button
          onClick={e => {
            e.stopPropagation();
            onNavigate(photos[currentIndex - 1]);
          }}
          className="absolute left-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
          title="Previous photo"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={e => {
            e.stopPropagation();
            onNavigate(photos[currentIndex + 1]);
          }}
          className="absolute right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
          title="Next photo"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      <div
        className="flex flex-col items-center max-w-[90vw] max-h-[90vh] px-16"
        onClick={e => e.stopPropagation()}
      >
        {src && !failed ? (
          <img
            src={src}
            alt={photo.altText || photo.title}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="w-64 h-48 flex items-center justify-center bg-white/10 rounded-lg">
            <ImageIcon className="w-12 h-12 text-white/40" />
          </div>
        )}
        <div className="mt-4 text-center">
          <h2 className="text-lg font-medium text-white">{photo.title}</h2>
          {photo.altText && (
            <p className="text-sm text-white/60 mt-1 max-w-lg">{photo.altText}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface PhotoEditModalProps {
  photo: Photo;
  categories: Category[];
  onClose: () => void;
  onSave: (data: Partial<Photo>) => Promise<void>;
}

function PhotoEditModal({ photo, categories, onClose, onSave }: PhotoEditModalProps) {
  const [title, setTitle] = useState(photo.title);
  const [altText, setAltText] = useState(photo.altText);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(photo.categories);
  const [isFeatured, setIsFeatured] = useState(photo.isFeatured);
  const [isPublished, setIsPublished] = useState(photo.isPublished);
  const [location, setLocation] = useState(photo.location);
  const [year, setYear] = useState(photo.year);
  const [isSaving, setIsSaving] = useState(false);

  const handleCategoryToggle = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({
      title,
      altText,
      categories: selectedCategories,
      isFeatured,
      isPublished,
      location,
      year,
    });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Edit Photo</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {getPhotoSrc(photo) ? (
              <img
                src={getPhotoSrc(photo)}
                alt={photo.altText || photo.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-gray-300" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alt Text{' '}
              <span className="text-xs font-normal text-gray-400">
                (Important for SEO and accessibility)
              </span>
            </label>
            <textarea
              value={altText}
              onChange={e => setAltText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Describe this image for screen readers and search engines..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryToggle(cat.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    selectedCategories.includes(cat.id)
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tuscany, Italy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="text"
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2024"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={e => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Featured on homepage</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={e => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Published</span>
            </label>
          </div>
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
