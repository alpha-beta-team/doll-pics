import type { SaleDetail } from '../../shared/types/sales';
import { formatINR, formatPackagePrice } from '../../lib/pricing';
import { saleDate } from '../../lib/sales';
export function SaleDetails({ sale }: { sale: SaleDetail }) {
  const groups = new Map<string, { name: string; packages: SaleDetail['packages'] }>();
  for (const pkg of sale.packages) {
    const key = pkg.categoryId ?? `unavailable:${pkg.categoryName}`;
    const group = groups.get(key) ?? { name: pkg.categoryName, packages: [] };
    group.packages.push(pkg); groups.set(key, group);
  }
  return <div className="space-y-5">
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">{sale.name}</h1><span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold capitalize text-blue-800">{sale.phase}</span></div>
      {sale.state === 'draft' && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">This sale is a draft. Publish it to schedule or activate the offer on public package pages. Prices below are a preview.</p>}
      {!sale.enabled && <p className="text-sm text-amber-800">Sales are currently disabled by the owner configuration.</p>}
      {sale.description && <p className="whitespace-pre-wrap text-sm text-slate-700">{sale.description}</p>}
      <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div><dt className="text-slate-500">Starts (IST)</dt><dd className="mt-1 font-medium">{saleDate(sale.startsAt)}</dd></div>
        <div><dt className="text-slate-500">Ends (IST, exclusive)</dt><dd className="mt-1 font-medium">{saleDate(sale.endsAt)}</dd></div>
        <div><dt className="text-slate-500">Default discount</dt><dd className="mt-1 font-medium">{sale.discountType === 'percentage' ? `${sale.discountValue}% off` : `${formatINR(sale.discountValue)} off`}</dd></div>
        <div><dt className="text-slate-500">Selected categories</dt><dd className="mt-1 font-medium">{groups.size}</dd></div>
        <div><dt className="text-slate-500">Selected packages</dt><dd className="mt-1 font-medium">{sale.packages.length}</dd></div>
        <div><dt className="text-slate-500">Announce before starting</dt><dd className="mt-1 font-medium">{sale.showUpcoming ? 'Yes' : 'No'}</dd></div>
      </dl>
      {sale.terms && <div><h2 className="text-sm font-semibold">Terms</h2><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{sale.terms}</p></div>}
    </section>
    {[...groups].map(([id, group]) => <section key={id} className="overflow-hidden rounded-xl border border-slate-200 bg-white"><h2 className="border-b bg-slate-50 px-5 py-4 font-semibold">{group.name} <span className="ml-2 text-sm font-normal text-slate-500">{group.packages.length} package{group.packages.length === 1 ? '' : 's'}</span></h2>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-500"><tr><th className="p-4">Package</th><th className="p-4">Original price</th><th className="p-4">Discount</th><th className="p-4">Savings</th><th className="p-4">Sale price</th></tr></thead><tbody>{group.packages.map(pkg => <tr key={pkg.packageId} className="border-t align-top"><td className="min-w-48 p-4"><p className="font-semibold">{pkg.packageName}</p><p className="mt-1 text-xs text-slate-500">{pkg.priceSource === 'saved' ? 'Saved campaign price' : pkg.priceSource === 'preview' ? 'Current price preview' : 'Price unavailable'}{pkg.hasOverride ? ' · Package override' : ''}</p>{pkg.warnings.map(warning => <p key={warning} className="mt-1 text-xs text-amber-800">{warning}</p>)}</td><td className="whitespace-nowrap p-4">{pkg.basePrice == null ? 'Unavailable' : formatPackagePrice(pkg.pricingMode, pkg.basePrice)}</td><td className="whitespace-nowrap p-4">{pkg.discountType === 'percentage' ? `${pkg.discountValue}%` : formatINR(pkg.discountValue)}</td><td className="whitespace-nowrap p-4">{pkg.discountAmount == null ? 'Unavailable' : formatINR(pkg.discountAmount)}</td><td className="whitespace-nowrap p-4 font-semibold text-emerald-800">{pkg.salePrice == null ? 'Unavailable' : formatPackagePrice(pkg.pricingMode, pkg.salePrice)}</td></tr>)}</tbody></table></div>
    </section>)}
    {!sale.packages.length && <p className="rounded-xl border border-dashed p-6 text-sm text-slate-500">This sale has no selected packages.</p>}
  </div>;
}
