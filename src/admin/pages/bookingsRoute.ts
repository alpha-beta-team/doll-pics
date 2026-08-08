export function consumeNewBookingSearch(search: string) {
  const params = new URLSearchParams(search);
  const shouldOpen = params.get('new') === '1';
  if (shouldOpen) params.delete('new');
  const remaining = params.toString();
  return {
    shouldOpen,
    search: remaining ? `?${remaining}` : '',
  };
}
