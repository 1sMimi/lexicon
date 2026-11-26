import { lazy, Suspense, useEffect, useState } from 'react';
import { NavLink, Routes, Route, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Home, Library as LibraryIcon, BookOpen, RefreshCw, NotebookPen, ChartNoAxesCombined, Settings as SettingsIcon, ArrowUpRight } from 'lucide-react';
import { db, initData, exportBackup, restoreBackup, saveNote } from './db';
import Library from './Library';
import Study from './Study';
import { currentWordbook, currentWordbookKey } from './wordbook-order';
import AppUpdate from './AppUpdate';
import {DailyReminder, ReminderSettings} from './DailyReminder';
import Reader from './Reader';
import Insights from './Insights';
import WordDetail from './WordDetail';
import StudySettings from './StudySettings';
import DictionaryResources from './DictionaryResources';
import SyncSettings, {SyncLifecycle} from './SyncSettings';
import { firebaseWebConfig } from './firebase-config';
const firebaseConfigured = Boolean(firebaseWebConfig);
const FirebaseSyncSettings = lazy(() => import('./FirebaseSyncSettings'));
const FirebaseSyncLifecycle = lazy(() => import('./FirebaseSyncSettings').then(module => ({default:module.FirebaseSyncLifecycle})));
const nav = [['/','Today',Home],['/library','Library',LibraryIcon],['/reader','Reader',BookOpen],['/study','Study',RefreshCw],['/notes','Notes',NotebookPen],['/insights','Insights',ChartNoAxesCombined]] as const;
function Today() {
  const books = useLiveQuery(() => db.wordbooks.toArray()) ?? [];
  const chosen = useLiveQuery(() => db.settings.get(currentWordbookKey));
  const daily = useLiveQuery(() => db.settings.get('dailyNew'));
  const logs = useLiveQuery(() => db.review_logs.toArray()) ?? [];
  const states = useLiveQuery(() => db.user_word_states.toArray()) ?? [];
  const cards = useLiveQuery(() => db.fsrs_cards.toArray()) ?? [];
  const book = currentWordbook(books, chosen?.value);
  const stateMap = new Map(states.map(state => [state.id, state]));
  const scheduled = new Set(cards.map(card => card.id));
  const introduced = new Map<string,number>();
  for (const log of logs) introduced.set(log.wordId, Math.min(introduced.get(log.wordId) ?? Infinity, log.reviewedAt));
  const dayStart = new Date().setHours(0,0,0,0);
  const remaining = Math.max(0, Number(daily?.value ?? 30) - [...introduced.values()].filter(time => time >= dayStart).length);
  const due = cards.filter(card => +new Date(card.card.dueAt) <= Date.now() && stateMap.get(card.id)?.masterySource !== 'manual').length;
  const newCount = book?.wordIds.filter(id => !scheduled.has(id) && !['known','mastered'].includes(stateMap.get(id)?.status ?? '')).length ?? 0;
  const done = book?.wordIds.filter(id => ['known','learning','reviewing','mastered'].includes(stateMap.get(id)?.status ?? '')).length ?? 0;
  const total = book?.wordIds.length ?? 0;
  const percent = total ? Math.round(done / total * 100) : 0;
  const bookParam = book ? encodeURIComponent(book.id) : '';
  return <>
    <div className="dateline">{new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date())}</div>
    <h1>Words worth<br/><em>remembering.</em></h1><DailyReminder/>
    <div className="study-tiles">
      <Link className="study-tile accent" to={`/study?mode=new${book ? `&book=${bookParam}` : ''}`}><span>01 — NEW WORDS</span><strong>{Math.min(remaining,newCount)}</strong><span>{book?.name ?? 'Current wordbook'}</span><ArrowUpRight/></Link>
      <Link className="study-tile" to="/study?mode=review"><span>02 — REVIEW</span><strong>{due}</strong><span>Due today</span><ArrowUpRight/></Link>
    </div>
    <div className="section-heading"><h2>Current wordbook</h2><Link className="button" to="/library">All wordbooks</Link></div>
    {book && <Link className="book-progress" to={`/library?book=${bookParam}`}><span>{book.name}</span><span className="muted">{percent}%</span><progress value={percent} max={100}/><small>{done.toLocaleString()} / {total.toLocaleString()} words assessed or studied</small></Link>}
  </>;
}
function Notes({onWord}:{onWord:(id:string)=>void}){const notes=useLiveQuery(()=>db.notes.toArray())??[];const [query,setQuery]=useState('');return <><h1>Your marginalia.</h1><p className="muted">One word, one shared notebook. Saved on this device.</p><input className="field" aria-label="Search notes" placeholder="Search words or notes" value={query} onChange={e=>setQuery(e.target.value)}/>{notes.filter(n=>n.text&&`${n.id} ${n.text}`.toLowerCase().includes(query.toLowerCase())).map(n=><article className="note-row" key={n.id}><button className="word-link" onClick={()=>onWord(n.id)}>{n.id}</button><p className="chinese">{n.text}</p><button onClick={()=>void saveNote(n.id,'')}>Delete note</button></article>)}{!notes.some(n=>n.text)&&<p className="empty">Your notes begin with a word. Open any word in Library or Reader to write one.</p>}</>}
function Settings(){const [message,setMessage]=useState('');const [storage,setStorage]=useState('');const [theme,setTheme]=useState(localStorage.getItem('lexicon-theme')??'light');const [weight,setWeight]=useState(localStorage.getItem('lexicon-font-weight')??'medium');useEffect(()=>{document.documentElement.dataset.weight=weight;localStorage.setItem('lexicon-font-weight',weight)},[weight]);const [accent,setAccent]=useState(localStorage.getItem('lexicon-accent')??'lime');useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('lexicon-theme',theme)},[theme]);useEffect(()=>{document.documentElement.dataset.accent=accent;localStorage.setItem('lexicon-accent',accent)},[accent]);useEffect(()=>{void navigator.storage?.estimate().then(s=>setStorage(`${((s.usage??0)/1048576).toFixed(1)} MB used of ${((s.quota??0)/1048576).toFixed(0)} MB available`))},[]);async function backup(){const data=await exportBackup();const url=URL.createObjectURL(new Blob([typeof data==='string'?data:JSON.stringify(data)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`lexicon-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);setMessage('Backup downloaded. Keep it somewhere safe.')}return <><h1>Make it yours.</h1><section className="panel"><h2>Appearance</h2><div className="grid"><label>Theme<select value={theme} onChange={e=>setTheme(e.target.value)}><option value="light">Light</option><option value="dark">Dark</option></select></label><label>Accent<select value={accent} onChange={e=>setAccent(e.target.value)}><option value="lime">Acid Lime</option><option value="blue">Cornflower Blue</option><option value="lilac">Lilac</option><option value="orange">Tangerine</option></select></label><label>Font weight<select value={weight} onChange={e=>setWeight(e.target.value)}><option value="regular">Regular</option><option value="medium">Medium</option><option value="bold">Bold</option></select></label></div></section><StudySettings/><ReminderSettings/><DictionaryResources/><section className="panel"><h2>Your data, in your hands.</h2><p>{storage}</p><p className="muted">Downloaded dictionaries and personal data live in this browser. Browser storage can be cleared or evicted. Keep regular backups.</p><div className="row"><button className="primary" onClick={()=>void backup().catch(e=>setMessage(String(e)))}>Export full backup</button><label className="button">Merge backup<input type="file" accept="application/json,.json" onChange={async e=>{const f=e.target.files?.[0];if(f)try{const result=await restoreBackup(await f.text());setMessage(`Backup merged: ${result.added} records added; ${result.conflicts} existing identities preserved.`)}catch(err){setMessage(String(err))}e.target.value=''}}/></label><button onClick={async()=>setMessage(await navigator.storage?.persist()?'Persistent storage granted.':'This browser did not grant persistent storage. Keep backups.')}>Request persistent storage</button></div><p role="status">{message}</p></section>{firebaseConfigured?<Suspense fallback={<p>Opening sync settings…</p>}><FirebaseSyncSettings/></Suspense>:<SyncSettings/>}<section className="panel"><h2>Dictionary provenance</h2><p>ECDICT · MIT license · Third-party vocabulary lists, not official complete exam lists.</p><a href="https://github.com/skywind3000/ECDICT" target="_blank" rel="noreferrer">View source and license ↗</a></section></>}
export default function App(){const [word,setWord]=useState<string|null>(null);const [ready,setReady]=useState(false);const [error,setError]=useState('');const [online,setOnline]=useState(navigator.onLine);useEffect(()=>{document.documentElement.dataset.weight=localStorage.getItem('lexicon-font-weight')??'medium';document.documentElement.dataset.theme=localStorage.getItem('lexicon-theme')??'light';document.documentElement.dataset.accent=localStorage.getItem('lexicon-accent')??'lime';void initData().then(()=>setReady(true)).catch(e=>setError(String(e)));const update=()=>setOnline(navigator.onLine);window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update)}},[]);return <div className="app-shell">{firebaseConfigured?<Suspense fallback={null}><FirebaseSyncLifecycle/></Suspense>:<SyncLifecycle/>}<aside className="sidebar"><Link to="/" className="brand">lexicon.</Link><p className="tagline">READ. LEARN. REMEMBER.</p><nav>{nav.map(([url,label,Icon])=><NavLink key={url} to={url} end={url==='/'}><Icon size={20}/><span>{label}</span></NavLink>)}</nav><div className="sidebar-bottom"><span className="connection">{online?'● Local-first workspace':'○ Offline · saved on device'}</span><NavLink to="/settings"><SettingsIcon size={18}/> Settings</NavLink></div></aside><div className="main-shell"><header><Link to="/" className="brand mobile-brand">lexicon.</Link><span className="header-label">YOUR PERSONAL WORD WORKSPACE</span><Link to="/settings" aria-label="Settings"><SettingsIcon size={20}/></Link></header><main><AppUpdate/>{error?<div role="alert"><h1>Unable to load dictionary.</h1><p>{error}</p><button onClick={()=>window.location.reload()}>Retry</button></div>:!ready?<div className="empty">Preparing your local dictionary…<p>This first download needs a connection. Your personal records stay on this device.</p></div>:<Routes><Route path="/" element={<Today/>}/><Route path="/library" element={<Library onWord={setWord}/>}/><Route path="/assessment" element={<Library onWord={setWord}/>}/><Route path="/study" element={<Study/>}/><Route path="/reader" element={<Reader onWord={setWord}/>}/><Route path="/insights" element={<Insights/>}/><Route path="/notes" element={<Notes onWord={setWord}/>}/><Route path="/settings" element={<Settings/>}/><Route path="*" element={<Today/>}/></Routes>}</main></div>{word&&<WordDetail key={word} id={word} onClose={()=>setWord(null)}/>}</div>}
