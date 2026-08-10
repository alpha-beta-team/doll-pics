import { Eye } from 'lucide-react';

export function ReadOnlyNotice({ label = 'You have view-only access to this area.' }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
      <Eye className="h-3.5 w-3.5" /> View only
      <span className="sr-only">{label}</span>
    </div>
  );
}
