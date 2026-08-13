import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { statusBadgeClass, words } from '../../attendance/format';

export const employeeFieldClass = 'mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100';

export function EmployeePageHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return <header className="flex items-end justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h1>{description && <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>}</div>{action}</header>;
}

export function EmployeeCard({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`} />;
}

export function EmployeeButton({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const style = variant === 'primary' ? 'border-blue-700 bg-blue-700 text-white hover:bg-blue-800' : variant === 'danger' ? 'border-red-700 bg-red-700 text-white hover:bg-red-800' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50';
  return <button {...props} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 ${style} ${className}`} />;
}

export function EmployeeAlert({ children, tone = 'danger' }: { children: ReactNode; tone?: 'danger' | 'success' | 'warning' | 'info' }) {
  const style = tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-900' : tone === 'info' ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-red-200 bg-red-50 text-red-800';
  return <div role={tone === 'danger' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${style}`}><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div>{children}</div></div>;
}

export function EmployeeLoading({ label = 'Loading…' }: { label?: string }) {
  return <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-slate-500" role="status"><Loader2 className="h-6 w-6 animate-spin text-blue-700" />{label}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusBadgeClass(status)}`}>{words(status)}</span>;
}

