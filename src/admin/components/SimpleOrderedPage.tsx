import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminLoadingState,
  AdminModal,
  AdminPageHeader,
  adminFieldClass,
} from './ui';
import { ReadOnlyNotice } from './ReadOnlyNotice';

export interface OrderedItem {
  id: string;
  order: number;
  isPublished: boolean;
}

interface SimpleOrderedPageProps<T extends OrderedItem> {
  title: string;
  description: string;
  fetchItems: () => Promise<T[]>;
  createItem: (data: Partial<T>) => Promise<T>;
  updateItem: (id: string, data: Partial<T>) => Promise<T>;
  deleteItem: (id: string) => Promise<void>;
  renderForm: (
    item: Partial<T>,
    onChange: (field: keyof T, value: unknown) => void,
  ) => ReactNode;
  getEmptyItem: () => Partial<T>;
  renderPreview?: (item: T) => ReactNode;
  readOnly?: boolean;
}

export function SimpleOrderedPage<T extends OrderedItem>({
  title,
  description,
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  renderForm,
  getEmptyItem,
  renderPreview,
  readOnly = false,
}: SimpleOrderedPageProps<T>) {
  const confirmDialog = useConfirmDialog();
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<T> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await fetchItems());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [fetchItems]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async () => {
    if (!editing) return;
    setIsSaving(true);
    setError(null);
    try {
      if (editing.id) {
        await updateItem(editing.id, editing);
      } else {
        await createItem({ ...editing, order: items.length, isPublished: editing.isPublished ?? false });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (item: T) => {
    try {
      await updateItem(item.id, { isPublished: !item.isPublished } as Partial<T>);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: 'Delete item?',
      description: 'This item will be permanently removed. This action cannot be undone.',
      confirmLabel: 'Delete item',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteItem(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (isLoading) {
    return <AdminLoadingState label={`Loading ${title.toLowerCase()}…`} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Website"
        title={title}
        description={description}
        actions={readOnly ? <ReadOnlyNotice /> : <AdminButton onClick={() => setEditing(getEmptyItem())}><Plus className="h-4 w-4" />Add</AdminButton>}
      />

      {error && (
        <AdminAlert><span>{error}</span></AdminAlert>
      )}

      <div className="grid gap-4">
        {items.map(item => (
          <AdminCard key={item.id} className="flex items-center gap-4 p-4">
            {renderPreview?.(item)}
            {!readOnly && <div className="flex items-center gap-2 ml-auto shrink-0">
              <button
                type="button"
                onClick={() => handleToggle(item)}
                aria-label={item.isPublished ? 'Unpublish' : 'Publish'}
                className={`p-2 rounded-lg ${item.isPublished ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}
              >
                {item.isPublished ? <Eye className="w-4 h-4" aria-hidden="true" /> : <EyeOff className="w-4 h-4" aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={() => setEditing(item)}
                aria-label="Edit"
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                aria-label="Delete"
                className="p-2 rounded-lg text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>}
          </AdminCard>
        ))}
      </div>

      {!readOnly && <AdminModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`${editing?.id ? 'Edit' : 'Add'} ${title.slice(0, -1)}`}
        footer={<div className="flex justify-end gap-3"><AdminButton variant="secondary" onClick={() => setEditing(null)}>Cancel</AdminButton><AdminButton onClick={() => void handleSave()} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save'}</AdminButton></div>}
      >
        {editing && <div className="space-y-4">{renderForm(editing, (field, value) => setEditing(prev => ({ ...prev, [field]: value } as Partial<T>)))}</div>}
      </AdminModal>}
    </div>
  );
}

export function FieldInput({
  label, value, onChange, type = 'text', placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={adminFieldClass}
      />
    </div>
  );
}
