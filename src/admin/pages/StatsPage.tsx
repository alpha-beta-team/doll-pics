import { api } from '../api/client';
import type { Stat } from '../types';
import { SimpleOrderedPage, FieldInput } from '../components/SimpleOrderedPage';

export function StatsPage() {
  return (
    <SimpleOrderedPage<Stat>
      title="Statistics"
      description="Manage homepage statistics counters"
      fetchItems={api.getStats}
      createItem={(data) => api.createStat(data as Omit<Stat, 'id'>)}
      updateItem={api.updateStat}
      deleteItem={api.deleteStat}
      getEmptyItem={() => ({ value: 0, suffix: '', label: '', order: 0, isPublished: true })}
      renderPreview={item => (
        <div className="flex-1">
          <p className="text-2xl font-semibold text-gray-900">
            {item.value}{item.suffix}
          </p>
          <p className="text-sm text-gray-500">{item.label}</p>
        </div>
      )}
      renderForm={(item, onChange) => (
        <>
          <FieldInput
            label="Value"
            type="number"
            value={String(item.value ?? 0)}
            onChange={v => onChange('value', Number(v))}
          />
          <FieldInput label="Suffix" value={(item.suffix as string) ?? ''} onChange={v => onChange('suffix', v)} placeholder="+, %, M" />
          <FieldInput label="Label" value={(item.label as string) ?? ''} onChange={v => onChange('label', v)} />
        </>
      )}
    />
  );
}
