export const studyMeaningKey = (wordId: string) => `study-meaning:${wordId}`;

export function readStudyMeaning(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 500) : '';
}
