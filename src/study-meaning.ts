export const studyMeaningKey = (wordId: string) => `study-meaning:${wordId}`;

export function readStudyMeaning(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 500) : '';
}

export const excludedMeaningsKey = (wordId: string) => `excluded-meanings:${wordId}`;
export interface MeaningItem { id: string; text: string; prefix: string }

export function dictionaryMeanings(translation: string, definition: string): MeaningItem[] {
  const source = translation || definition;
  return source.replaceAll('\\n', '\n').split('\n').flatMap((line, lineIndex) => {
    const parsed = line.trim().match(/^(\[[^\]]+\]|[a-z.]+\.)\s*(.*)$/i);
    const prefix = parsed?.[1] ?? '';
    const text = parsed?.[2] ?? line.trim();
    // English glosses may contain commas that are part of one definition.
    return (translation ? text.split(/[,，;；](?![^(（]*[)）])/) : [text]).map((item, index) => ({
      id: `${lineIndex}:${index}:${prefix}:${item.trim()}`, text: item.trim(), prefix,
    })).filter(item => item.text);
  });
}

export function excludedMeanings(value: unknown): Set<string> {
  if (typeof value !== 'string') return new Set();
  try {
    const parsed: unknown = JSON.parse(value);
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []);
  } catch { return new Set(); }
}

export function changeMeaningSelection(items: MeaningItem[], hidden: Set<string>, id: string, exclude: boolean): Set<string> | null {
  const next = new Set(hidden);
  if (exclude) next.add(id); else next.delete(id);
  return items.some(item=>!next.has(item.id)) ? next : null;
}

export function studyClue(items: MeaningItem[], hidden: Set<string>, custom: string) {
  if (!items.some(item=>hidden.has(item.id))) return custom;
  const visible=items.filter(item=>!hidden.has(item.id));
  return visible.length ? visible.map(item=>[item.prefix,item.text].filter(Boolean).join(' ')).join('；') : custom;
}
