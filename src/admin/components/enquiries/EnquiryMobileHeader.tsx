import { SalesMobileHeader } from '../sales/SalesMobileHeader';
import type { ServiceCategoryOption } from '../sales/serviceCategories';
import { ENQUIRY_SORT_OPTIONS, type EnquiryListScope, type EnquirySort } from './enquiryList';

type Props = {
  total: number;
  activeCount: number;
  newCount: number;
  newTodayCount: number;
  dueTodayCount: number;
  view: EnquiryListScope | 'new' | 'due_today' | '';
  onViewChange: (view: EnquiryListScope | 'new' | 'due_today') => void;
  query: string;
  onQueryChange: (query: string) => void;
  filtersOpen: boolean;
  activeFilterCount: number;
  onToggleFilters: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  canManage: boolean;
  onAdd: () => void;
  services: ServiceCategoryOption[];
  service: string;
  onServiceChange: (service: string) => void;
  sort: EnquirySort;
  onSortChange: (sort: EnquirySort) => void;
};

const SHORT_SORT_LABELS: Record<EnquirySort, string> = {
  newest: 'Newest', oldest: 'Oldest', follow_up: 'Follow-up', updated: 'Updated', customer: 'Name A–Z',
};

export function EnquiryMobileHeader(props: Props) {
  const views = [
    { value: 'active', label: 'Active enquiries', count: props.activeCount },
    { value: 'all', label: 'All', count: props.total },
    { value: 'new', label: 'New', count: props.newCount },
    { value: 'due_today', label: 'Follow-up due', count: props.dueTodayCount },
  ] as const;
  return <SalesMobileHeader {...props} title="Enquiries" itemName="enquiry" itemPlural="enquiries" totalLabel="total leads" summary={`${props.newTodayCount} new today`} addLabel="Add Lead" views={views} sortOptions={ENQUIRY_SORT_OPTIONS.map(option => ({ ...option, shortLabel: SHORT_SORT_LABELS[option.value] }))} />;
}
