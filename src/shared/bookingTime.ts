const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function bookingTimeWindowError(
  bookingDate?: string,
  startTime?: string,
  endTime?: string,
): string | null {
  const date = bookingDate?.trim() || '';
  const start = startTime?.trim() || '';
  const end = endTime?.trim() || '';
  if (!start && !end) return null;
  if (!date) return 'Choose a booking date before adding a time window.';
  if (!start || !end) return 'Enter both a start time and an end time.';
  if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
    return 'Use a valid 24-hour start and end time.';
  }
  if (end <= start) return 'End time must be later than start time.';
  return null;
}

export function formatTimeWindow(startTime?: string, endTime?: string): string {
  return startTime && endTime ? `${startTime}–${endTime}` : 'Time not set';
}

export function bookingDurationLabel(startTime?: string, endTime?: string): string {
  if (!startTime || !endTime || !TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    return '';
  }
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  if (minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [hours ? `${hours} hr${hours === 1 ? '' : 's'}` : '', remainder ? `${remainder} min` : '']
    .filter(Boolean)
    .join(' ');
}
