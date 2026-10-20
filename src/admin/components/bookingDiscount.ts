export const BOOKING_DISCOUNTS: readonly number[] = [0, 500, 1000, 1500];

export function changeBookingDiscount(amount: string, previous: number, next: number) {
  if (!BOOKING_DISCOUNTS.includes(previous) || !BOOKING_DISCOUNTS.includes(next)) {
    return { amount, error: 'Select a valid discount.' };
  }
  if (amount.trim() === '' || !Number.isFinite(Number(amount)) || Number(amount) < 0) {
    return { amount, error: 'Enter a valid agreed amount before selecting a discount.' };
  }
  const baseMinor = Math.round(Number(amount) * 100) + previous * 100;
  if (next * 100 > baseMinor) return { amount, error: 'Discount cannot exceed the agreed amount.' };
  return { amount: String((baseMinor - next * 100) / 100), error: '' };
}
