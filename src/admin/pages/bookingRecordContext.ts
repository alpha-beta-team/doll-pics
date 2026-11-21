import { createContext, useContext } from 'react';
import type { Booking } from '../types';
export interface BookingRecordData { booking: Booking | null; error?: string; }
export const BookingRecordContext = createContext<BookingRecordData | undefined>(undefined);
export const useBookingRecordLoader = () => useContext(BookingRecordContext);
