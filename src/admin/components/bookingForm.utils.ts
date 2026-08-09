import type { Package } from '../types';
import { bookingTimeWindowError } from '../../shared/bookingTime';
import { phoneNumberError } from './quickEntry.utils';

export const BOOKING_WIZARD_STEPS = [
  { label: 'Customer', description: 'Add the customer\u2019s contact details.' },
  { label: 'Shoot details', description: 'Add the known schedule. Optional details can be updated later.' },
  { label: 'Price & team', description: 'Set pricing and ownership now, or update them later.' },
  { label: 'Optional details', description: 'You can leave this step blank and save the booking.' },
] as const;

export const BOOKING_WIZARD_FIELD_LABELS = {
  customerName: 'Name \u00b7 Required',
  customerPhone: 'Phone \u00b7 Required',
  customerEmail: 'Email \u00b7 Optional',
  shootType: 'Photography service \u00b7 Required',
  preferredEvent: 'Preferred event \u00b7 Optional',
  bookingDate: 'Booking date \u00b7 Optional',
  location: 'Location \u00b7 Optional',
  startTime: 'Start time \u00b7 Optional',
  endTime: 'End time \u00b7 Optional',
  package: 'Package \u00b7 Optional',
  agreedTotal: 'Agreed total (\u20b9) \u00b7 Optional',
  assignedTeamMember: 'Assigned team member \u00b7 Optional',
  paymentDueDate: 'Payment due date \u00b7 Optional',
  advanceAmount: 'Advance received (\u20b9) \u00b7 Optional',
  advanceMethod: 'Advance method \u00b7 Optional',
  followUpAt: 'Follow-up date and time \u00b7 Optional',
  followUpNote: 'Follow-up note \u00b7 Optional',
  notes: 'Internal notes \u00b7 Optional',
  whatsapp: 'WhatsApp updates \u00b7 Optional',
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

export function packagePrefill(packages: Package[], id: string, currentShootType: string) {
  const selected = packages.find(item => item.id === id);
  return {
    agreedTotal: selected?.price == null ? undefined : String(selected.price),
    shootType: selected
      ? selected.categoryName || selected.shootType || currentShootType
      : currentShootType,
  };
}
