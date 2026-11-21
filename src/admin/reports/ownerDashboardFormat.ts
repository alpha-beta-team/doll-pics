export const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
export function shortDate(day?: string) {
  if (!day || !/^\d{4}-\d{2}-\d{2}/.test(day) || !Number.isFinite(Date.parse(day))) return 'Not set';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(`${day.slice(0, 10)}T12:00:00+05:30`));
}
export const timestamp = (value: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(value));
