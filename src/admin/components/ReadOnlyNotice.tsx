import { AdminAlert } from './ui/AdminUi';

export function ReadOnlyNotice({ label = 'You have view-only access to this area.' }: { label?: string }) {
  return <AdminAlert tone="info">{label}</AdminAlert>;
}
