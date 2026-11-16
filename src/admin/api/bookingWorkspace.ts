import { request } from './http';
import type { BookingWorkspace, FollowUpInput } from '../../shared/bookingWorkspace';
const write = (id: string, path: string, method: string, body: unknown) => request<BookingWorkspace>(`/admin/bookings/${id}/${path}`, { method, auth: true, body: JSON.stringify(body) });
export const bookingWorkspaceApi = {
  get: (id: string) => request<BookingWorkspace>(`/admin/bookings/${id}/workspace`, { auth: true }),
  deleteNote: (id: string, noteId: string, revision: number) => write(id, `notes/${noteId}`, 'DELETE', { revision }),
  deleteFollowUp: (id: string, taskId: string, revision: number) => write(id, `follow-ups/${taskId}`, 'DELETE', { revision }),
  createNote: (id: string, body: string, requestId: string) => write(id, 'notes', 'POST', { body, requestId }),
  updateNote: (id: string, noteId: string, data: { revision: number; body?: string; pinned?: boolean }) => write(id, `notes/${noteId}`, 'PATCH', data),
  createFollowUp: (id: string, data: FollowUpInput & { requestId: string; sourceNoteId?: string }) => write(id, 'follow-ups', 'POST', data),
  updateFollowUp: (id: string, taskId: string, data: FollowUpInput & { revision: number }) => write(id, `follow-ups/${taskId}`, 'PATCH', data),
  finishFollowUp: (id: string, taskId: string, data: { revision: number; status: 'completed' | 'cancelled'; outcome?: string }) => write(id, `follow-ups/${taskId}/finish`, 'POST', data),
};
