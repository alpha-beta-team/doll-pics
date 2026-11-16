export interface WorkspaceActor { id: string; name: string }
export interface WorkspaceChange { at: string; actor: WorkspaceActor; action: string; previous?: Record<string, unknown> }
export interface BookingNote {
  id: string; body: string; pinned: boolean; revision: number;
  createdAt: string; createdBy: WorkspaceActor; updatedAt: string; updatedBy: WorkspaceActor;
  history: WorkspaceChange[];
}
export interface BookingFollowUp {
  id: string; title: string; details: string; dueAt: string; assigneeId: string; assigneeName: string; sourceNoteId?: string;
  status: 'pending' | 'completed' | 'cancelled'; outcome: string; revision: number;
  createdAt: string; createdBy: WorkspaceActor; updatedAt: string; updatedBy: WorkspaceActor; history: WorkspaceChange[];
}
export interface BookingWorkspace {
  notes: BookingNote[]; followUps: BookingFollowUp[]; pendingFollowUpCount: number;
  nextFollowUpId: string; nextFollowUpAt: string | null; followUpNote: string; lastFollowUpCompletedAt?: string;
}
export interface FollowUpInput { title: string; details: string; dueAt: string; assigneeId: string }
