import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckSquare,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Square,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { ApiError } from '../api/http';
import type { Category, Photo } from '../types';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {
  AdminAlert,
  AdminButton,
  AdminEmptyState,
  AdminField,
  AdminFilterBar,
  AdminIconButton,
  AdminLoadingState,
  AdminModal,
  AdminPageHeader,
  adminFieldClass,
} from '../components/ui';
import { PhotoEditModal, PhotoPreviewModal } from './PhotosPage';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import {
  filterPhotos,
  getEligibleCoverReplacements,
  getUploadActionLabel,
  getUsedCategoryCounts,
  toggleVisibleSelection,
  setUploadCategoryCover,
  type PhotoStatusFilter,
} from './photos.utils';
import {
  buildFallbackPhotoMetadata,
  buildGeneratedPhotoMetadata,
  getLocalMetadataGenerationCapability,
  type MetadataGenerationStatus,
} from './photoMetadata';
import {
  cancelPhotoCaption,
  generatePhotoCaption,
  resetPhotoCaptionWorker,
} from '../workers/photoMetadataGenerator';

type UploadStatus = 'ready' | 'uploading' | 'complete' | 'error';

interface UploadQueueItem {
  id: string;
  file: File;
  preview: string;
  title: string;
  altText: string;
  categoryId: string;
  width: number;
  height: number;
  isPublished: boolean;
  isCategoryCover: boolean;
  progress: number;
  status: UploadStatus;
  error?: string;
  uploadedPhotoId?: string;
  coverStatus?: 'assigning' | 'complete' | 'error';
  coverError?: string;
  replacementForCategoryId?: string;
  categoryLocked?: boolean;
  metadataStatus: MetadataGenerationStatus;
  metadataProgress: number | null;
  metadataLoadedBytes?: number;
  metadataTotalBytes?: number;
  generatedForCategoryId?: string;
  titleEdited: boolean;
  altEdited: boolean;
  generationWarning?: string;
}

interface CoverConflictCategory {
  id: string;
  name: string;
  currentCoverPhotoId: string;
}

interface PendingCoverOperation {
  action: 'delete' | 'unpublish' | 'setCategories';
  photoIds: string[];
  categoryIds?: string[];
  affectedCategories: CoverConflictCategory[];
  postTransitionPatch?: Partial<Photo>;
  newCoverCategoryIds?: string[];
}

const SUPPORTED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_UPLOAD_SIZE_MB = Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB ?? '25');
const MAX_UPLOAD_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const MODEL_DOWNLOAD_APPROX_MB = 250;
const BUSY_METADATA_STATUSES = new Set<MetadataGenerationStatus>([
  'queued',
  'preparing_model',
  'downloading_model',
  'loading_model',
  'generating',
]);
const MODEL_LOADING_STATUSES = new Set<MetadataGenerationStatus>([
  'preparing_model',
  'downloading_model',
  'loading_model',
]);

function isMetadataBusy(status: MetadataGenerationStatus): boolean {
  return BUSY_METADATA_STATUSES.has(status);
}

function formatMegabytes(bytes: number): string {
  return `${Math.max(0, bytes / 1024 / 1024).toFixed(0)} MB`;
}

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

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      reject(new Error(`Could not read image dimensions for ${file.name}`));
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  });
}

export function PhotosWorkspacePage() {
  const { canManage, isReadOnly } = useFeatureAccess('photos');
  const confirmDialog = useConfirmDialog();
  const localGenerationCapability = useMemo(
    () => getLocalMetadataGenerationCapability(),
    [],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingFilesRef = useRef<UploadQueueItem[]>([]);
  const generationTokensRef = useRef<Map<string, string>>(new Map());
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceCategories, setServiceCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<PhotoStatusFilter>('all');
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [pendingPhotoIds, setPendingPhotoIds] = useState<Set<string>>(new Set());
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [coverOperation, setCoverOperation] = useState<PendingCoverOperation | null>(null);
  const [coverReplacements, setCoverReplacements] = useState<Record<string, string>>({});
  const [isCoverTransitioning, setIsCoverTransitioning] = useState(false);
  const [replacementUploadCategoryId, setReplacementUploadCategoryId] = useState<string | null>(null);

  useEffect(() => {
    uploadingFilesRef.current = uploadingFiles;
  }, [uploadingFiles]);

  useEffect(() => () => {
    generationTokensRef.current.clear();
    uploadingFilesRef.current.forEach(file => URL.revokeObjectURL(file.preview));
    resetPhotoCaptionWorker();
  }, []);

  const fetchPhotos = useCallback(async () => {
    try {
      const [photoData, categoryData, serviceCategoryData] = await Promise.all([
        api.getPhotos(),
        api.getCategories(),
        api.getServiceCategories(),
      ]);
      setPhotos(photoData);
      setCategories(Array.from(new Map(
        [...categoryData, ...serviceCategoryData].map(category => [category.id, category]),
      ).values()).sort((a, b) => a.order - b.order));
      setServiceCategories(serviceCategoryData.sort((a, b) => a.order - b.order));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPhotos();
  }, [fetchPhotos]);

  const categoryCounts = useMemo(() => getUsedCategoryCounts(photos), [photos]);
  const usedCategories = useMemo(
    () => categories.filter(category => (categoryCounts.get(category.id) ?? 0) > 0),
    [categories, categoryCounts],
  );
  const visiblePhotos = useMemo(
    () => filterPhotos(photos, selectedCategory, statusFilter, searchQuery),
    [photos, searchQuery, selectedCategory, statusFilter],
  );
  const publishedCount = photos.filter(photo => photo.isPublished).length;
  const visibleIds = useMemo(() => visiblePhotos.map(photo => photo.id), [visiblePhotos]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedPhotos.has(id));
  const filtersActive = Boolean(selectedCategory || statusFilter !== 'all' || searchQuery.trim());
  const canReorder = !filtersActive;

  useEffect(() => {
    const visible = new Set(visibleIds);
    setSelectedPhotos(previous => {
      const next = new Set([...previous].filter(id => visible.has(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [visibleIds]);

  useEffect(() => {
    if (selectedCategory && !categoryCounts.has(selectedCategory)) setSelectedCategory('');
  }, [categoryCounts, selectedCategory]);

  useEffect(() => {
    if (!canReorder) setReorderMode(false);
  }, [canReorder]);

  const openCoverReplacement = (
    caught: unknown,
    operation: Omit<PendingCoverOperation, 'affectedCategories'>,
  ): boolean => {
    if (!(caught instanceof ApiError) || caught.code !== 'COVER_REPLACEMENT_REQUIRED') return false;
    const affectedCategories = Array.isArray(caught.body.affectedCategories)
      ? caught.body.affectedCategories.flatMap((value): CoverConflictCategory[] => {
          if (!value || typeof value !== 'object') return [];
          const category = value as Record<string, unknown>;
          return typeof category.id === 'string' && typeof category.name === 'string'
            ? [{
                id: category.id,
                name: category.name,
                currentCoverPhotoId: String(category.currentCoverPhotoId ?? ''),
              }]
            : [];
        })
      : [];
    if (!affectedCategories.length) return false;
    setCoverOperation({ ...operation, affectedCategories });
    setCoverReplacements({});
    setEditingPhoto(null);
    setError(null);
    return true;
  };

  const withPhotoPending = async (
    photoId: string,
    action: () => Promise<void>,
    coverContext?: Omit<PendingCoverOperation, 'affectedCategories'>,
  ) => {
    setPendingPhotoIds(previous => new Set(previous).add(photoId));
    try {
      await action();
      await fetchPhotos();
    } catch (caught) {
      if (!coverContext || !openCoverReplacement(caught, coverContext)) {
        setError(caught instanceof Error ? caught.message : 'Failed to update photo');
      }
    } finally {
      setPendingPhotoIds(previous => {
        const next = new Set(previous);
        next.delete(photoId);
        return next;
      });
    }
  };

  const handleBulkPublish = async (isPublished: boolean) => {
    if (!selectedPhotos.size || isBulkWorking) return;
    setIsBulkWorking(true);
    try {
      await api.bulkUpdatePhotos([...selectedPhotos], { isPublished });
      setSelectedPhotos(new Set());
      await fetchPhotos();
    } catch (caught) {
      if (isPublished || !openCoverReplacement(caught, {
        action: 'unpublish',
        photoIds: [...selectedPhotos],
      })) {
        setError(caught instanceof Error ? caught.message : 'Failed to update selected photos');
      }
    } finally {
      setIsBulkWorking(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedPhotos.size || isBulkWorking) return;
    const count = selectedPhotos.size;
    const confirmed = await confirmDialog({
      title: `Delete ${count} ${count === 1 ? 'photo' : 'photos'}?`,
      description: 'The selected photos will be permanently removed. This action cannot be undone.',
      confirmLabel: `Delete ${count === 1 ? 'photo' : 'photos'}`,
      variant: 'danger',
    });
    if (!confirmed) return;
    setIsBulkWorking(true);
    try {
      await api.bulkDeletePhotos([...selectedPhotos]);
      setSelectedPhotos(new Set());
      await fetchPhotos();
    } catch (caught) {
      if (!openCoverReplacement(caught, {
        action: 'delete',
        photoIds: [...selectedPhotos],
      })) {
        setError(caught instanceof Error ? caught.message : 'Failed to delete selected photos');
      }
    } finally {
      setIsBulkWorking(false);
    }
  };

  const handleDelete = async (photo: Photo) => {
    const confirmed = await confirmDialog({
      title: `Delete “${photo.title}”?`,
      description: 'This photo will be permanently removed. This action cannot be undone.',
      confirmLabel: 'Delete photo',
      variant: 'danger',
    });
    if (!confirmed) return;
    await withPhotoPending(
      photo.id,
      () => api.deletePhoto(photo.id),
      { action: 'delete', photoIds: [photo.id] },
    );
  };

  const performOriginalCoverOperation = async (operation: PendingCoverOperation) => {
    if (operation.action === 'delete') {
      await api.bulkDeletePhotos(operation.photoIds);
    } else if (operation.action === 'unpublish') {
      await api.bulkUpdatePhotos(operation.photoIds, { isPublished: false });
      if (operation.postTransitionPatch) {
        await api.updatePhoto(operation.photoIds[0], operation.postTransitionPatch);
      }
    } else {
      await api.updatePhoto(
        operation.photoIds[0],
        operation.postTransitionPatch ?? { categories: operation.categoryIds ?? [] },
      );
    }
  };

  const handleConfirmCoverTransition = async () => {
    if (!coverOperation || isCoverTransitioning) return;
    const replacements = coverOperation.affectedCategories.map(category => ({
      categoryId: category.id,
      photoId: coverReplacements[category.id],
    }));
    if (replacements.some(replacement => !replacement.photoId)) return;
    setIsCoverTransitioning(true);
    try {
      await api.coverTransition({
        photoIds: coverOperation.photoIds,
        action: coverOperation.action,
        categoryIds: coverOperation.categoryIds,
        replacements,
      });
      if (coverOperation.action !== 'delete' && coverOperation.postTransitionPatch) {
        await api.updatePhoto(coverOperation.photoIds[0], coverOperation.postTransitionPatch);
      }
      await Promise.all((coverOperation.newCoverCategoryIds ?? []).map(categoryId =>
        api.setCategoryCover(categoryId, coverOperation.photoIds[0]),
      ));
      setCoverOperation(null);
      setCoverReplacements({});
      setSelectedPhotos(new Set());
      setEditingPhoto(null);
      await fetchPhotos();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not replace the category cover');
    } finally {
      setIsCoverTransitioning(false);
    }
  };

  const beginReplacementUpload = (categoryId: string) => {
    setReplacementUploadCategoryId(categoryId);
    setShowUploadModal(true);
    window.setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleDrop = async (targetId: string) => {
    if (!reorderMode || !draggedPhotoId || draggedPhotoId === targetId) {
      setDraggedPhotoId(null);
      return;
    }
    const draggedIndex = photos.findIndex(photo => photo.id === draggedPhotoId);
    const targetIndex = photos.findIndex(photo => photo.id === targetId);
    if (draggedIndex < 0 || targetIndex < 0) return;
    const previous = photos;
    const reordered = [...photos];
    const [dragged] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, dragged);
    setPhotos(reordered);
    setDraggedPhotoId(null);
    try {
      await api.reorderPhotos(reordered.map(photo => photo.id));
    } catch (caught) {
      setPhotos(previous);
      setError(caught instanceof Error ? caught.message : 'Failed to reorder photos');
    }
  };

  const addUploadFiles = async (files: File[]) => {
    if (!files.length) return;
    const selectedFiles = replacementUploadCategoryId ? files.slice(0, 1) : files;
    const invalidType = selectedFiles.find(file => !SUPPORTED_UPLOAD_TYPES.includes(file.type));
    if (invalidType) {
      setUploadError(`${invalidType.name}: only JPEG, PNG, WebP and AVIF are supported.`);
      setShowUploadModal(true);
      return;
    }
    const tooLarge = selectedFiles.find(file => file.size > MAX_UPLOAD_SIZE);
    if (tooLarge) {
      setUploadError(`${tooLarge.name}: maximum upload size is ${MAX_UPLOAD_SIZE_MB} MB.`);
      setShowUploadModal(true);
      return;
    }
    try {
      const dimensions = await Promise.all(selectedFiles.map(readImageDimensions));
      const timestamp = Date.now();
      setUploadingFiles(previous => [
        ...previous,
        ...selectedFiles.map((file, index): UploadQueueItem => ({
          id: `${timestamp}-${index}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          preview: URL.createObjectURL(file),
          title: '',
          altText: '',
          categoryId: replacementUploadCategoryId ?? '',
          width: dimensions[index].width,
          height: dimensions[index].height,
          isPublished: true,
          isCategoryCover: Boolean(replacementUploadCategoryId),
          progress: 0,
          status: 'ready',
          metadataStatus: replacementUploadCategoryId ? 'generation_available' : 'waiting_for_category',
          metadataProgress: null,
          titleEdited: false,
          altEdited: false,
          replacementForCategoryId: replacementUploadCategoryId ?? undefined,
          categoryLocked: Boolean(replacementUploadCategoryId),
        })),
      ]);
      setUploadError(replacementUploadCategoryId && files.length > 1
        ? 'Choose one replacement cover at a time. Only the first selected file was added.'
        : null);
      setReplacementUploadCategoryId(null);
      setValidationAttempted(false);
      setShowUploadModal(true);
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : 'Could not inspect selected images');
      setShowUploadModal(true);
    }
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await addUploadFiles(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  const updateUploadFile = (id: string, patch: Partial<UploadQueueItem>) => {
    setUploadingFiles(previous => previous.map(file => file.id === id ? { ...file, ...patch } : file));
  };

  const handleUploadCoverChange = (fileId: string, selected: boolean) => {
    setUploadingFiles(previous => setUploadCategoryCover(previous, fileId, selected));
  };

  const generateMetadataForFile = useCallback(async (fileId: string, categoryId: string) => {
    const item = uploadingFilesRef.current.find(file => file.id === fileId);
    const category = serviceCategories.find(option => option.id === categoryId);
    if (!item || !categoryId || !category) return;

    const token = `${fileId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    generationTokensRef.current.set(fileId, token);
    setUploadingFiles(previous => previous.map(file => file.id === fileId
      ? {
          ...file,
          metadataStatus: 'queued',
          metadataProgress: null,
          metadataLoadedBytes: undefined,
          metadataTotalBytes: undefined,
          generationWarning: undefined,
        }
      : file));

    try {
      const caption = await generatePhotoCaption(token, item.file, progress => {
        if (generationTokensRef.current.get(fileId) !== token) return;
        setUploadingFiles(previous => previous.map(file => file.id === fileId
          ? {
              ...file,
              metadataStatus: progress.stage,
              metadataProgress: progress.progress ?? null,
              metadataLoadedBytes: 'loadedBytes' in progress ? progress.loadedBytes : undefined,
              metadataTotalBytes: 'totalBytes' in progress ? progress.totalBytes : undefined,
            }
          : file));
      });
      if (generationTokensRef.current.get(fileId) !== token) return;
      const { warning, ...metadata } = buildGeneratedPhotoMetadata(caption, category.name, item.file.name);
      setUploadingFiles(previous => previous.map(file =>
        file.id === fileId && file.categoryId === categoryId
          ? {
              ...file,
              ...metadata,
              metadataStatus: warning ? 'fallback' : 'generated',
              metadataProgress: 100,
              metadataLoadedBytes: undefined,
              metadataTotalBytes: undefined,
              generatedForCategoryId: categoryId,
              titleEdited: false,
              altEdited: false,
              generationWarning: warning,
            }
          : file,
      ));
    } catch (caught) {
      if (generationTokensRef.current.get(fileId) !== token) return;
      const fallback = buildFallbackPhotoMetadata(category.name, item.file.name);
      setUploadingFiles(previous => previous.map(file =>
        file.id === fileId && file.categoryId === categoryId
          ? {
              ...file,
              ...fallback,
              metadataStatus: 'fallback',
              metadataProgress: 100,
              metadataLoadedBytes: undefined,
              metadataTotalBytes: undefined,
              generatedForCategoryId: categoryId,
              titleEdited: false,
              altEdited: false,
              generationWarning: `Local generation was unavailable. Safe fallback text was added${caught instanceof Error && caught.message ? `: ${caught.message}` : '.'}`,
            }
          : file,
      ));
    } finally {
      if (generationTokensRef.current.get(fileId) === token) {
        generationTokensRef.current.delete(fileId);
      }
    }
  }, [serviceCategories]);

  useEffect(() => {
    if (!localGenerationCapability.automatic) return;
    const preselected = uploadingFiles.find(file =>
      file.categoryId
      && file.metadataStatus === 'generation_available'
      && file.replacementForCategoryId
      && !generationTokensRef.current.has(file.id)
    );
    if (preselected) void generateMetadataForFile(preselected.id, preselected.categoryId);
  }, [generateMetadataForFile, localGenerationCapability.automatic, uploadingFiles]);

  const handleUploadCategoryChange = (fileId: string, categoryId: string) => {
    const item = uploadingFilesRef.current.find(file => file.id === fileId);
    if (!item) return;
    const activeToken = generationTokensRef.current.get(fileId);
    generationTokensRef.current.delete(fileId);
    if (activeToken) cancelPhotoCaption(activeToken);
    const hasManualMetadata = item.titleEdited || item.altEdited;
    const shouldGenerate = Boolean(categoryId && !hasManualMetadata && localGenerationCapability.automatic);
    setUploadingFiles(previous => previous.map(file => file.id === fileId
      ? {
          ...file,
          categoryId,
          isCategoryCover: false,
          metadataStatus: !categoryId
            ? (hasManualMetadata ? 'manually_edited' : 'waiting_for_category')
            : (hasManualMetadata ? 'manually_edited' : shouldGenerate ? 'queued' : 'generation_available'),
          metadataProgress: null,
          metadataLoadedBytes: undefined,
          metadataTotalBytes: undefined,
          ...(!hasManualMetadata ? { title: '', altText: '' } : {}),
          generatedForCategoryId: undefined,
          generationWarning: hasManualMetadata && categoryId
            ? 'Category changed. Your edited text was kept; regenerate if you want new suggestions.'
            : undefined,
        }
      : file));
    if (shouldGenerate) void generateMetadataForFile(fileId, categoryId);
  };

  const handleMetadataEdit = (fileId: string, field: 'title' | 'altText', value: string) => {
    const activeToken = generationTokensRef.current.get(fileId);
    generationTokensRef.current.delete(fileId);
    if (activeToken) cancelPhotoCaption(activeToken);
    setUploadingFiles(previous => previous.map(file => file.id === fileId
      ? {
          ...file,
          [field]: value,
          ...(field === 'title' ? { titleEdited: true } : { altEdited: true }),
          metadataStatus: 'manually_edited',
          metadataProgress: 100,
          generationWarning: undefined,
        }
      : file));
  };

  const handleRegenerateMetadata = async (fileId: string) => {
    const item = uploadingFilesRef.current.find(file => file.id === fileId);
    if (!item?.categoryId) return;
    if (item.titleEdited || item.altEdited) {
      const confirmed = await confirmDialog({
        title: 'Replace edited photo details?',
        description: 'Regenerating will replace the current title and alt text with new local suggestions.',
        confirmLabel: 'Regenerate details',
      });
      if (!confirmed) return;
    }
    setUploadingFiles(previous => previous.map(file => file.id === fileId
      ? { ...file, titleEdited: false, altEdited: false }
      : file));
    await generateMetadataForFile(fileId, item.categoryId);
  };

  const handleUseSafeDetails = (fileId: string, explanation = 'Safe details were created without using the local caption model.') => {
    const item = uploadingFilesRef.current.find(file => file.id === fileId);
    if (!item?.categoryId) return;
    const activeToken = generationTokensRef.current.get(fileId);
    generationTokensRef.current.delete(fileId);
    if (activeToken) cancelPhotoCaption(activeToken);
    const fallback = buildFallbackPhotoMetadata(
      serviceCategories.find(category => category.id === item.categoryId)?.name ?? 'Portfolio',
      item.file.name,
    );
    setUploadingFiles(previous => previous.map(file => file.id === fileId
      ? {
          ...file,
          ...fallback,
          metadataStatus: 'fallback',
          metadataProgress: 100,
          metadataLoadedBytes: undefined,
          metadataTotalBytes: undefined,
          generatedForCategoryId: item.categoryId,
          titleEdited: false,
          altEdited: false,
          generationWarning: explanation,
        }
      : file));
  };

  const handleUseSafeDetailsForBusyPhotos = () => {
    uploadingFilesRef.current
      .filter(file => isMetadataBusy(file.metadataStatus))
      .forEach(file => handleUseSafeDetails(file.id));
  };

  const removeUploadFile = (id: string) => {
    const activeToken = generationTokensRef.current.get(id);
    generationTokensRef.current.delete(id);
    if (activeToken) cancelPhotoCaption(activeToken);
    const item = uploadingFiles.find(file => file.id === id);
    if (item) URL.revokeObjectURL(item.preview);
    setUploadingFiles(previous => previous.filter(file => file.id !== id));
  };

  const closeUpload = () => {
    if (isUploading) return;
    const wasReplacementUpload = Boolean(
      replacementUploadCategoryId || uploadingFiles.some(file => file.replacementForCategoryId),
    );
    uploadingFiles.forEach(file => URL.revokeObjectURL(file.preview));
    generationTokensRef.current.clear();
    resetPhotoCaptionWorker();
    setUploadingFiles([]);
    setUploadError(null);
    setValidationAttempted(false);
    setShowUploadModal(false);
    setReplacementUploadCategoryId(null);
    if (wasReplacementUpload) {
      setCoverOperation(null);
      setCoverReplacements({});
    }
  };

  const resumePendingCoverOperation = async (operation: PendingCoverOperation) => {
    uploadingFilesRef.current.forEach(file => URL.revokeObjectURL(file.preview));
    setUploadingFiles([]);
    setShowUploadModal(false);
    setUploadError(null);
    try {
      await performOriginalCoverOperation(operation);
      await Promise.all((operation.newCoverCategoryIds ?? []).map(categoryId =>
        api.setCategoryCover(categoryId, operation.photoIds[0]),
      ));
      setCoverOperation(null);
      setCoverReplacements({});
      setSelectedPhotos(new Set());
      setEditingPhoto(null);
      await fetchPhotos();
    } catch (caught) {
      if (!openCoverReplacement(caught, {
        action: operation.action,
        photoIds: operation.photoIds,
        categoryIds: operation.categoryIds,
        postTransitionPatch: operation.postTransitionPatch,
        newCoverCategoryIds: operation.newCoverCategoryIds,
      })) {
        setCoverOperation(null);
        setError(caught instanceof Error ? caught.message : 'The original photo action could not be resumed');
      }
    }
  };

  const handleUpload = async () => {
    const pending = uploadingFiles.filter(file => file.status !== 'complete');
    const metadataBusy = pending.some(file => isMetadataBusy(file.metadataStatus));
    if (!pending.length || isUploading || metadataBusy) return;
    const incomplete = pending.some(file => !file.title.trim() || !file.altText.trim() || !file.categoryId);
    if (incomplete) {
      setValidationAttempted(true);
      setUploadError('Complete the highlighted fields before uploading.');
      return;
    }
    setValidationAttempted(false);
    setUploadError(null);
    setIsUploading(true);
    setUploadingFiles(previous => previous.map(file =>
      file.status === 'complete' ? file : { ...file, status: 'uploading', progress: 0, error: undefined },
    ));

    try {
      const results = await api.uploadFiles(
        pending.map(file => ({
          clientId: file.id,
          file: file.file,
          title: file.title.trim(),
          altText: file.altText.trim(),
          categoryId: file.categoryId,
          width: file.width,
          height: file.height,
          isPublished: file.isPublished,
          isCategoryCover: file.isCategoryCover,
        })),
        (clientId, progress) => updateUploadFile(clientId, { progress }),
      );
      setUploadingFiles(previous => previous.map(file => {
        const result = results.find(item => item.clientId === file.id);
        if (!result) return file;
        return result.status === 'complete'
          ? {
              ...file,
              status: 'complete',
              progress: 100,
              error: undefined,
              uploadedPhotoId: result.photo.id,
              coverStatus: result.coverStatus,
              coverError: result.coverError,
            }
          : { ...file, status: 'error', error: result.error };
      }));
      const failed = results.filter(result => result.status === 'error').length;
      const coverFailed = results.filter(result => result.status === 'complete' && result.coverStatus === 'error').length;
      if (failed) {
        setUploadError(`${failed} ${failed === 1 ? 'photo' : 'photos'} could not be uploaded. Fix the issue and retry failed uploads.`);
      } else if (coverFailed) {
        setUploadError(`${coverFailed} ${coverFailed === 1 ? 'photo was' : 'photos were'} uploaded, but the category cover could not be updated. Retry the cover update below.`);
      }
      await fetchPhotos();
      const completedReplacement = results.find(result => {
        if (result.status !== 'complete' || result.coverStatus !== 'complete') return false;
        return pending.some(file => file.id === result.clientId && file.replacementForCategoryId);
      });
      if (completedReplacement && coverOperation) {
        await resumePendingCoverOperation(coverOperation);
      }
    } catch (caught) {
      setUploadingFiles(previous => previous.map(file =>
        file.status === 'uploading'
          ? { ...file, status: 'error', error: caught instanceof Error ? caught.message : 'Upload failed' }
          : file,
      ));
      setUploadError(caught instanceof Error ? caught.message : 'The upload could not be completed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetryCoverUpdate = async (fileId: string) => {
    const item = uploadingFilesRef.current.find(file => file.id === fileId);
    if (!item?.uploadedPhotoId || !item.categoryId) return;
    updateUploadFile(fileId, { coverStatus: 'assigning', coverError: undefined });
    try {
      await api.setCategoryCover(item.categoryId, item.uploadedPhotoId);
      updateUploadFile(fileId, { coverStatus: 'complete', coverError: undefined });
      setUploadError(null);
      await fetchPhotos();
      if (item.replacementForCategoryId && coverOperation) {
        await resumePendingCoverOperation(coverOperation);
      }
    } catch (caught) {
      updateUploadFile(fileId, {
        coverStatus: 'error',
        coverError: caught instanceof Error ? caught.message : 'Category cover update failed',
      });
    }
  };

  const pendingUploads = uploadingFiles.filter(file => file.status !== 'complete');
  const completeUploads = uploadingFiles.length - pendingUploads.length;
  const publishCount = pendingUploads.filter(file => file.isPublished).length;
  const uploadActionLabel = getUploadActionLabel(pendingUploads.length, publishCount);
  const metadataBusy = pendingUploads.some(file => isMetadataBusy(file.metadataStatus));
  const modelLoadingItem = pendingUploads.find(file => MODEL_LOADING_STATUSES.has(file.metadataStatus));
  const modelProgressText = modelLoadingItem
    ? modelLoadingItem.metadataLoadedBytes !== undefined && modelLoadingItem.metadataTotalBytes !== undefined
      ? `${formatMegabytes(modelLoadingItem.metadataLoadedBytes)} of ${formatMegabytes(modelLoadingItem.metadataTotalBytes)}`
      : modelLoadingItem.metadataProgress !== null
        ? `${modelLoadingItem.metadataProgress}% · about ${Math.round(MODEL_DOWNLOAD_APPROX_MB * modelLoadingItem.metadataProgress / 100)} MB of ~${MODEL_DOWNLOAD_APPROX_MB} MB`
        : 'Calculating download progress…'
    : '';
  const modelLoadingLabel = modelLoadingItem?.metadataStatus === 'preparing_model'
    ? 'Preparing local generator'
    : modelLoadingItem?.metadataStatus === 'downloading_model'
      ? 'Downloading local caption model'
      : 'Loading model into memory';

  if (isLoading) return <AdminLoadingState label="Loading portfolio photos…" />;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Portfolio library"
        title="Photos"
        description={`${photos.length} photos · ${publishedCount} published · ${photos.length - publishedCount} drafts`}
        actions={canManage ? (
          <>
            <AdminButton
              type="button"
              variant={reorderMode ? 'secondary' : 'quiet'}
              disabled={!canReorder}
              onClick={() => {
                setReorderMode(previous => !previous);
                setSelectedPhotos(new Set());
              }}
              title={canReorder ? undefined : 'Clear category, status and search filters to reorder'}
            >
              <GripVertical className="h-4 w-4" />
              {reorderMode ? 'Finish reordering' : 'Reorder'}
            </AdminButton>
            <AdminButton type="button" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Upload photos
            </AdminButton>
          </>
        ) : isReadOnly ? <ReadOnlyNotice /> : undefined}
      />

      {canManage && <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />}

      {error && (
        <div className="relative">
          <AdminAlert>{error}</AdminAlert>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="absolute right-3 top-3 rounded-lg p-1 text-red-700 hover:bg-red-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <section aria-label="Photo categories" className="overflow-hidden rounded-2xl border border-admin-border bg-admin-surface shadow-sm">
        <div className="overflow-x-auto p-2">
          <div className="flex min-w-max gap-1" role="tablist">
            <CategoryTab active={!selectedCategory} count={photos.length} label="All photos" onClick={() => setSelectedCategory('')} />
            {usedCategories.map(category => (
              <CategoryTab
                key={category.id}
                active={selectedCategory === category.id}
                count={categoryCounts.get(category.id) ?? 0}
                label={category.name}
                onClick={() => setSelectedCategory(category.id)}
              />
            ))}
          </div>
        </div>
      </section>

      <AdminFilterBar className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-subtle" />
            <input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search title, description, location or year"
              aria-label="Search photos"
              className={`${adminFieldClass} mt-0 pl-10 pr-10`}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-admin-subtle hover:bg-admin-muted">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 rounded-xl bg-admin-muted p-1" aria-label="Publishing status">
            {(['all', 'published', 'draft'] as const).map(status => (
              <button
                key={status}
                type="button"
                aria-pressed={statusFilter === status}
                onClick={() => setStatusFilter(status)}
                className={`min-h-9 rounded-lg px-3 text-sm font-semibold capitalize transition ${statusFilter === status ? 'bg-admin-surface text-admin-text shadow-sm' : 'text-admin-secondary hover:text-admin-text'}`}
              >
                {status === 'all' ? 'All status' : status === 'draft' ? 'Drafts' : 'Published'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-admin-border pt-3 text-sm">
          <span className="text-admin-subtle">Showing <strong className="text-admin-text">{visiblePhotos.length}</strong> of {photos.length}</span>
          {canManage && !reorderMode && visiblePhotos.length > 0 && (
            <button type="button" onClick={() => setSelectedPhotos(previous => toggleVisibleSelection(previous, visibleIds))} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 font-semibold text-admin-secondary hover:bg-admin-muted hover:text-admin-text">
              {allVisibleSelected ? <CheckSquare className="h-5 w-5 text-admin-primary" /> : <Square className="h-5 w-5" />}
              {allVisibleSelected ? 'Clear visible selection' : `Select all ${visiblePhotos.length} visible`}
            </button>
          )}
        </div>
      </AdminFilterBar>

      {canManage && selectedPhotos.size > 0 && !reorderMode && (
        <div className="sticky top-3 z-30 flex flex-wrap items-center gap-2 rounded-2xl border border-admin-primary/30 bg-admin-surface p-3 shadow-lg">
          <span className="mr-2 text-sm font-semibold text-admin-text">{selectedPhotos.size} selected</span>
          <AdminButton type="button" variant="secondary" disabled={isBulkWorking} onClick={() => void handleBulkPublish(true)}><Eye className="h-4 w-4" /> Publish</AdminButton>
          <AdminButton type="button" variant="secondary" disabled={isBulkWorking} onClick={() => void handleBulkPublish(false)}><EyeOff className="h-4 w-4" /> Unpublish</AdminButton>
          <AdminButton type="button" variant="danger" disabled={isBulkWorking} onClick={() => void handleBulkDelete()}><Trash2 className="h-4 w-4" /> Delete</AdminButton>
          <button type="button" disabled={isBulkWorking} onClick={() => setSelectedPhotos(new Set())} className="ml-auto min-h-10 rounded-xl px-3 text-sm font-semibold text-admin-secondary hover:bg-admin-muted">Clear selection</button>
        </div>
      )}

      {canManage && reorderMode && (
        <AdminAlert tone="info">Drag photos using their handles. Reordering is available only in the unfiltered All Photos view.</AdminAlert>
      )}

      {visiblePhotos.length === 0 ? (
        <AdminEmptyState
          icon={ImageIcon}
          title="No photos match this view"
          description={filtersActive ? 'Try another category, publishing status, or search.' : 'Upload your first portfolio photo.'}
          action={filtersActive
            ? <AdminButton type="button" variant="secondary" onClick={() => { setSelectedCategory(''); setStatusFilter('all'); setSearchQuery(''); }}>Clear filters</AdminButton>
            : canManage ? <AdminButton type="button" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> Upload photos</AdminButton> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visiblePhotos.map(photo => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              categoryNames={categories}
              selected={selectedPhotos.has(photo.id)}
              pending={pendingPhotoIds.has(photo.id)}
              reorderMode={reorderMode}
              canManage={canManage}
              dragging={draggedPhotoId === photo.id}
              onSelect={() => setSelectedPhotos(previous => {
                const next = new Set(previous);
                if (next.has(photo.id)) next.delete(photo.id);
                else next.add(photo.id);
                return next;
              })}
              onPreview={() => setPreviewPhoto(photo)}
              onEdit={() => setEditingPhoto(photo)}
              onPublish={() => void withPhotoPending(
                photo.id,
                () => api.updatePhoto(photo.id, { isPublished: !photo.isPublished }).then(() => undefined),
                photo.isPublished ? { action: 'unpublish', photoIds: [photo.id] } : undefined,
              )}
              onFeature={() => void withPhotoPending(photo.id, () => api.updatePhoto(photo.id, { isFeatured: !photo.isFeatured }).then(() => undefined))}
              onDelete={() => void handleDelete(photo)}
              onDragStart={event => { setDraggedPhotoId(photo.id); event.dataTransfer.effectAllowed = 'move'; }}
              onDrop={() => void handleDrop(photo.id)}
            />
          ))}
        </div>
      )}

      {canManage && <AdminModal
        open={showUploadModal}
        title={isUploading ? 'Uploading photos' : uploadingFiles.length ? 'Review and publish' : 'Choose photos'}
        description="Add details and decide which photos should appear on the website."
        onClose={closeUpload}
        maxWidth="max-w-6xl"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-admin-subtle">
              {completeUploads > 0 && <span className="font-semibold text-emerald-700">{completeUploads} uploaded</span>}
              {completeUploads > 0 && pendingUploads.length > 0 && <span> · </span>}
              {pendingUploads.length > 0 && <span>{pendingUploads.length} remaining</span>}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <AdminButton type="button" variant="secondary" disabled={isUploading} onClick={closeUpload}>{pendingUploads.length ? 'Cancel' : 'Done'}</AdminButton>
              {pendingUploads.length > 0 && (
                <AdminButton type="button" disabled={isUploading || metadataBusy} onClick={() => void handleUpload()}>
                  {isUploading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                    : metadataBusy
                      ? <><Sparkles className="h-4 w-4" /> Generating details…</>
                      : pendingUploads.every(file => file.status === 'error')
                        ? <><RotateCcw className="h-4 w-4" /> Retry failed uploads</>
                        : <><Upload className="h-4 w-4" /> {uploadActionLabel}</>}
                </AdminButton>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2" aria-label="Upload steps">
            {['Choose', 'Review', 'Upload'].map((step, index) => {
              const active = index === 0 ? uploadingFiles.length > 0 : index === 1 ? uploadingFiles.length > completeUploads : completeUploads > 0;
              return <div key={step} className={`rounded-xl px-3 py-2 text-center text-xs font-bold uppercase tracking-wider ${active ? 'bg-admin-primary text-white' : 'bg-admin-muted text-admin-subtle'}`}>{index + 1}. {step}</div>;
            })}
          </div>

          {uploadError && <AdminAlert>{uploadError}</AdminAlert>}

          <AdminAlert tone="info">
            <span className="inline-flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Generated on this device</span>
            <span className="ml-1">— your photo is not sent to an AI service. First use downloads approximately {MODEL_DOWNLOAD_APPROX_MB} MB from the model provider; the browser caches it for faster future sessions.</span>
          </AdminAlert>

          {!localGenerationCapability.automatic && (
            <AdminAlert tone="warning">
              Automatic generation is paused because {localGenerationCapability.reasons.join(', ')}. Choose <strong>Generate locally</strong> for a photo, or use safe details without downloading the model.
            </AdminAlert>
          )}

          {modelLoadingItem && (
            <div className="rounded-xl border border-admin-border bg-admin-muted p-3" role="status">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-admin-secondary">
                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-admin-primary" /> {modelLoadingLabel}</span>
                <span>{modelProgressText}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-admin-surface">
                <div
                  className={`h-full bg-admin-primary transition-all ${modelLoadingItem.metadataProgress === null ? 'w-1/3 animate-pulse' : ''}`}
                  style={modelLoadingItem.metadataProgress === null ? undefined : { width: `${modelLoadingItem.metadataProgress}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-admin-subtle">
                <span>The download continues only while this upload window is open.</span>
                <AdminButton type="button" variant="quiet" className="px-3" onClick={handleUseSafeDetailsForBusyPhotos}>Cancel and use safe details</AdminButton>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-admin-border bg-admin-muted p-3">
            <div>
              <p className="text-sm font-semibold text-admin-text">{uploadingFiles.length} {uploadingFiles.length === 1 ? 'photo' : 'photos'} selected</p>
              <p className="text-xs text-admin-subtle">JPEG, PNG, WebP or AVIF · up to {MAX_UPLOAD_SIZE_MB} MB each</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AdminButton type="button" variant="secondary" disabled={isUploading} onClick={() => fileInputRef.current?.click()}><Plus className="h-4 w-4" /> Add more</AdminButton>
              {pendingUploads.length > 0 && <>
                <AdminButton type="button" variant="quiet" disabled={isUploading} onClick={() => setUploadingFiles(previous => previous.map(file => file.status === 'complete' ? file : { ...file, isPublished: true }))}>Publish all</AdminButton>
                <AdminButton type="button" variant="quiet" disabled={isUploading} onClick={() => setUploadingFiles(previous => previous.map(file => file.status === 'complete' ? file : { ...file, isPublished: false, isCategoryCover: false }))}>Save all as drafts</AdminButton>
              </>}
            </div>
          </div>

          {uploadingFiles.length === 0 ? (
            <AdminEmptyState icon={Upload} title="Choose photos to upload" description="Select one or several portfolio images to begin." action={<AdminButton type="button" onClick={() => fileInputRef.current?.click()}><Plus className="h-4 w-4" /> Choose photos</AdminButton>} />
          ) : (
            <div className="space-y-4">
              {uploadingFiles.map(file => (
                <UploadReviewCard
                  key={file.id}
                  item={file}
                  categories={serviceCategories}
                  currentCoverPhoto={photos.find(photo => photo.id === serviceCategories.find(category => category.id === file.categoryId)?.coverPhotoId)}
                  disabled={isUploading || file.status === 'complete'}
                  showValidation={validationAttempted}
                  onChange={patch => updateUploadFile(file.id, patch.isPublished === false ? { ...patch, isCategoryCover: false } : patch)}
                  onCategoryChange={categoryId => handleUploadCategoryChange(file.id, categoryId)}
                  onCoverChange={selected => handleUploadCoverChange(file.id, selected)}
                  onTitleChange={title => handleMetadataEdit(file.id, 'title', title)}
                  onAltTextChange={altText => handleMetadataEdit(file.id, 'altText', altText)}
                  onRegenerate={() => void handleRegenerateMetadata(file.id)}
                  onUseFallback={() => handleUseSafeDetails(file.id)}
                  onRetryCover={() => void handleRetryCoverUpdate(file.id)}
                  onRemove={() => removeUploadFile(file.id)}
                />
              ))}
            </div>
          )}
        </div>
      </AdminModal>}

      {canManage && <AdminModal
        open={Boolean(coverOperation) && !showUploadModal}
        title="Select replacement category covers"
        description="These photos are currently used at the top of public service pages. Every affected category needs a published replacement before the action can continue."
        onClose={() => {
          if (isCoverTransitioning) return;
          setCoverOperation(null);
          setCoverReplacements({});
        }}
        maxWidth="max-w-4xl"
        footer={coverOperation ? (
          <div className="flex flex-wrap justify-end gap-2">
            <AdminButton type="button" variant="secondary" disabled={isCoverTransitioning} onClick={() => { setCoverOperation(null); setCoverReplacements({}); }}>Cancel</AdminButton>
            <AdminButton
              type="button"
              disabled={isCoverTransitioning || coverOperation.affectedCategories.some(category => !coverReplacements[category.id])}
              onClick={() => void handleConfirmCoverTransition()}
            >
              {isCoverTransitioning
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating covers…</>
                : `Replace covers and ${coverOperation.action === 'delete' ? 'delete' : coverOperation.action === 'unpublish' ? 'unpublish' : 'save categories'}`}
            </AdminButton>
          </div>
        ) : undefined}
      >
        {coverOperation && (
          <div className="space-y-5">
            {coverOperation.affectedCategories.map(category => {
              const candidates = getEligibleCoverReplacements(photos, category.id, coverOperation.photoIds);
              return (
                <section key={category.id} className="rounded-2xl border border-admin-border p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-admin-text">{category.name} cover</h3>
                    <p className="mt-1 text-sm text-admin-subtle">Choose the new image shown at the top of the {category.name} service page.</p>
                  </div>
                  {candidates.length ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {candidates.map(photo => {
                        const selected = coverReplacements[category.id] === photo.id;
                        return (
                          <button
                            key={photo.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setCoverReplacements(previous => ({ ...previous, [category.id]: photo.id }))}
                            className={`overflow-hidden rounded-xl border-2 text-left transition ${selected ? 'border-admin-primary ring-2 ring-admin-primary/20' : 'border-admin-border hover:border-admin-border-strong'}`}
                          >
                            <img src={getPhotoSrc(photo)} alt={photo.altText || photo.title} className="aspect-[4/3] w-full object-cover" />
                            <span className="block truncate px-3 py-2 text-sm font-semibold text-admin-text">{photo.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <AdminAlert tone="warning">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span>No other published {category.name} photo is available.</span>
                        <AdminButton type="button" variant="secondary" onClick={() => beginReplacementUpload(category.id)}><Upload className="h-4 w-4" /> Upload replacement</AdminButton>
                      </div>
                    </AdminAlert>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </AdminModal>}

      {previewPhoto && <PhotoPreviewModal photo={previewPhoto} photos={visiblePhotos} onClose={() => setPreviewPhoto(null)} onNavigate={setPreviewPhoto} />}
      {canManage && editingPhoto && (
        <PhotoEditModal
          photo={editingPhoto}
          categories={categories}
          onClose={() => setEditingPhoto(null)}
          onSave={async (data, coverCategoryIds) => {
            try {
              await api.updatePhoto(editingPhoto.id, data);
              await Promise.all(coverCategoryIds.map(categoryId => api.setCategoryCover(categoryId, editingPhoto.id)));
              await fetchPhotos();
            } catch (caught) {
              if (!openCoverReplacement(caught, {
                action: data.isPublished === false ? 'unpublish' : 'setCategories',
                photoIds: [editingPhoto.id],
                categoryIds: data.isPublished === false ? undefined : data.categories,
                postTransitionPatch: data,
                newCoverCategoryIds: coverCategoryIds,
              })) {
                setError(caught instanceof Error ? caught.message : 'Failed to update photo');
                throw caught;
              }
            }
          }}
          onSaveImage={async transform => {
            const updated = await api.updatePhotoTransform(editingPhoto.id, transform);
            await fetchPhotos();
            setEditingPhoto(updated);
          }}
        />
      )}
    </div>
  );
}

function CategoryTab({ active, count, label, onClick }: { active: boolean; count: number; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${active ? 'bg-admin-primary text-white shadow-sm' : 'text-admin-secondary hover:bg-admin-muted hover:text-admin-text'}`}
    >
      {label}
      <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/20 text-white' : 'bg-admin-muted text-admin-subtle'}`}>{count}</span>
    </button>
  );
}

function PhotoCard({
  photo,
  categoryNames,
  selected,
  pending,
  reorderMode,
  canManage,
  dragging,
  onSelect,
  onPreview,
  onEdit,
  onPublish,
  onFeature,
  onDelete,
  onDragStart,
  onDrop,
}: {
  photo: Photo;
  categoryNames: Category[];
  selected: boolean;
  pending: boolean;
  reorderMode: boolean;
  canManage: boolean;
  dragging: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onFeature: () => void;
  onDelete: () => void;
  onDragStart: (event: React.DragEvent) => void;
  onDrop: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const source = getPhotoSrc(photo);
  const categoryLabel = photo.categories
    .map(categoryId => categoryNames.find(category => category.id === categoryId)?.name)
    .filter(Boolean)
    .join(' · ');
  const coverCategories = categoryNames.filter(category => category.coverPhotoId === photo.id);

  return (
    <article
      draggable={canManage && reorderMode}
      onDragStart={onDragStart}
      onDragOver={event => { if (reorderMode) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }}
      onDrop={event => { event.preventDefault(); onDrop(); }}
      className={`group overflow-hidden rounded-2xl border bg-admin-surface shadow-sm transition ${selected ? 'border-admin-primary ring-2 ring-admin-primary/30' : 'border-admin-border hover:border-admin-border-strong'} ${dragging ? 'scale-[0.98] opacity-50' : ''}`}
    >
      <div className="relative aspect-[4/3] bg-admin-muted">
        <button type="button" onClick={onPreview} className="absolute inset-0 h-full w-full overflow-hidden text-admin-subtle" aria-label={`Preview ${photo.title}`}>
          {source && !imageFailed
            ? <img src={source} alt={photo.altText || photo.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" onError={() => setImageFailed(true)} draggable={false} />
            : <span className="flex h-full items-center justify-center"><ImageIcon className="h-9 w-9" /></span>}
        </button>

        {canManage && reorderMode ? (
          <span className="absolute left-3 top-3 flex h-11 items-center gap-2 rounded-xl bg-stone-950/75 px-3 text-sm font-semibold text-white shadow-lg"><GripVertical className="h-5 w-5" /> Drag</span>
        ) : canManage ? (
          <button type="button" role="checkbox" aria-checked={selected} onClick={onSelect} className={`absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl border-2 shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-focus ${selected ? 'border-admin-primary bg-admin-primary text-white' : 'border-white bg-white/95 text-admin-secondary hover:text-admin-primary'}`} aria-label={`${selected ? 'Deselect' : 'Select'} ${photo.title}`}>
            {selected ? <Check className="h-5 w-5" /> : <Square className="h-5 w-5" />}
          </button>
        ) : null}

        <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5">
          {coverCategories.map(category => <span key={category.id} className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-1 text-xs font-bold text-white shadow"><ImageIcon className="h-3 w-3" /> {category.name} cover</span>)}
          {photo.isFeatured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow"><Star className="h-3 w-3 fill-current" /> Homepage featured</span>}
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow ${photo.isPublished ? 'bg-emerald-600' : 'bg-stone-600'}`}>
            {photo.isPublished ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {photo.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>

        <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-stone-950/70 px-2.5 py-1.5 text-xs font-semibold text-white"><Maximize2 className="h-3.5 w-3.5" /> Preview</span>
      </div>

      <div className="p-4">
        <h2 className="truncate font-semibold text-admin-text" title={photo.title}>{photo.title}</h2>
        <p className="mt-1 min-h-5 truncate text-xs text-admin-subtle" title={categoryLabel}>{categoryLabel || 'Uncategorised'}</p>
        {canManage && !reorderMode && (
          <div className="mt-4 grid grid-cols-[1fr_auto_auto_auto] gap-2 border-t border-admin-border pt-3">
            <button type="button" disabled={pending} onClick={onPublish} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition disabled:opacity-50 ${photo.isPublished ? 'bg-admin-muted text-admin-secondary hover:text-admin-text' : 'bg-admin-primary text-white hover:bg-admin-primary-hover'}`}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : photo.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {photo.isPublished ? 'Unpublish' : 'Publish'}
            </button>
            <AdminIconButton type="button" label={photo.isFeatured ? 'Remove from homepage featured' : 'Add to homepage featured'} disabled={pending} onClick={onFeature} className={photo.isFeatured ? 'border-amber-300 bg-amber-50 text-amber-700' : ''}><Star className={`h-4 w-4 ${photo.isFeatured ? 'fill-current' : ''}`} /></AdminIconButton>
            <AdminIconButton type="button" label={`Edit ${photo.title}`} disabled={pending} onClick={onEdit}><Pencil className="h-4 w-4" /></AdminIconButton>
            <AdminIconButton type="button" label={`Delete ${photo.title}`} disabled={pending} onClick={onDelete} className="text-red-700 hover:border-red-200 hover:bg-red-50"><Trash2 className="h-4 w-4" /></AdminIconButton>
          </div>
        )}
      </div>
    </article>
  );
}

function UploadReviewCard({
  item,
  categories,
  currentCoverPhoto,
  disabled,
  showValidation,
  onChange,
  onCategoryChange,
  onCoverChange,
  onTitleChange,
  onAltTextChange,
  onRegenerate,
  onUseFallback,
  onRetryCover,
  onRemove,
}: {
  item: UploadQueueItem;
  categories: Category[];
  currentCoverPhoto?: Photo;
  disabled: boolean;
  showValidation: boolean;
  onChange: (patch: Partial<UploadQueueItem>) => void;
  onCategoryChange: (categoryId: string) => void;
  onCoverChange: (selected: boolean) => void;
  onTitleChange: (title: string) => void;
  onAltTextChange: (altText: string) => void;
  onRegenerate: () => void;
  onUseFallback: () => void;
  onRetryCover: () => void;
  onRemove: () => void;
}) {
  const titleInvalid = showValidation && Boolean(item.categoryId) && !item.title.trim();
  const altInvalid = showValidation && Boolean(item.categoryId) && !item.altText.trim();
  const categoryInvalid = showValidation && !item.categoryId;
  const selectedCategory = categories.find(category => category.id === item.categoryId);
  const generationBusy = isMetadataBusy(item.metadataStatus);
  const modelLoading = MODEL_LOADING_STATUSES.has(item.metadataStatus);
  const metadataLabel = {
    waiting_for_category: 'Choose category to generate',
    generation_available: 'Ready to generate locally',
    queued: 'Waiting to generate',
    preparing_model: 'Preparing local generator',
    downloading_model: item.metadataProgress === null ? 'Downloading local model' : `Downloading model · ${item.metadataProgress}%`,
    loading_model: 'Loading model into memory',
    generating: 'Generating locally',
    generated: 'Generated locally',
    fallback: 'Safe fallback added',
    manually_edited: 'Edited manually',
  }[item.metadataStatus];
  return (
    <article className={`overflow-hidden rounded-2xl border ${item.status === 'error' ? 'border-red-300 bg-red-50/40' : item.status === 'complete' ? 'border-emerald-300 bg-emerald-50/40' : 'border-admin-border bg-admin-surface'}`}>
      <div className="grid gap-4 p-4 md:grid-cols-[11rem_1fr]">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-xl bg-admin-muted">
            <img src={item.preview} alt="" className="h-full w-full object-cover" />
            {item.status === 'complete' && <span className="absolute inset-0 flex items-center justify-center bg-emerald-950/35"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white"><Check className="h-6 w-6" /></span></span>}
            {item.status === 'uploading' && <span className="absolute inset-0 flex items-center justify-center bg-stone-950/35"><Loader2 className="h-8 w-8 animate-spin text-white" /></span>}
          </div>
          <p className="mt-2 truncate text-xs text-admin-subtle" title={item.file.name}>{item.file.name}</p>
          <p className="text-xs text-admin-subtle">{item.width} × {item.height}px · {(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-admin-text">Photo details</p>
              <p className={`mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold ${item.metadataStatus === 'fallback' ? 'text-amber-700' : item.metadataStatus === 'generated' ? 'text-emerald-700' : 'text-admin-subtle'}`}>
                {generationBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {metadataLabel}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              {item.categoryId && !disabled && item.metadataStatus === 'generation_available' && (
                <>
                  <AdminButton type="button" variant="secondary" className="px-3" onClick={onRegenerate}><Sparkles className="h-4 w-4" /> Generate locally</AdminButton>
                  <AdminButton type="button" variant="quiet" className="px-3" onClick={onUseFallback}>Use safe details</AdminButton>
                </>
              )}
              {item.categoryId && !disabled && generationBusy && (
                <AdminButton type="button" variant="quiet" className="px-3" onClick={onUseFallback}>Cancel and use safe details</AdminButton>
              )}
              {item.categoryId && !disabled && !generationBusy && item.metadataStatus !== 'generation_available' && (
                <AdminButton type="button" variant="quiet" className="px-3" onClick={onRegenerate}><RotateCcw className="h-4 w-4" /> Regenerate</AdminButton>
              )}
              {!disabled && <AdminIconButton type="button" label={`Remove ${item.file.name}`} onClick={onRemove} className="shrink-0 text-red-700"><Trash2 className="h-4 w-4" /></AdminIconButton>}
            </div>
          </div>

          {item.generationWarning && <AdminAlert tone="warning">{item.generationWarning}</AdminAlert>}

          {generationBusy && !modelLoading && (
            <div className="rounded-xl bg-admin-muted p-3" role="status">
              <div className="flex items-center gap-2 text-sm font-semibold text-admin-secondary"><Loader2 className="h-4 w-4 animate-spin text-admin-primary" /> {item.metadataStatus === 'queued' ? 'Queued for local generation…' : 'Analysing photo and writing details…'}</div>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <AdminField label="Category *" error={categoryInvalid ? 'Select a category' : undefined}>
              <select required value={item.categoryId} disabled={disabled || item.categoryLocked} onChange={event => onCategoryChange(event.target.value)} className={`${adminFieldClass} ${categoryInvalid ? 'border-red-500' : ''}`}>
                <option value="">Select category</option>
                {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </AdminField>
            <AdminField label="Title *" error={titleInvalid ? 'Enter a title' : undefined}>
              <input required maxLength={70} value={item.title} disabled={disabled || !item.categoryId} onChange={event => onTitleChange(event.target.value)} placeholder={item.categoryId ? 'Generated automatically after category selection' : 'Select a category to enable title'} className={`${adminFieldClass} ${titleInvalid ? 'border-red-500' : ''}`} />
            </AdminField>
          </div>

          <AdminField label="Alt text *" hint="Briefly describe what is visible for accessibility and search." error={altInvalid ? 'Describe what is visible' : undefined}>
            <textarea required rows={2} maxLength={180} value={item.altText} disabled={disabled || !item.categoryId} onChange={event => onAltTextChange(event.target.value)} placeholder={item.categoryId ? 'Generated automatically from the photo' : 'Select a category to enable alt text'} className={`${adminFieldClass} resize-none py-3 ${altInvalid ? 'border-red-500' : ''}`} />
          </AdminField>

          {selectedCategory && (
            <fieldset disabled={disabled} className="rounded-xl border border-admin-border bg-admin-muted p-3">
              <legend className="px-1 text-sm font-semibold text-admin-secondary">Category cover</legend>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {currentCoverPhoto ? (
                  <img
                    src={getPhotoSrc(currentCoverPhoto)}
                    alt={currentCoverPhoto.altText || currentCoverPhoto.title}
                    className="h-16 w-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-admin-surface text-admin-subtle"><ImageIcon className="h-6 w-6" /></div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-admin-text">
                    {currentCoverPhoto ? `Current ${selectedCategory.name} cover: ${currentCoverPhoto.title}` : `${selectedCategory.name} does not have a cover yet`}
                  </p>
                  <p className="mt-1 text-xs text-admin-subtle">The category cover appears at the top of its public service page.</p>
                </div>
                <button
                  type="button"
                  role="radio"
                  aria-checked={item.isCategoryCover}
                  onClick={() => onCoverChange(!item.isCategoryCover)}
                  className={`min-h-11 rounded-xl border px-4 text-sm font-semibold transition ${item.isCategoryCover ? 'border-amber-500 bg-amber-500 text-white' : 'border-admin-border bg-admin-surface text-admin-secondary hover:border-amber-400 hover:text-amber-700'}`}
                >
                  <Star className={`mr-2 inline h-4 w-4 ${item.isCategoryCover ? 'fill-current' : ''}`} />
                  {item.isCategoryCover ? `Selected as ${selectedCategory.name} cover` : `Use as ${selectedCategory.name} cover`}
                </button>
              </div>
              {item.isCategoryCover && <p className="mt-2 text-xs font-semibold text-amber-700">This photo will be published and replace the current category cover after upload.</p>}
            </fieldset>
          )}

          <fieldset disabled={disabled}>
            <legend className="mb-2 text-sm font-semibold text-admin-secondary">Publishing status</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => onChange({ isPublished: true })} className={`min-h-12 rounded-xl border px-4 text-left text-sm font-semibold transition ${item.isPublished ? 'border-admin-primary bg-admin-primary text-white' : 'border-admin-border bg-admin-surface text-admin-secondary hover:bg-admin-muted'}`}><Eye className="mr-2 inline h-4 w-4" /> Publish now</button>
              <button type="button" onClick={() => onChange({ isPublished: false })} className={`min-h-12 rounded-xl border px-4 text-left text-sm font-semibold transition ${!item.isPublished ? 'border-admin-primary bg-admin-primary text-white' : 'border-admin-border bg-admin-surface text-admin-secondary hover:bg-admin-muted'}`}><EyeOff className="mr-2 inline h-4 w-4" /> Save as draft</button>
            </div>
          </fieldset>

          {(item.status === 'uploading' || item.status === 'complete' || item.status === 'error') && (
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold"><span className={item.status === 'error' ? 'text-red-700' : item.status === 'complete' ? 'text-emerald-700' : 'text-admin-secondary'}>{item.status === 'error' ? item.error || 'Upload failed' : item.status === 'complete' ? 'Upload complete' : 'Uploading…'}</span><span>{item.progress}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-admin-muted"><div className={`h-full transition-all ${item.status === 'error' ? 'bg-red-600' : item.status === 'complete' ? 'bg-emerald-600' : 'bg-admin-primary'}`} style={{ width: `${item.progress}%` }} /></div>
            </div>
          )}

          {item.coverStatus === 'error' && (
            <AdminAlert tone="warning">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>Photo uploaded, but the category cover was not updated: {item.coverError}</span>
                <AdminButton type="button" variant="secondary" onClick={onRetryCover}>Retry cover update</AdminButton>
              </div>
            </AdminAlert>
          )}
          {item.coverStatus === 'assigning' && <AdminAlert tone="info">Updating category cover…</AdminAlert>}
          {item.coverStatus === 'complete' && <AdminAlert tone="success">Category cover updated successfully.</AdminAlert>}
        </div>
      </div>
    </article>
  );
}
