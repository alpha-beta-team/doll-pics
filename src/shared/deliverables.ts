export interface DeliverableType {
  id: string;
  name: string;
  kind: 'digital' | 'physical';
  unit: string;
  specifications: string;
  defaultQuantity: number;
  selectedByDefault: boolean;
  active: boolean;
  order: number;
}
export interface BookingDeliverable {
  id: string;
  catalogId: string;
  name: string;
  kind: 'digital' | 'physical';
  unit: string;
  specifications: string;
  quantity: number;
  category: 'included' | 'extra' | 'complimentary';
  amount: number;
  reason?: string;
}
export function deliverableExtraTotal(rows: BookingDeliverable[] = []) {
  return rows.reduce((total, row) => total + (row.category === 'extra' ? Math.round(row.amount * 100) : 0), 0) / 100;
}
export function defaultDeliverables(types: DeliverableType[]): BookingDeliverable[] {
  return types.filter(type => type.active && type.selectedByDefault).map(type => ({ ...type, catalogId: type.id, quantity: type.defaultQuantity, category: 'included', amount: 0 }));
}
export function deliverableInputs(rows: BookingDeliverable[]) {
  return rows.map(({ id, catalogId, quantity, category, amount, reason }) => ({ id, catalogId, quantity, category, amount, reason }));
}

export interface DeliverableConfigurationItem {
  id: string;
  name: string;
  kind: 'digital' | 'physical';
  unit: string;
  specifications: string;
  quantity: number;
  category: 'included' | 'complimentary';
}
export interface SeasonalDeliverableExtension {
  id: string;
  name: string;
  active: boolean;
  items: DeliverableConfigurationItem[];
}
export interface DeliverableConfiguration {
  revision: number;
  base: DeliverableConfigurationItem[];
  seasonal: SeasonalDeliverableExtension[];
}
export function configurationDeliverables(configuration: DeliverableConfiguration, seasonalId = ''): BookingDeliverable[] {
  const extension = configuration.seasonal.find(item => item.id === seasonalId && item.active);
  const rows = (items: DeliverableConfigurationItem[], source: string, reason = '') => items.map(item => ({
    id: `preset:${source}:${item.id}`, catalogId: item.id, name: item.name, kind: item.kind,
    unit: item.unit, specifications: item.specifications, quantity: item.quantity,
    category: item.category, amount: 0, reason: item.category === 'complimentary' ? reason : '',
  }));
  return [...rows(configuration.base, 'base'), ...(extension ? rows(extension.items, extension.id, extension.name) : [])];
}
export function applyDeliverableConfiguration(configuration: DeliverableConfiguration, seasonalId: string, current: BookingDeliverable[]) {
  const preserved = current.filter(row => row.category === 'extra' || (row.category === 'complimentary' && !row.id.startsWith('preset:')));
  // New row identities let an explicit reapply capture current specifications without
  // changing the saved snapshots of existing or manually priced rows.
  const applied = configurationDeliverables(configuration, seasonalId).map(row => ({ ...row, id: `${row.id}:${crypto.randomUUID().slice(0, 8)}` }));
  return [...applied, ...preserved];
}
