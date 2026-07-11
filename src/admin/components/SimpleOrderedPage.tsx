import { useEffect, useState, type ReactNode } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';

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
}: SimpleOrderedPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<T> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    try {
      setItems(await fetchItems());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    setIsSaving(true);
    setError(null);
    try {
      if (editing.id) {
        await updateItem(editing.id, editing);
      } else {
        await createItem({ ...editing, order: items.length, isPublished: editing.isPublished ?? true });
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
    if (!confirm('Delete this item?')) return;
    try {
      await deleteItem(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-1">{description}</p>
        </div>
        <button
          onClick={() => setEditing(getEmptyItem())}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            {renderPreview?.(item)}
            <div className="flex items-center gap-2 ml-auto shrink-0">
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
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editing.id ? 'Edit' : 'Add'} {title.slice(0, -1)}</h2>
            </div>
            <div className="p-4 space-y-4">
              {renderForm(editing, (field, value) => setEditing(prev => ({ ...prev, [field]: value } as Partial<T>)))}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
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
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
