import type { Package } from '../types';
import type { SaleInput } from '../../shared/types/sales';
import { formatINR } from '../../lib/pricing';
import { categorySelection, isSaleEligible, saleCategoryGroups, setSalePackages, toggleSaleCategory } from './saleSelection';
type Props = { packages: Package[]; value: SaleInput; onChange: (next: SaleInput) => void; disabled?: boolean };
export function SalePackageSelector({ packages, value, onChange, disabled = false }: Props) {
  const groups = saleCategoryGroups(packages);
  return <fieldset disabled={disabled} className="space-y-4">
    <legend className="mb-2 font-medium">Eligible packages</legend>
    <p className="text-xs text-slate-500">Select a service/category to include all its eligible packages. Select it again to remove its packages. Dashed borders indicate a partial selection.</p>
    <div className="flex flex-wrap gap-2" aria-label="Services and package categories">{groups.map(group => {
      const selection = categorySelection(group.eligibleIds, value.packageIds);
      const style = selection.state === 'all' ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600' : selection.state === 'partial' ? 'border-dashed border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-300 bg-white text-slate-700';
      return <button key={group.id} type="button" disabled={!group.eligibleIds.length} aria-pressed={selection.state === 'partial' ? 'mixed' : selection.state === 'all'} onClick={() => onChange(toggleSaleCategory(value, group))} className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${style}`}>
        <span className="block">{selection.state === 'all' ? '✓ ' : selection.state === 'partial' ? '− ' : ''}{group.name}</span>
        <span className="mt-1 block text-xs font-normal">{group.eligibleIds.length ? `${selection.count} / ${group.eligibleIds.length} selected` : 'No eligible packages'}</span>
      </button>;
    })}</div>
    {groups.map(group => <div key={group.id} className="space-y-2"><h3 className="text-sm font-medium text-slate-600">{group.name}</h3>{group.packages.map(pkg => {
      const selected = value.packageIds.includes(pkg.id);
      const eligible = isSaleEligible(pkg);
      return <label key={pkg.id} className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
        <input type="checkbox" className="mt-0.5" checked={selected} disabled={!eligible && !selected} onChange={event => onChange(setSalePackages(value, event.target.checked ? [...value.packageIds, pkg.id] : value.packageIds.filter(id => id !== pkg.id)))} />
        <span><span className="font-medium">{pkg.name}</span><span className="ml-2 text-slate-600">{pkg.price == null ? 'Enquire' : formatINR(pkg.price)}{pkg.pricingMode === 'startingFrom' ? ' starting from' : ''}</span>{!eligible && <span className="mt-1 block text-xs text-amber-700">{!pkg.isPublished ? 'Unpublished' : pkg.pricingMode === 'enquire' ? 'Enquiry-only' : 'A positive listed price is required'}{selected ? ' — selected previously; you can remove it.' : ''}</span>}</span>
      </label>;
    })}</div>)}
    {!packages.length && <p className="text-sm text-slate-500">Create a published priced package before adding it to a sale.</p>}
  </fieldset>;
}
