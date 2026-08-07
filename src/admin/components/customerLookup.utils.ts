export function canonicalIndianPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits.length === 10 ? digits : '';
}

export function customerRecordDestination(type: 'enquiry' | 'booking', id: string) {
  return `/admin/${type === 'enquiry' ? 'enquiries' : 'bookings'}/${id}`;
}
