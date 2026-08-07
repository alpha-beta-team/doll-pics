import { api } from '../api/client';
import type { BehindScene } from '../types';
import { SimpleOrderedPage, FieldInput } from '../components/SimpleOrderedPage';

export function BehindScenesPage() {
  return (
    <SimpleOrderedPage<BehindScene>
      title="Behind the Scenes"
      description="Publish only genuine Doll Pictures process media with an accurate description"
      fetchItems={api.getBehindScenes}
      createItem={(data) => api.createBehindScene(data as Omit<BehindScene, 'id'>)}
      updateItem={api.updateBehindScene}
      deleteItem={api.deleteBehindScene}
      getEmptyItem={() => ({ title: '', image: '', order: 0, isPublished: false })}
      renderPreview={item => (
        <div className="flex items-center gap-4 flex-1">
          <img src={item.image} alt={item.title} className="w-24 h-14 object-cover rounded-lg" />
          <p className="font-medium text-gray-900">{item.title}</p>
        </div>
      )}
      renderForm={(item, onChange) => (
        <>
          <FieldInput label="Title" value={(item.title as string) ?? ''} onChange={v => onChange('title', v)} />
          <FieldInput label="Image URL" value={(item.image as string) ?? ''} onChange={v => onChange('image', v)} />
        </>
      )}
    />
  );
}
