import type { ReactNode } from 'react';
import { useRouteLoaderData } from 'react-router-dom';
import { BookingRecordContext, type BookingRecordData } from './bookingRecordContext';
export function BookingRecordLoaderProvider({ children }: { children: ReactNode }) {
  const data = useRouteLoaderData('booking-record') as BookingRecordData | undefined;
  return <BookingRecordContext.Provider value={data}>{children}</BookingRecordContext.Provider>;
}
