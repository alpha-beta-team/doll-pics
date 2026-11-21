import { redirect, type LoaderFunctionArgs, type ShouldRevalidateFunctionArgs } from 'react-router-dom';
import { api } from '../api/client';
import { authStorage } from '../api/authStorage';
import type { BookingRecordData } from './bookingRecordContext';
export type { BookingRecordData } from './bookingRecordContext';
export async function bookingRecordLoader({ params }: LoaderFunctionArgs): Promise<BookingRecordData> {
  if (!authStorage.getToken()) throw redirect('/admin/login');
  try { return { booking: await api.getBooking(params.id!) }; }
  catch (error) { return { booking: null, error: error instanceof Error ? error.message : 'Could not load booking' }; }
}

/** Switching record tabs changes presentation, not the booking being loaded. */
export function bookingRecordShouldRevalidate({ currentUrl, nextUrl, formMethod, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs): boolean {
  if (!formMethod && currentUrl.pathname === nextUrl.pathname && currentUrl.hash === nextUrl.hash
    && currentUrl.searchParams.get('tab') !== nextUrl.searchParams.get('tab')) {
    const current = new URLSearchParams(currentUrl.search), next = new URLSearchParams(nextUrl.search);
    current.delete('tab'); next.delete('tab'); current.sort(); next.sort();
    if (current.toString() === next.toString()) return false;
  }
  return defaultShouldRevalidate;
}
