export function deliveryDeadlineLabel(date: string, today: string, delivered = false) {
  if (!date) return 'Delivery date not set';
  if (delivered) return 'Delivered';
  const days = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
  if (days === 0) return 'Due today';
  return days < 0 ? `${-days} day${days === -1 ? '' : 's'} overdue` : `${days} day${days === 1 ? '' : 's'} remaining`;
}

