import { useRef, useState } from 'react';
import { api } from '../api/client';
import type { TeamMember } from '../types';
import { SimpleOrderedPage, FieldInput } from '../components/SimpleOrderedPage';
import { ImageCropUpload } from '../components/ImageCropUpload';
import { Upload } from 'lucide-react';

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
        photoOriginal: '',
        photoStorageKey: '',
        imageTransform: null,
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
          <TeamMemberPhotoField
            id={(item.id as string) ?? ''}
            value={(item.photo as string) ?? ''}
            originalValue={(item.photoOriginal as string) ?? ''}
            transform={(item.imageTransform as TeamMember['imageTransform']) ?? null}
            onChange={(field, value) => onChange(field, value)}
          />
        </>
      )}
    />
  );
}

function TeamMemberPhotoField({
  id,
  value,
  originalValue,
  transform,
  onChange,
}: {
  id: string;
  value: string;
  originalValue: string;
  transform: TeamMember['imageTransform'];
  onChange: (field: 'photo' | 'photoOriginal' | 'photoStorageKey' | 'imageTransform', value: unknown) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropSource, setCropSource] = useState<File | string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Profile photo</label>
      <div className="flex items-center gap-4">
        {value ? (
          <img src={value} alt="Team member preview" className="w-20 h-20 rounded-full object-cover border border-gray-200" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-100 border border-gray-200" />
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg"
        >
          <Upload className="w-4 h-4" />
          Upload and crop
        </button>
        {originalValue && (
          <button
            type="button"
            onClick={() => {
              setCropSource(originalValue);
              setError(null);
            }}
            className="px-3 py-2 text-sm text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg"
          >
            Reposition image
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={event => {
            const file = event.target.files?.[0];
            if (file) {
              setSelectedFile(file);
              setCropSource(file);
              setError(null);
            }
            event.target.value = '';
          }}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {cropSource && (
        <ImageCropUpload
          source={cropSource}
          shape="circle"
          initialCrop={transform?.crop ? { ...transform.crop, unit: 'px' } : null}
          initialCropPercentages={transform?.cropPercentages ?? null}
          onCancel={() => {
            setCropSource(null);
            setSelectedFile(null);
          }}
          onApply={async ({ file, transform: nextTransform }) => {
            try {
              const result = id && !selectedFile
                ? await api.updateTeamMemberImage(id, nextTransform)
                : await api.uploadTeamMemberImage(selectedFile ?? file, nextTransform);
              onChange('photo', result.url);
              onChange('photoOriginal', result.originalUrl);
              onChange('photoStorageKey', result.storageKey);
              onChange('imageTransform', result.imageTransform);
              setCropSource(null);
              setSelectedFile(null);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to upload team member image');
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}
