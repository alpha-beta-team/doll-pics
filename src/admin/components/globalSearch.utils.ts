import type { AdminSearchItem, AdminSearchResponse } from '../types';

export type SearchResultGroup = {
  label: 'Enquiries' | 'Bookings';
  items: AdminSearchItem[];
};

export function searchResultGroups(response: AdminSearchResponse | null): SearchResultGroup[] {
  if (!response) return [];
  return [
    { label: 'Enquiries', items: response.enquiries },
    { label: 'Bookings', items: response.bookings },
  ].filter(group => group.items.length > 0) as SearchResultGroup[];
}

export function flattenSearchResults(response: AdminSearchResponse | null): AdminSearchItem[] {
  return searchResultGroups(response).flatMap(group => group.items);
}

export function searchResultDestination(item: AdminSearchItem): string {
  return item.type === 'enquiry'
    ? `/admin/enquiries/${item.id}`
    : `/admin/bookings/${item.id}`;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';
}
