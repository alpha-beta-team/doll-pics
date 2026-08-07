export function whatsappUrl(phone: string, message?: string) {
  const raw = phone.replace(/\D/g, '').replace(/^0/, '');
  const digits = raw.length === 10 ? `91${raw}` : raw;
  const query = message?.trim() ? `?text=${encodeURIComponent(message.trim())}` : '';
  return `https://wa.me/${digits}${query}`;
}
