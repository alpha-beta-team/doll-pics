import type { Photo } from '../types';

export type PhotoStatusFilter = 'all' | 'published' | 'draft';

export function filterPhotos(
  photos: Photo[],
  categoryId: string,
  status: PhotoStatusFilter,
  searchQuery: string,
): Photo[] {
  const query = searchQuery.trim().toLocaleLowerCase();
  return photos.filter(photo => {
    if (categoryId && !photo.categories.includes(categoryId)) return false;
    if (status === 'published' && !photo.isPublished) return false;
    if (status === 'draft' && photo.isPublished) return false;
    if (!query) return true;
    return [photo.title, photo.altText, photo.location, photo.year]
      .some(value => value.toLocaleLowerCase().includes(query));
  });
}

export function getUsedCategoryCounts(photos: Photo[]): Map<string, number> {
  const counts = new Map<string, number>();
  photos.forEach(photo => {
    new Set(photo.categories).forEach(categoryId => {
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    });
  });
  return counts;
}

export function toggleVisibleSelection(
  selectedIds: Set<string>,
  visibleIds: string[],
): Set<string> {
  const next = new Set(selectedIds);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => next.has(id));
  visibleIds.forEach(id => allVisibleSelected ? next.delete(id) : next.add(id));
  return next;
}

export function getUploadActionLabel(total: number, publishCount: number): string {
  const noun = total === 1 ? 'photo' : 'photos';
  if (publishCount === total) return `Upload and publish ${total} ${noun}`;
  if (publishCount === 0) return `Upload ${total} ${noun} as drafts`;
  return `Upload ${total} ${noun} · publish ${publishCount}`;
}
