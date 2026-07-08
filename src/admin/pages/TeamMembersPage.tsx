import { api } from '../api/client';
import type { TeamMember } from '../types';
import { SimpleOrderedPage, FieldInput } from '../components/SimpleOrderedPage';

export function TeamMembersPage() {
  return (
    <SimpleOrderedPage<TeamMember>
      title="Team Members"
      description="Manage Meet the Team profiles shown on the About page"
      fetchItems={api.getTeamMembers}
      createItem={(data) => api.createTeamMember(data as Omit<TeamMember, 'id'>)}
      updateItem={api.updateTeamMember}
      deleteItem={api.deleteTeamMember}
      getEmptyItem={() => ({
        name: '',
        role: '',
        bio: '',
        photo: '',
        order: 0,
        isPublished: true,
      })}
      renderPreview={item => (
        <div className="flex items-center gap-4 flex-1">
          {item.photo ? (
            <img src={item.photo} alt={item.name} className="w-14 h-14 object-cover rounded-full" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-100" />
          )}
          <div>
            <p className="font-medium text-gray-900">{item.name || 'Untitled'}</p>
            <p className="text-sm text-gray-500">{item.role}</p>
          </div>
        </div>
      )}
      renderForm={(item, onChange) => (
        <>
          <FieldInput label="Name" value={(item.name as string) ?? ''} onChange={v => onChange('name', v)} />
          <FieldInput label="Role" value={(item.role as string) ?? ''} onChange={v => onChange('role', v)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={(item.bio as string) ?? ''}
              onChange={e => onChange('bio', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <FieldInput label="Photo URL" value={(item.photo as string) ?? ''} onChange={v => onChange('photo', v)} />
        </>
      )}
    />
  );
}
