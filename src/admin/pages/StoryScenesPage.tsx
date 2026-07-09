import { api } from '../api/client';
import type { StoryScene } from '../types';
import { SimpleOrderedPage, FieldInput } from '../components/SimpleOrderedPage';

export function StoryScenesPage() {
  return (
    <SimpleOrderedPage<StoryScene>
      title="Story Scenes"
      description="Manage scroll storytelling scenes"
      fetchItems={api.getStoryScenes}
      createItem={(data) => api.createStoryScene(data as Omit<StoryScene, 'id'>)}
      updateItem={api.updateStoryScene}
      deleteItem={api.deleteStoryScene}
      getEmptyItem={() => ({ text: '', image: '', order: 0, isPublished: true })}
      renderPreview={item => (
        <div className="flex items-center gap-4 flex-1">
          <img src={item.image} alt="" className="w-24 h-14 object-cover rounded-lg" />
          <p className="font-medium text-gray-900">{item.text}</p>
        </div>
      )}
      renderForm={(item, onChange) => (
        <>
          <FieldInput label="Text" value={(item.text as string) ?? ''} onChange={v => onChange('text', v)} />
          <FieldInput label="Image URL" value={(item.image as string) ?? ''} onChange={v => onChange('image', v)} />
        </>
      )}
    />
  );
}
