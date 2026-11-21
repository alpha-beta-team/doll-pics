import { request } from './http';
import type { BookingWorkspace, FollowUpInput } from '../../shared/bookingWorkspace';
export function createWorkspaceApi(resource: 'bookings' | 'enquiries') {
  const prefix = resource === 'enquiries' ? 'workspace/' : '';
  const write = (id: string, path: string, method: string, body: unknown) => request<BookingWorkspace>(`/admin/${resource}/${id}/${prefix}${path}`, { method, auth: true, body: JSON.stringify(body) });
  return {
    get: (id: string) => request<BookingWorkspace>(`/admin/${resource}/${id}/workspace`, { auth: true }),
    deleteNote: (id: string, noteId: string, revision: number) => write(id, `notes/${noteId}`, 'DELETE', { revision }),
    deleteFollowUp: (id: string, taskId: string, revision: number) => write(id, `follow-ups/${taskId}`, 'DELETE', { revision }),
    createNote: (id: string, body: string, requestId: string, pinned = false) => write(id, 'notes', 'POST', { body, requestId, pinned }),
    updateNote: (id: string, noteId: string, data: { revision: number; body?: string; pinned?: boolean }) => write(id, `notes/${noteId}`, 'PATCH', data),
    createFollowUp: (id: string, data: FollowUpInput & { requestId: string; sourceNoteId?: string }) => write(id, 'follow-ups', 'POST', data),
    updateFollowUp: (id: string, taskId: string, data: FollowUpInput & { revision: number }) => write(id, `follow-ups/${taskId}`, 'PATCH', data),
    reopenFollowUp: (id: string, taskId: string, data: { revision: number; dueAt: string; assigneeId: string }) => write(id, `follow-ups/${taskId}/reopen`, 'POST', data),
    finishFollowUp: (id: string, taskId: string, data: { revision: number; status: 'completed' | 'cancelled'; outcome?: string }) => write(id, `follow-ups/${taskId}/finish`, 'POST', data),
  };

}
export const bookingWorkspaceApi = createWorkspaceApi('bookings');
export const enquiryWorkspaceApi = createWorkspaceApi('enquiries');
export type WorkspaceApi = typeof bookingWorkspaceApi;
