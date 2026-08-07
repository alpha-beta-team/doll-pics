import type { VoiceNoteSummary } from '../types';
import { request, requestBlob } from './http';

export type VoiceNoteTarget = { recordType: 'enquiry' | 'booking'; recordId: string };

export const voiceNotesApi = {
  listVoiceNotes(target: VoiceNoteTarget, signal?: AbortSignal): Promise<VoiceNoteSummary[]> {
    const params = new URLSearchParams(target);
    return request<VoiceNoteSummary[]>(`/admin/voice-notes?${params}`, { auth: true, signal });
  },

  createVoiceNote(target: VoiceNoteTarget, file: Blob, durationSeconds: number, signal?: AbortSignal): Promise<VoiceNoteSummary> {
    const form = new FormData();
    form.set('recordType', target.recordType);
    form.set('recordId', target.recordId);
    form.set('durationSeconds', String(Math.max(1, Math.ceil(durationSeconds))));
    const mimeType = file.type.split(';')[0] || 'audio/webm';
    const extension = mimeType === 'audio/mp4' ? 'm4a' : mimeType === 'audio/ogg' ? 'ogg' : 'webm';
    form.set('file', new File([file], `voice-note.${extension}`, { type: mimeType }));
    return request<VoiceNoteSummary>('/admin/voice-notes', { method: 'POST', auth: true, body: form, signal });
  },

  getVoiceNoteContent(id: string, signal?: AbortSignal): Promise<Blob> {
    return requestBlob(`/admin/voice-notes/${id}/content`, { auth: true, signal });
  },

  async deleteVoiceNote(id: string): Promise<void> {
    await request(`/admin/voice-notes/${id}`, { method: 'DELETE', auth: true });
  },
};
