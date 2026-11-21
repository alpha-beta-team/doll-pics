export interface WorkflowMilestone {
  key: string; label: string; done: boolean; doneAt?: string; doneBy?: { id: string; name: string };
}
export interface WorkflowStep {
  key: string; label: string; status: 'done' | 'current' | 'upcoming' | 'skipped';
  completedAt?: string; dueAt?: string; milestones: WorkflowMilestone[];
}
export interface BookingWorkflow {
  steps: WorkflowStep[]; cancelledAt?: string;
}
