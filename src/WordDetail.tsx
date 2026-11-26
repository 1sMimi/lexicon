import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveNote, setStatus, setBookmark, addWordToBook } from './db';

export const statuses = ['unassessed', 'known', 'unknown', 'learning', 'reviewing', 'mastered'] as const;
export function pronounce(word: string, region = 'en-US', rate = 0.85) {
  if (!('speechSynthesis' in window)) return false;
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = region;
  utterance.rate = rate;
  utterance.voice = speechSynthesis.getVoices().find(voice => voice.lang === region) ?? null;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
  return true;
}
export default function WordDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const word = useLiveQuery(() => db.words.get(id), [id]);
  const state = useLiveQuery(() => db.user_word_states.get(id), [id]);
  const note = useLiveQuery(() => db.notes.get(id), [id]);
  const books = useLiveQuery(() => db.wordbooks.toArray()) ?? [];
  const [bookId, setBookId] = useState('');
  const [text, setText] = useState('');
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false); const revision = useRef(0); const drawer = useRef<HTMLElement>(null);
  const [message, setMessage] = useState('');
  const [region, setRegion] = useState('en-US');
  const [rate, setRate] = useState(0.85);
  useEffect(() => { if (!dirtyRef.current) setText(note?.text ?? ''); }, [id, note?.text]);
  useEffect(() => {
    if (!dirty) return;
    const currentRevision = revision.current; const timer = setTimeout(() => { void saveNote(id, text).then(() => { if (currentRevision === revision.current) { dirtyRef.current = false; setDirty(false); } setMessage('Saved on this device'); }).catch(() => setMessage('Save failed. Please retry.')); }, 450);
    return () => clearTimeout(timer);
  }, [text, dirty, id]);
  useEffect(() => { const previous = document.activeElement; drawer.current?.querySelector<HTMLButtonElement>('button')?.focus(); return () => { if (previous instanceof HTMLElement) previous.focus(); }; }, [id]);
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); void close(); } if (event.key === 'Tab') { const elements = drawer.current?.querySelectorAll<HTMLElement>('button, a, input, textarea, select'); if (!elements?.length) return; const first = elements[0], last = elements[elements.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); });
  async function close() { if (dirty) { try { await saveNote(id, text); } catch { setMessage('Save failed. Please retry before closing.'); return; } } onClose(); }
  async function bookmark() { try { await setBookmark(id, !state?.bookmarked); } catch { setMessage('Could not update bookmark.'); } }
  const query = encodeURIComponent(word?.word ?? id);
  return <div className="drawer-backdrop" onClick={() => void close()}><aside ref={drawer} className="dictionary-drawer" role="dialog" aria-modal="true" aria-label="Word details" onClick={event => event.stopPropagation()}>
    <div className="row"><span className="section-label">DICTIONARY</span><button className="button" onClick={() => void close()} aria-label="Close dictionary">Close ×</button></div>
    <h2 className="word-title">{word?.word ?? id}</h2><p className="muted">{word?.phonetic ? `/${word.phonetic}/` : 'Phonetic unavailable'} · {word?.pos || 'Part of speech unavailable'}</p>
    <div className="row wrap"><select aria-label="Pronunciation accent" value={region} onChange={event => setRegion(event.target.value)}><option value="en-US">US</option><option value="en-GB">UK</option></select><button className="button" onClick={() => setMessage(pronounce(word?.word ?? id, region, rate) ? 'Synthetic speech · voice availability depends on your device' : 'Speech is unavailable on this device')}>Listen / repeat</button><label>Speed <input aria-label="Speech speed" type="range" min="0.5" max="1.3" step="0.05" value={rate} onChange={event => setRate(Number(event.target.value))} /></label></div>
    <div className="definition" lang="zh">{word?.translation?.replaceAll('\\n', '\n') || 'No Chinese definition in the downloaded dictionary.'}</div><p className="reading-text">{word?.definition?.replaceAll('\\n', '\n') || 'English definition unavailable.'}</p>
    {word?.exchange && <p className="muted">Word forms: {word.exchange}</p>}
    <div className="row wrap"><a href={`https://www.oxfordlearnersdictionaries.com/definition/english/${query}`} target="_blank" rel="noreferrer">Oxford ↗</a><a href={`https://dictionary.cambridge.org/dictionary/english-chinese-simplified/${query}`} target="_blank" rel="noreferrer">Cambridge ↗</a></div>
    <hr /><label className="field">Vocabulary status<select aria-label="Vocabulary status" value={state?.status ?? 'unassessed'} onChange={event => void setStatus(id, event.target.value as typeof statuses[number]).catch(() => setMessage('Could not save status.'))}>{statuses.filter(status => status !== 'mastered').map(status => <option key={status} value={status}>{status}</option>)}{state?.status === 'mastered' && <option value="mastered">mastered</option>}</select></label><button className="button" onClick={() => void bookmark()}>{state?.bookmarked ? '★ Remove bookmark' : '☆ Bookmark word'}</button>
    <label className="field">Add to a collection<select value={bookId} onChange={event => setBookId(event.target.value)}><option value="">Select a personal wordbook</option>{books.filter(book => book.source.toLowerCase() === 'personal').map(book => <option key={book.id} value={book.id}>{book.name}</option>)}</select></label><button className="button" disabled={!bookId} onClick={() => void addWordToBook(bookId, id).then(() => setMessage('Added to your wordbook.')).catch(() => setMessage('Could not add this word.'))}>Add word</button>
    <label className="field">Personal notes<textarea lang="zh" rows={7} value={text} placeholder="Definitions, examples, collocations, or a memory cue…" onChange={event => { dirtyRef.current = true; revision.current++; setDirty(true); setText(event.target.value); }} /></label><p className="muted" role="status">{message || 'Notes save automatically and belong to this word in every wordbook.'}</p>
  </aside></div>;
}
