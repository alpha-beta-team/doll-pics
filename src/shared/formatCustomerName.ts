/** Format customer names for display without changing the stored value. */
export function formatCustomerName(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/(^|[^\p{L}\p{M}\p{N}'’])\p{L}/gu, letter => letter.toUpperCase());
}
