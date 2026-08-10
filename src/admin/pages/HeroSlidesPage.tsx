import { api } from '../api/client';
import type { HeroSlide } from '../types';
import { SimpleOrderedPage, FieldInput } from '../components/SimpleOrderedPage';
import { useFeatureAccess } from '../access/useFeatureAccess';

export function HeroSlidesPage() {
  const { isReadOnly } = useFeatureAccess('hero_slides');
  return (
    <SimpleOrderedPage<HeroSlide>
      title="Hero Slides"
      readOnly={isReadOnly}
      description="Manage homepage hero carousel slides"
      fetchItems={api.getHeroSlides}
      createItem={(data) => api.createHeroSlide(data as Omit<HeroSlide, 'id'>)}
      updateItem={api.updateHeroSlide}
      deleteItem={api.deleteHeroSlide}
      getEmptyItem={() => ({ image: '', label: '', order: 0, isPublished: true })}
      renderPreview={item => (
        <div className="flex items-center gap-4 flex-1">
          <img src={item.image} alt={item.label} className="w-24 h-14 object-cover rounded-lg" />
          <div>
            <p className="font-medium text-gray-900">{item.label}</p>
            <p className="text-xs text-gray-500 truncate max-w-md">{item.image}</p>
          </div>
        </div>
      )}
      renderForm={(item, onChange) => (
        <>
          <FieldInput label="Label" value={(item.label as string) ?? ''} onChange={v => onChange('label', v)} />
          <FieldInput label="Image URL" value={(item.image as string) ?? ''} onChange={v => onChange('image', v)} />
        </>
      )}
    />
  );
}
