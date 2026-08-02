import type { Booking, BookingStatus, Enquiry } from '../types';

const DAY = 24 * 60 * 60 * 1000;

function dateFrom(referenceTime: number, days: number, hour = 10) {
  const date = new Date(referenceTime + days * DAY);
  date.setHours(hour, 30, 0, 0);
  return date.toISOString();
}

type EnquirySeed = {
  id: string;
  daysAgo: number;
  name: string;
  email: string;
  phone: string;
  shootType: string;
  preferredEvent: string;
  location: string;
  status: Enquiry['status'];
  reminderInDays?: number;
};

type BookingSeed = {
  id: string;
  enquiryId?: string;
  createdDaysAgo: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shootType: string;
  preferredEvent: string;
  location: string;
  status: BookingStatus;
  shootInDays?: number;
  reminderInDays?: number;
};

const ENQUIRY_SEEDS: EnquirySeed[] = [
  {
    id: 'demo-enquiry-01',
    daysAgo: 1,
    name: 'Nithya Krishnan',
    email: 'nithya@example.com',
    phone: '+91 98765 12001',
    shootType: 'Maternity',
    preferredEvent: 'Outdoor sunset session',
    location: 'Erode',
    status: 'new',
  },
  {
    id: 'demo-enquiry-02',
    daysAgo: 2,
    name: 'Harini & Karthik',
    email: 'harini@example.com',
    phone: '+91 98765 12002',
    shootType: 'Newborn',
    preferredEvent: 'Newborn portrait session',
    location: 'Doll Pictures Studio',
    status: 'read',
    reminderInDays: -1,
  },
  {
    id: 'demo-enquiry-03',
    daysAgo: 3,
    name: 'Aishwarya & Arjun',
    email: 'aishwarya@example.com',
    phone: '+91 98765 12003',
    shootType: 'Wedding',
    preferredEvent: 'Wedding and reception',
    location: 'Coimbatore',
    status: 'responded',
  },
  {
    id: 'demo-enquiry-04',
    daysAgo: 5,
    name: 'Meera Suresh',
    email: 'meera@example.com',
    phone: '+91 98765 12004',
    shootType: 'Newborn',
    preferredEvent: 'Studio newborn session',
    location: 'Doll Pictures Studio',
    status: 'responded',
  },
  {
    id: 'demo-enquiry-05',
    daysAgo: 8,
    name: 'Deepa Raj',
    email: 'deepa@example.com',
    phone: '+91 98765 12005',
    shootType: 'Family',
    preferredEvent: 'Family portraits',
    location: 'Gobichettipalayam',
    status: 'read',
    reminderInDays: 2,
  },
  {
    id: 'demo-enquiry-06',
    daysAgo: 12,
    name: 'Priya & Vignesh',
    email: 'priya@example.com',
    phone: '+91 98765 12006',
    shootType: 'Maternity',
    preferredEvent: 'Studio maternity session',
    location: 'Doll Pictures Studio',
    status: 'responded',
  },
  {
    id: 'demo-enquiry-07',
    daysAgo: 18,
    name: 'Janani Kumar',
    email: 'janani@example.com',
    phone: '+91 98765 12007',
    shootType: 'Cake Smash',
    preferredEvent: 'First birthday cake smash',
    location: 'Erode',
    status: 'new',
  },
  {
    id: 'demo-enquiry-08',
    daysAgo: 25,
    name: 'Swetha & Naveen',
    email: 'swetha@example.com',
    phone: '+91 98765 12008',
    shootType: 'Wedding',
    preferredEvent: 'Intimate wedding',
    location: 'Salem',
    status: 'responded',
  },
  {
    id: 'demo-enquiry-09',
    daysAgo: 38,
    name: 'Lakshmi Narayanan',
    email: 'lakshmi@example.com',
    phone: '+91 98765 12009',
    shootType: 'Baby Milestone',
    preferredEvent: 'Six-month milestone',
    location: 'Doll Pictures Studio',
    status: 'responded',
  },
  {
    id: 'demo-enquiry-10',
    daysAgo: 65,
    name: 'Keerthana Ravi',
    email: 'keerthana@example.com',
    phone: '+91 98765 12010',
    shootType: 'Family',
    preferredEvent: 'Three-generation portrait',
    location: 'Bhavani',
    status: 'new',
  },
  {
    id: 'demo-enquiry-11',
    daysAgo: 100,
    name: 'Anu Prakash',
    email: 'anu@example.com',
    phone: '+91 98765 12011',
    shootType: 'Newborn',
    preferredEvent: 'Lifestyle newborn session',
    location: 'Coimbatore',
    status: 'responded',
  },
  {
    id: 'demo-enquiry-12',
    daysAgo: 140,
    name: 'Divya & Sanjay',
    email: 'divya@example.com',
    phone: '+91 98765 12012',
    shootType: 'Wedding',
    preferredEvent: 'Wedding documentary',
    location: 'Erode',
    status: 'responded',
  },
];

const BOOKING_SEEDS: BookingSeed[] = [
  {
    id: 'demo-booking-01',
    enquiryId: 'demo-enquiry-03',
    createdDaysAgo: 2,
    customerName: 'Aishwarya & Arjun',
    customerEmail: 'aishwarya@example.com',
    customerPhone: '+91 98765 12003',
    shootType: 'Wedding',
    preferredEvent: 'Wedding and reception',
    location: 'Coimbatore',
    status: 'confirmed',
    shootInDays: 4,
    reminderInDays: 2,
  },
  {
    id: 'demo-booking-02',
    enquiryId: 'demo-enquiry-04',
    createdDaysAgo: 4,
    customerName: 'Meera Suresh',
    customerEmail: 'meera@example.com',
    customerPhone: '+91 98765 12004',
    shootType: 'Newborn',
    preferredEvent: 'Studio newborn session',
    location: 'Doll Pictures Studio',
    status: 'draft',
    shootInDays: 10,
    reminderInDays: -1,
  },
  {
    id: 'demo-booking-03',
    enquiryId: 'demo-enquiry-06',
    createdDaysAgo: 10,
    customerName: 'Priya & Vignesh',
    customerEmail: 'priya@example.com',
    customerPhone: '+91 98765 12006',
    shootType: 'Maternity',
    preferredEvent: 'Studio maternity session',
    location: 'Doll Pictures Studio',
    status: 'confirmed',
    shootInDays: 12,
    reminderInDays: 9,
  },
  {
    id: 'demo-booking-04',
    enquiryId: 'demo-enquiry-08',
    createdDaysAgo: 22,
    customerName: 'Swetha & Naveen',
    customerEmail: 'swetha@example.com',
    customerPhone: '+91 98765 12008',
    shootType: 'Wedding',
    preferredEvent: 'Intimate wedding',
    location: 'Salem',
    status: 'completed',
    shootInDays: -5,
  },
  {
    id: 'demo-booking-05',
    enquiryId: 'demo-enquiry-09',
    createdDaysAgo: 34,
    customerName: 'Lakshmi Narayanan',
    customerEmail: 'lakshmi@example.com',
    customerPhone: '+91 98765 12009',
    shootType: 'Baby Milestone',
    preferredEvent: 'Six-month milestone',
    location: 'Doll Pictures Studio',
    status: 'confirmed',
    shootInDays: 21,
    reminderInDays: 18,
  },
  {
    id: 'demo-booking-06',
    enquiryId: 'demo-enquiry-11',
    createdDaysAgo: 96,
    customerName: 'Anu Prakash',
    customerEmail: 'anu@example.com',
    customerPhone: '+91 98765 12011',
    shootType: 'Newborn',
    preferredEvent: 'Lifestyle newborn session',
    location: 'Coimbatore',
    status: 'cancelled',
    shootInDays: -70,
  },
  {
    id: 'demo-booking-07',
    enquiryId: 'demo-enquiry-12',
    createdDaysAgo: 136,
    customerName: 'Divya & Sanjay',
    customerEmail: 'divya@example.com',
    customerPhone: '+91 98765 12012',
    shootType: 'Wedding',
    preferredEvent: 'Wedding documentary',
    location: 'Erode',
    status: 'completed',
    shootInDays: -100,
  },
  {
    id: 'demo-booking-08',
    createdDaysAgo: 6,
    customerName: 'Roshini Mani',
    customerEmail: 'roshini@example.com',
    customerPhone: '+91 98765 12013',
    shootType: 'Cake Smash',
    preferredEvent: 'First birthday session',
    location: 'Doll Pictures Studio',
    status: 'draft',
    reminderInDays: -2,
  },
  {
    id: 'demo-booking-09',
    createdDaysAgo: 15,
    customerName: 'Bhuvana & Family',
    customerEmail: 'bhuvana@example.com',
    customerPhone: '+91 98765 12014',
    shootType: 'Family',
    preferredEvent: 'Family portrait session',
    location: 'Erode',
    status: 'confirmed',
    shootInDays: 28,
    reminderInDays: 25,
  },
];

/** Date-relative records keep dashboard periods and upcoming-shoot cards meaningful. */
export function createDashboardMockData(referenceDate = new Date()): {
  enquiries: Enquiry[];
  bookings: Booking[];
} {
  const referenceTime = referenceDate.getTime();

  const enquiries = ENQUIRY_SEEDS.map<Enquiry>((seed) => ({
    id: seed.id,
    name: seed.name,
    email: seed.email,
    phone: seed.phone,
    shootType: seed.shootType,
    preferredEvent: seed.preferredEvent,
    shootDate: '',
    location: seed.location,
    reminderDate:
      seed.reminderInDays == null ? '' : dateFrom(referenceTime, seed.reminderInDays, 9),
    notes: 'Sample dashboard record',
    message: `Interested in a ${seed.shootType.toLocaleLowerCase()} photography session.`,
    status: seed.status,
    createdAt: dateFrom(referenceTime, -seed.daysAgo),
  }));

  const bookings = BOOKING_SEEDS.map<Booking>((seed) => {
    const createdAt = dateFrom(referenceTime, -seed.createdDaysAgo);
    return {
      id: seed.id,
      customerName: seed.customerName,
      customerPhone: seed.customerPhone,
      customerEmail: seed.customerEmail,
      shootType: seed.shootType,
      preferredEvent: seed.preferredEvent,
      shootDate: seed.shootInDays == null ? '' : dateFrom(referenceTime, seed.shootInDays),
      bookingDate:
        seed.shootInDays == null
          ? ''
          : dateFrom(referenceTime, seed.shootInDays).slice(0, 10),
      startTime: seed.shootInDays == null ? '' : '10:30',
      endTime: seed.shootInDays == null ? '' : '12:30',
      durationHours: seed.shootInDays == null ? 0 : 2,
      advancePaid: seed.status === 'cancelled' ? 0 : 500,
      location: seed.location,
      reminderDate:
        seed.reminderInDays == null ? '' : dateFrom(referenceTime, seed.reminderInDays, 9),
      notes: 'Sample dashboard booking',
      driveGalleryUrl: seed.status === 'completed' ? 'https://drive.google.com/example-gallery' : '',
      driveEditedUrl: '',
      driveRawsUrl: '',
      driveNotes: '',
      status: seed.status,
      confirmedAt:
        seed.status === 'confirmed' || seed.status === 'completed'
          ? dateFrom(referenceTime, -seed.createdDaysAgo + 1)
          : undefined,
      enquiryId: seed.enquiryId,
      createdAt,
      updatedAt: createdAt,
    };
  });

  return { enquiries, bookings };
}
