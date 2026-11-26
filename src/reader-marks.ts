export interface ReaderMark { id: string; chapterId: string; start: number; end: number; note: string; quote: string }

export function locateText(text: string, query: string, after: number) {
  if (!query.trim()) return -1;
  const index = text.toLowerCase().indexOf(query.toLowerCase(), after);
  return index >= 0 ? index : text.toLowerCase().indexOf(query.toLowerCase());
}

export function readMarks(value: string | number | boolean | undefined): ReaderMark[] {
  if (typeof value !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is ReaderMark => item && typeof item.id === 'string' && typeof item.chapterId === 'string' && Number.isInteger(item.start) && item.start >= 0 && Number.isInteger(item.end) && item.end >= item.start && typeof item.note === 'string' && typeof item.quote === 'string') : [];
  } catch { return []; }
}
