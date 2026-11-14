export interface CustomerBooking {
  customerName: string;
  shootType: string;
  packageName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'draft' | 'confirmed' | 'shoot_completed' | 'delivered' | 'cancelled';
  expectedDeliveryDate: string;
  update: string;
  delivery: { galleryUrl?: string; editedUrl?: string };
}

export interface CustomerPageSettings {
  editorStaffAccountId?: string;
  editorName?: string;
  token: string;
  expiresAt: string;
  expectedDeliveryDate: string;
  update: string;
  publishedAt: string;
  sources: { galleryUrl: string; editedUrl: string };
  preview: CustomerBooking;
}


export type DeliveryQueueFilter = 'awaiting' | 'week' | 'overdue' | 'delivered';
export interface DeliveryQueueItem {
  id: string;
  customerName: string;
  shootType: string;
  packageName: string;
  bookingDate: string;
  status: 'shoot_completed' | 'delivered';
  expectedDeliveryDate: string;
  editorStaffAccountId: string;
  editorName: string;
  publishedAt: string | null;
  hasDeliveryLink: boolean;
}
export interface DeliveryQueue {
  today: string;
  weekStart: string;
  weekEnd: string;
  filter: DeliveryQueueFilter;
  page: number;
  pageSize: number;
  counts: Record<DeliveryQueueFilter, number>;
  items: DeliveryQueueItem[];
  total: number;
}
