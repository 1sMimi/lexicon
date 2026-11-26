export interface RecallTask { id: string; due: number; firstCorrect?: boolean; responseTime?: number }
export interface StudyDraft { step: number; pending: RecallTask[]; completed: string[] }
export const emptyDraft = (): StudyDraft => ({ step: 0, pending: [], completed: [] });

export function nextRecall(draft: StudyDraft, canIntroduce: boolean) {
  return [...draft.pending].sort((a, b) => a.due - b.due)
    .find(task => !canIntroduce || task.due <= draft.step);
}

export function deferRecall(draft: StudyDraft, task: Omit<RecallTask, 'due'>, interval: number) {
  const step = draft.step + 1;
  return { ...draft, step, pending: [...draft.pending.filter(item => item.id !== task.id), { ...task, due: step + interval }] };
}

export function finishTask(draft: StudyDraft, id: string) {
  return { step: draft.step + 1, pending: draft.pending.filter(task => task.id !== id), completed: [...draft.completed, id] };
}
