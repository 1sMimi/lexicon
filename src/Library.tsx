import { useState } from 'react';
import Papa from 'papaparse';
import { readSheet } from 'read-excel-file/browser';
import './study.css';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useSearchParams } from 'react-router-dom';
import { db, createWordbook, normalizeWord, setWordStatuses } from './db';
import { currentWordbook, currentWordbookKey, orderWordbooks } from './wordbook-order';
import { statuses } from './WordDetail';

function download(name: string, content: string, type: string) { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export default function Library({ onWord }: { onWord: (id: string) => void }) {
  const books = orderWordbooks(useLiveQuery(() => db.wordbooks.toArray()) ?? []);
  const current = useLiveQuery(() => db.settings.get(currentWordbookKey));
  const activeId = currentWordbook(books, current?.value)?.id;
  const words = useLiveQuery(() => db.words.toArray()) ?? [];
  const states = useLiveQuery(() => db.user_word_states.toArray()) ?? [];
  const cards = useLiveQuery(() => db.fsrs_cards.toArray()) ?? [];
  const logs = useLiveQuery(() => db.review_logs.toArray()) ?? [];
  const [batchScope,setBatchScope] = useState<string | null>(null);
  const [picked,setPicked] = useState<string[]>([]);
  const [saving,setSaving] = useState(false);
  const [params, setParams] = useSearchParams(); const bookId = params.get('book') ?? '';
  function setBookId(id:string) { setBatchScope(null);setPicked([]);setLimit(80);setParams(previous => { const next = new URLSearchParams(previous); if (id) next.set('book', id); else next.delete('book'); return next; }); }
  const [query, setQuery] = useState(''); const [status, setStatus] = useState('all'); const [sort, setSort] = useState('frequency');
  const [name, setName] = useState(''); const [paste, setPaste] = useState(''); const [message, setMessage] = useState(''); const [limit, setLimit] = useState(80);
  const selected = books.find(book => book.id === bookId); const members = selected ? new Set(selected.wordIds) : null;
  const stateMap = new Map(states.map(state => [state.id, state]));
  const visible = words.filter(word => (!members || members.has(word.id)) && (word.word.includes(query.toLowerCase()) || word.translation.includes(query)) && (status === 'all' || (stateMap.get(word.id)?.status ?? 'unassessed') === status));
  const selecting = batchScope === bookId;
  async function markPicked() {
    setSaving(true);
    try {
      await setWordStatuses(picked,'mastered');
      setMessage(`Marked ${picked.length} words as mastered.`);
      setPicked([]);
    } catch { setMessage('Could not mark the selected words. Try again.'); }
    finally { setSaving(false); }
  }
  const dueMap = new Map(cards.map(card => [card.id, new Date(card.card.dueAt).getTime()]));
  const errors = new Map<string, number>(); for (const log of logs) if (!log.correct) errors.set(log.wordId, (errors.get(log.wordId) ?? 0) + 1);
  visible.sort((a, b) => sort === 'alphabetical' ? a.word.localeCompare(b.word) : sort === 'due' ? (dueMap.get(a.id) ?? Infinity) - (dueMap.get(b.id) ?? Infinity) : sort === 'errors' ? (errors.get(b.id) ?? 0) - (errors.get(a.id) ?? 0) : sort === 'unfamiliar' ? Number(stateMap.get(b.id)?.status === 'unknown') - Number(stateMap.get(a.id)?.status === 'unknown') : (a.frequency || Infinity) - (b.frequency || Infinity));
  const imported = [...new Set(paste.split(/[\n,;\t]+/).map(value => normalizeWord(value.replace(/^"|"$/g, ''))).filter(value => /^[a-z][a-z' -]*$/.test(value)))];
  const existing = new Set(words.map(word => word.id)); const matched = imported.filter(id => existing.has(id));
  async function create() { try { const book = await createWordbook(name.trim(), imported); setBookId(book.id); setName(''); setPaste(''); setMessage(`Created ${book.name} with ${book.wordIds.length} unique words.`); } catch (error) { setMessage(error instanceof Error ? error.message : 'Import failed.'); } }
  return <><div className="page-heading"><h1>{selected ? selected.name : 'All wordbooks'}</h1><p className="muted">One vocabulary. Every wordbook.</p></div>
    {!selected && <div className="book-grid">{books.map(book => <button key={book.id} className={`book-tile ${bookId === book.id ? 'selected' : ''}`} onClick={() => { setBookId(book.id); setLimit(80); }}><span className="section-label">{book.source.toLowerCase() === 'personal' ? 'PERSONAL COLLECTION' : 'WORDBOOK'}</span><h2>{book.name}</h2><span className="muted">{book.wordIds.length.toLocaleString()} words</span></button>)}</div>}
    <div className="row wrap">{selected ? <><button onClick={()=>setBookId('')}>All wordbooks</button><Link className="button primary" to={`/study?book=${encodeURIComponent(selected.id)}`}>Study this wordbook ↗</Link><button disabled={activeId===selected.id} onClick={()=>void db.settings.put({id:currentWordbookKey,value:selected.id}).then(()=>setMessage('Current wordbook updated.')).catch(()=>setMessage('Could not change the current wordbook.'))}>{activeId===selected.id?'Current wordbook':'Set as current wordbook'}</button></> : <h2>All downloaded words</h2>}</div>
    <div className="toolbar"><input aria-label="Search vocabulary" value={query} onChange={event => { setQuery(event.target.value); setLimit(80); }} placeholder="Search a word or definition" /><select aria-label="Wordbook" value={bookId} onChange={event => setBookId(event.target.value)}><option value="">All wordbooks</option>{books.map(book => <option value={book.id} key={book.id}>{book.name}</option>)}</select><select aria-label="Vocabulary status filter" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All states</option>{statuses.map(value => <option key={value}>{value}</option>)}</select><select aria-label="Sort vocabulary" value={sort} onChange={event => setSort(event.target.value)}><option value="frequency">Frequency</option><option value="alphabetical">Alphabetical</option><option value="unfamiliar">Unfamiliar first</option><option value="errors">Most errors</option><option value="due">Review priority</option></select></div>
    <p className="muted">{visible.length.toLocaleString()} words · State and notes are shared across collections.</p>
    <div className="row wrap">{selecting ? <><button disabled={saving || !visible.length} onClick={()=>setPicked([...new Set([...picked,...visible.slice(0,limit).map(word=>word.id)])])}>Select visible words</button><button className="primary" disabled={saving || !picked.length} onClick={()=>void markPicked()}>Mark {picked.length} as mastered</button><button disabled={saving} onClick={()=>{setBatchScope(null);setPicked([]);}}>Done</button></> : <button onClick={()=>setBatchScope(bookId)}>Select words</button>}</div>
    {selecting && message && <p role="status">{message}</p>}
    <div className="word-list">{visible.slice(0, limit).map(word => selecting ? <label className="word-row selectable-word" key={word.id}><input type="checkbox" aria-label={`Select ${word.word}`} checked={picked.includes(word.id)} disabled={saving} onChange={event=>setPicked(previous=>event.target.checked?[...previous,word.id]:previous.filter(id=>id!==word.id))}/><span className="vocabulary-word">{word.word}</span><span className="definition" lang="zh">{word.translation?.split('\\n')[0] || 'Definition unavailable'}</span><span className="muted">{stateMap.get(word.id)?.status ?? 'unassessed'}</span></label> : <button className="word-row" key={word.id} onClick={() => onWord(word.id)}><span className="vocabulary-word">{word.word}</span><span className="definition" lang="zh">{word.translation?.split('\\n')[0] || 'Definition unavailable'}</span><span className="muted">{stateMap.get(word.id)?.status ?? 'unassessed'}</span></button>)}</div>{!visible.length && <p className="empty">No words match this selection.</p>}{visible.length > limit && <button className="button" onClick={() => setLimit(limit + 80)}>Show 80 more</button>}
    <div className="row wrap"><button className="button" onClick={() => download('lexicon-words.json', JSON.stringify(visible, null, 2), 'application/json')}>Export JSON</button><button className="button" onClick={() => download('lexicon-words.csv', 'word,translation\n' + visible.map(word => [word.word, word.translation].map(value => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n'), 'text/csv')}>Export CSV</button></div>
    <section className="panel"><h2>Make it yours.</h2><p className="muted">Paste words separated by lines, commas, or semicolons. Unmatched words keep an empty definition for your own notes.</p><label className="field">Wordbook name<input value={name} onChange={event => setName(event.target.value)} placeholder="My reading vocabulary" /></label><label className="field">Words<textarea rows={5} value={paste} onChange={event => setPaste(event.target.value)} placeholder="serendipity\nresilient\nephemeral" /></label><label className="field">Import TXT, CSV, or XLSX (word column)<input type="file" accept=".txt,.csv,.xlsx" onChange={event => { const file = event.target.files?.[0]; if (file) { if (file.size > 2_000_000) { setMessage('Please use a file smaller than 2 MB.'); return; } if (file.name.toLowerCase().endsWith('.xlsx')) { void readSheet(file).then(rows => { const header = rows[0]?.findIndex(cell => /^(word|lemma|term)$/i.test(String(cell ?? '').trim())) ?? -1; setPaste((header >= 0 ? rows.slice(1) : rows).map(row => String(row[header >= 0 ? header : 0] ?? '')).join('\n')); }).catch(() => setMessage('Could not read this XLSX workbook.')); return; } void file.text().then(text => { if (file.name.endsWith('.csv')) { const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true }); if (parsed.errors.length) throw new Error('Invalid CSV'); const rows = parsed.data; const header = rows[0]?.findIndex(cell => /^(word|lemma|term)$/i.test(cell.trim())) ?? -1; setPaste((header >= 0 ? rows.slice(1) : rows).map(row => row[header >= 0 ? header : 0] ?? '').join('\n')); } else setPaste(text); }).catch(() => setMessage('Could not read this file.')); } }} /></label>{imported.length > 0 && <p>{imported.length} unique words · {matched.length} dictionary matches · {imported.length - matched.length} without a downloaded definition</p>}<button className="button primary" disabled={!name.trim() || !imported.length} onClick={() => void create()}>Create wordbook</button></section>{!selecting && <p role="status">{message}</p>}
  </>;
}
