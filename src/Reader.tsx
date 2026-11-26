import './reader.css';
import PdfPage from './PdfPage';
import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createWordbook, setStatus } from './db';
import { parseDocument, vocabulary, type ImportedChapter } from './reader-import';

export default function Reader({ onWord }: { onWord: (id: string) => void }) {
  const documents = useLiveQuery(() => db.documents.toArray(), []) ?? [];
  const states = useLiveQuery(() => db.user_word_states.toArray(), []) ?? [];
  const [active, setActive] = useState(''); const [originalPages, setOriginalPages] = useState(false); const [chapterId, setChapterId] = useState('');
  const chapters = useLiveQuery(() => active ? db.document_chapters.where('documentId').equals(active).sortBy('order') : [], [active]) ?? [];
  const [title, setTitle] = useState(''); const [folder, setFolder] = useState(''); const [paste, setPaste] = useState('');
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [showVocab, setShowVocab] = useState(false);
  const [fontSize, setFontSize] = useState(22); const [lineHeight, setLineHeight] = useState(1.9); const [width, setWidth] = useState(740);
  const [markings, setMarkings] = useState(true); const [filter, setFilter] = useState('all'); const [selected, setSelected] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null); const document = documents.find(item => item.id === active);
  const chapter = chapters.find(item => item.id === chapterId) ?? chapters[0];
  const stateMap = new Map(states.map(state => [state.id, state]));
  const words = vocabulary(chapter?.text ?? '');
  let tokenOffset = 0;
  const parts = (chapter?.text ?? '').split(/([A-Za-z]+(?:['’-][A-Za-z]+)*)/g).map(text => { const offset = tokenOffset; tokenOffset += text.length; return {text,offset} });
  useEffect(() => { void db.settings.bulkGet(['reader-size','reader-line-height','reader-width','reader-markings']).then(([size,line,width,mark]) => { if(typeof size?.value === 'number')setFontSize(size.value);if(typeof line?.value === 'number')setLineHeight(line.value);if(typeof width?.value === 'number')setWidth(width.value);if(typeof mark?.value === 'boolean')setMarkings(mark.value); }); }, []);
  useEffect(() => { void db.settings.get('reader-active').then(async setting => { if (typeof setting?.value === 'string' && await db.documents.get(setting.value)) setActive(setting.value); }); }, []);
  function openDocument(id:string) { setActive(id); preference('reader-active', id); }
  function preference(id:string,value:string|number|boolean) { void db.settings.put({id,value}).catch(error => setMessage(String(error))); }
  useEffect(() => { setSelected([]); if (!active) return; void db.reading_positions.get(active).then(position => {
    if (position?.chapterId) setChapterId(position.chapterId);
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = position?.offset ?? 0 });
  }); }, [active]);
  useEffect(() => { if (!active || !chapter || !scrollRef.current) return; void db.reading_positions.get(active).then(position => {
    if (scrollRef.current && position?.chapterId === chapter.id) scrollRef.current.scrollTop = position.offset;
  }); }, [active, chapter?.id]);
  async function importChapters(name: string, imported: ImportedChapter[], originalFile?: File) {
    const id = crypto.randomUUID(), now = Date.now();
    await db.transaction('rw', db.documents, db.document_chapters, async () => {
      await db.documents.add({ id, title: name || 'Untitled reading', folder, text: '', ...(originalFile ? { originalFile, format: 'pdf' } : {}), createdAt: now, updatedAt: now });
      await db.document_chapters.bulkAdd(imported.map((part, order) => ({ ...part, id: crypto.randomUUID(), documentId: id, order })));
    }); openDocument(id); setChapterId(''); setPaste(''); setTitle(''); setMessage('Saved on this device.');
  }
  async function addBook(ids: string[]) {
    if (!ids.length) return;
    const existing = await db.words.bulkGet(ids);
    await db.words.bulkPut(ids.filter((_, index) => !existing[index]).map(id => ({ id, word: id, phonetic: '', translation: '', definition: '', pos: '', exchange: '', frequency: 0, tags: [] })));
    await createWordbook(`${document?.title ?? 'Reading'} — ${chapter?.title ?? 'Vocabulary'}`, ids);
    setMessage('Vocabulary saved to Library. Select the wordbook there to study.');
  }
  async function lookup(word: string, position: number) {
    const id = word.toLowerCase().replaceAll('’', "'");
    if (chapter) await db.word_occurrences.put({ id: `${chapter.id}:${position}`, wordId: id, documentId: active, chapterId: chapter.id, position, sentence: chapter.text.slice(Math.max(0, position - 100), position + word.length + 150) });
    onWord(id);
  }
  return <section><div className="row"><h1>Reader</h1>{active && <button onClick={() => openDocument('')}>All readings</button>}</div>
    <p className="muted">Your reading, at your own pace. Files stay on this device.</p>
    {message && <p role="status">{message}</p>}
    {!active ? <><div className="panel"><h2>Bring something to read</h2><div className="grid"><label>Title<input value={title} onChange={e => setTitle(e.target.value)} /></label><label>Folder / course<input value={folder} onChange={e => setFolder(e.target.value)} placeholder="Personal reading" /></label></div>
      <textarea aria-label="Article text" rows={7} value={paste} onChange={e => setPaste(e.target.value)} placeholder="Paste an article or chapter…" />
      <div className="row"><button className="primary" disabled={!paste.trim() || busy} onClick={() => { setBusy(true); void importChapters(title, [{ title: title || 'Article', text: paste }]).catch(error => setMessage(String(error))).finally(() => setBusy(false)) }}>Save article</button>
      <label className="button">{busy ? 'Importing…' : 'Import file'}<input type="file" accept=".txt,.md,.markdown,.pdf,.docx,.epub" disabled={busy} onChange={async e => { const file = e.target.files?.[0]; if (!file) return; setBusy(true); try { await importChapters(title || file.name, await parseDocument(file), file.name.toLowerCase().endsWith('.pdf') ? file : undefined) } catch (error) { setMessage(String(error)) } finally { setBusy(false); e.target.value = '' } }} /></label></div><p className="muted">TXT · Markdown · DOCX · text PDF · DRM-free EPUB. PDF preserves original pages and selectable text alongside reading mode. OCR and DRM are not supported.</p></div>
      <h2>Your readings</h2>{documents.length ? documents.sort((a,b) => b.updatedAt-a.updatedAt).map(item => <button className="reading-row row" key={item.id} onClick={() => { openDocument(item.id); setChapterId('') }}><span><strong>{item.title}</strong><br/><small>{item.folder || 'Unfiled'}</small></span><span>Read →</span></button>) : <p className="empty">Your library is ready for its first reading.</p>}</> : <>
      <h2>{document?.title}</h2><div className="row reader-controls"><label>Chapter<select value={chapter?.id ?? ''} onChange={e => { setChapterId(e.target.value); setSelected([]); if (scrollRef.current) scrollRef.current.scrollTop = 0; void db.reading_positions.put({id:active,documentId:active,chapterId:e.target.value,offset:0,updatedAt:Date.now()}).catch(error => setMessage(String(error))) }} >{chapters.map(part => <option key={part.id} value={part.id}>{part.title}</option>)}</select></label>
      <label>Size<input type="range" min="16" max="32" value={fontSize} onChange={e => {setFontSize(+e.target.value);preference('reader-size',+e.target.value)}} /></label><label>Spacing<input type="range" min="1.4" max="2.4" step="0.1" value={lineHeight} onChange={e => {setLineHeight(+e.target.value);preference('reader-line-height',+e.target.value)}} /></label><label>Width<input type="range" min="400" max="1000" value={width} onChange={e => {setWidth(+e.target.value);preference('reader-width',+e.target.value)}} /></label><label><input type="checkbox" checked={markings} onChange={e => {setMarkings(e.target.checked);preference('reader-markings',e.target.checked)}} /> Word markings</label><button onClick={() => setShowVocab(!showVocab)}>Vocabulary ({words.length})</button></div>
      {document?.originalFile && <label className="row"><input type="checkbox" checked={originalPages} onChange={e => setOriginalPages(e.target.checked)} /> Original PDF pages</label>}
      <p className="muted">Select a word to look it up. Underlines indicate assessed vocabulary; unmarked words are unassessed.</p>
      {showVocab && <div className="panel"><div className="row"><h3>Chapter vocabulary</h3><select aria-label="Filter vocabulary status" value={filter} onChange={e => setFilter(e.target.value)}>{['all','unassessed','known','unknown','learning','reviewing','mastered'].map(status => <option key={status}>{status}</option>)}</select></div>
        <div className="row"><button onClick={() => void addBook(words.map(([id]) => id)).catch(error => setMessage(String(error)))}>Create chapter wordbook</button><button disabled={!selected.length} onClick={() => void addBook(selected).catch(error => setMessage(String(error)))}>Save selected</button>{(['known','unknown'] as const).map(status => <button key={status} disabled={!selected.length} onClick={() => void Promise.all(selected.map(id => setStatus(id,status))).catch(error => setMessage(String(error)))}>Mark {status}</button>)}</div>
        <div style={{maxHeight:320,overflow:'auto'}}>{words.filter(([id]) => filter === 'all' || (stateMap.get(id)?.status ?? 'unassessed') === filter).map(([id,count]) => <div className="row" key={id}><label><input type="checkbox" checked={selected.includes(id)} onChange={e => setSelected(previous => e.target.checked ? [...previous,id] : previous.filter(item => item !== id))}/><button onClick={() => onWord(id)}>{id}</button></label><span>{count} occurrences · {stateMap.get(id)?.status ?? 'unassessed'}</span></div>)}</div><small>Exact forms are kept separate to avoid merging different meanings.</small></div>}
      {originalPages && document?.originalFile && chapter && <PdfPage file={document.originalFile} pageNumber={chapter.order + 1} onWord={word => void lookup(word, Math.max(0, chapter.text.toLowerCase().indexOf(word))).catch(error => setMessage(String(error)))} />}
      <div ref={scrollRef} className="reader-text" style={{fontSize,lineHeight,maxWidth:width,maxHeight:'65vh',overflowY:'auto',whiteSpace:'pre-wrap',margin:'2rem auto'}} onScroll={e => { if (!chapter) return; const offset=e.currentTarget.scrollTop; void db.reading_positions.put({id:active,documentId:active,chapterId:chapter.id,offset,updatedAt:Date.now()}).catch(error => setMessage(`Reading position could not be saved: ${String(error)}`)) }}>
      {parts.map(({text:part,offset},index) => /^[A-Za-z]/.test(part) ? <button key={index} className={`reader-word ${markings ? `word-${stateMap.get(part.toLowerCase())?.status ?? 'unassessed'}` : ''}`} title={stateMap.get(part.toLowerCase())?.status ?? 'unassessed'} onClick={() => void lookup(part,offset).catch(error => setMessage(String(error)))}>{part}</button> : part)}
      </div></>}
  </section>;
}
