export function whatsappUrl(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '91')}`;
}
