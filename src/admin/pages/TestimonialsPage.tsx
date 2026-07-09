import { api } from '../api/client';
import type { Testimonial } from '../types';
import { SimpleOrderedPage, FieldInput } from '../components/SimpleOrderedPage';

export function TestimonialsPage() {
  return (
    <SimpleOrderedPage<Testimonial>
      title="Testimonials"
      description="Manage client testimonials"
      fetchItems={api.getTestimonials}
      createItem={(data) => api.createTestimonial(data as Omit<Testimonial, 'id'>)}
      updateItem={api.updateTestimonial}
      deleteItem={api.deleteTestimonial}
      getEmptyItem={() => ({
        name: '', role: '', avatar: '', rating: 5, text: '', likes: 0, reply: '', order: 0, isPublished: true,
      })}
      renderPreview={item => (
        <div className="flex items-start gap-4 flex-1">
          <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full object-cover" />
          <div>
            <p className="font-medium text-gray-900">{item.name}</p>
            <p className="text-sm text-gray-500">{item.role}</p>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.text}</p>
          </div>
        </div>
      )}
      renderForm={(item, onChange) => (
        <>
          <FieldInput label="Name" value={(item.name as string) ?? ''} onChange={v => onChange('name', v)} />
          <FieldInput label="Role" value={(item.role as string) ?? ''} onChange={v => onChange('role', v)} />
          <FieldInput label="Avatar URL" value={(item.avatar as string) ?? ''} onChange={v => onChange('avatar', v)} />
          <FieldInput label="Rating" type="number" value={String(item.rating ?? 5)} onChange={v => onChange('rating', Number(v))} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
            <textarea
              value={(item.text as string) ?? ''}
              onChange={e => onChange('text', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <FieldInput label="Likes" type="number" value={String(item.likes ?? 0)} onChange={v => onChange('likes', Number(v))} />
          <FieldInput label="Reply" value={(item.reply as string) ?? ''} onChange={v => onChange('reply', v)} />
        </>
      )}
    />
  );
}
