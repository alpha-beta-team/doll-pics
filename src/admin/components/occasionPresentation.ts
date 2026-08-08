import type { CustomerOccasion } from '../types';
import type { ManualWhatsAppContext } from './whatsappTemplates';

export function occasionMessageContext(item: CustomerOccasion): ManualWhatsAppContext {
  return {
    customerName: item.customerName,
    phone: item.phone,
    occasionName: item.occasionName,
    consentRecorded: item.consentRecorded,
    optedOut: item.optedOut,
  };
}

export function occasionUrgency(days: number) {
  if (days < 0) return `Overdue by ${Math.abs(days)} day${days === -1 ? '' : 's'}`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}
