import type { Package } from '../types';
import { bookingTimeWindowError } from '../../shared/bookingTime';
import { phoneNumberError } from './quickEntry.utils';

export const BOOKING_WIZARD_STEPS = [
  { label: 'Customer', description: 'Add the customer\u2019s contact details.' },
  { label: 'Shoot details', description: 'Add the known schedule. Optional details can be updated later.' },
  { label: 'Price & team', description: 'Set pricing and ownership now, or update them later.' },
  { label: 'Optional details', description: 'You can leave this step blank and save the booking.' },
] as const;

export const NEW_BOOKING_DEFAULTS = {
  location: 'Erode',
  whatsappOptIn: true,
  whatsappNotificationsEnabled: true,
} as const;

export const BOOKING_WIZARD_FIELD_LABELS = {
  customerName: 'Name',
  customerPhone: 'Phone',
  customerEmail: 'Email',
  shootType: 'Photography service',
  preferredEvent: 'Preferred event',
  bookingDate: 'Booking date',
  location: 'Location',
  startTime: 'Start time',
  endTime: 'End time',
  package: 'Package',
  agreedTotal: 'Agreed total (\u20b9)',
  assignedTeamMember: 'Assigned team member',
  paymentDueDate: 'Payment due date',
  advanceAmount: 'Advance received (\u20b9)',
  advanceMethod: 'Advance method',
  followUpAt: 'Follow-up date and time',
  followUpNote: 'Follow-up note',
  notes: 'Internal notes',
  whatsapp: 'WhatsApp updates',
} as const;

export type BookingWizardFieldErrors = Partial<Record<'customerName' | 'customerPhone' | 'time', string>>;

export type BookingWizardValidationValues = {
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
};

export function validateBookingWizardStep(
  step: number,
  values: BookingWizardValidationValues,
): BookingWizardFieldErrors {
  if (step === 0) {
    const errors: BookingWizardFieldErrors = {};
    if (values.customerName.trim().length < 2) errors.customerName = 'Enter the customer\u2019s name.';
    const phoneError = phoneNumberError(values.customerPhone);
    if (phoneError) errors.customerPhone = phoneError;
    return errors;
  }
  if (step === 1) {
    const timeError = bookingTimeWindowError(values.bookingDate, values.startTime, values.endTime);
    return timeError ? { time: timeError } : {};
  }
  return {};
}

export function initialHighestCompletedStep(currentStep: number): number {
  return Math.max(-1, Math.min(BOOKING_WIZARD_STEPS.length - 2, currentStep - 1));
}

export function canOpenBookingWizardStep(
  targetStep: number,
  currentStep: number,
  highestCompletedStep: number,
): boolean {
  return targetStep !== currentStep && targetStep >= 0 && targetStep <= highestCompletedStep;
}

export function invalidateBookingWizardProgress(highestCompletedStep: number, editedStep: number): number {
  return Math.min(highestCompletedStep, editedStep - 1);
}

export function packageMatchesShootType(item: Package, shootType: string): boolean {
  const packageService = (item.categoryName || item.shootType || '').trim().toLocaleLowerCase();
  return Boolean(packageService) && packageService === shootType.trim().toLocaleLowerCase();
}

export function packagesForShootType(packages: Package[], shootType: string): Package[] {
  return packages.filter(item => packageMatchesShootType(item, shootType));
}

export function packagePrefill(packages: Package[], id: string, currentShootType: string) {
  const selected = packages.find(item => item.id === id);
  return {
    agreedTotal: selected?.price == null ? undefined : String(selected.price),
    shootType: selected
      ? selected.categoryName || selected.shootType || currentShootType
      : currentShootType,
  };
}
