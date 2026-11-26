import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { authRequest, supabaseProvider, syncNow, type SyncSession, type SyncConfig } from './sync';
const sessionKey='lexicon-sync-session';
export default function SyncSettings(){
 const [url,setURL]=useState(''),[key,setKey]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [session,setSession]=useState<SyncSession|null>(null),[message,setMessage]=useState('Not configured. Learning data stays on this device.'),[busy,setBusy]=useState(false);
 useEffect(()=>{const status=(event:Event)=>{if(event instanceof CustomEvent&&typeof event.detail==='string')setMessage(event.detail)};window.addEventListener('lexicon-sync-status',status);return()=>window.removeEventListener('lexicon-sync-status',status)},[]);
 const active=useRef(false);const last=useLiveQuery(()=>db.settings.get('sync-last'),[]);
 useEffect(()=>{void db.settings.get('sync-config').then(record=>{if(typeof record?.value==='string'){const config=JSON.parse(record.value) as SyncConfig;setURL(config.url);setKey(config.key)}});try{const stored=sessionStorage.getItem(sessionKey);if(stored)setSession(JSON.parse(stored) as SyncSession)}catch{sessionStorage.removeItem(sessionKey)}},[]);
 async function sync(){if(!session||active.current)return;active.current=true;setBusy(true);setMessage('Syncing…');try{let current=session;const config={url,key};if(current.expires_at*1000<Date.now()+60000){current=await authRequest(config,{refresh_token:current.refresh_token});setSession(current);sessionStorage.setItem(sessionKey,JSON.stringify(current))}const result=await syncNow(supabaseProvider(config,current));setMessage(`Synced ${result.uploaded} uploaded and ${result.downloaded} downloaded records.`)}catch(error){setMessage(error instanceof Error?error.message:'Sync failed. Local data is retained.')}finally{active.current=false;setBusy(false)}}
 return <section className="panel"><h2>Cross-device sync</h2><p className="muted">Optional Supabase account. Your original reading files stay local. Signing in enables sync of this browser’s learning records to your account.</p>
 <form onSubmit={e=>{e.preventDefault();setBusy(true);void authRequest({url,key},{email,password}).then(async value=>{const owner=await db.settings.get('sync-owner');if(owner&&owner.value!==value.user.id)throw new Error('This browser belongs to another account. Use a separate browser profile.');await db.settings.put({id:'sync-owner',value:value.user.id});await db.settings.put({id:'sync-config',value:JSON.stringify({url,key})});sessionStorage.setItem(sessionKey,JSON.stringify(value));setSession(value);window.dispatchEvent(new Event('lexicon-sync-session'));setPassword('');setMessage('Signed in. Sync enabled.');}).catch(error=>setMessage(error instanceof Error?error.message:'Sign-in failed.')).finally(()=>setBusy(false))}}>
 <label>Supabase project URL<input type="url" required value={url} onChange={e=>setURL(e.target.value)} disabled={!!session} placeholder="https://your-project.supabase.co"/></label><label>Public anon / publishable key<input required value={key} onChange={e=>setKey(e.target.value)} disabled={!!session} autoComplete="off"/></label>
 {!session&&<><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username"/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></label><button className="primary" disabled={busy}>Sign in & enable sync</button></>}
 </form>{session&&<div className="row"><button className="primary" disabled={busy} onClick={()=>void sync()}>{busy?'Syncing…':'Sync now'}</button><button disabled={busy} onClick={()=>{sessionStorage.removeItem(sessionKey);setSession(null);window.dispatchEvent(new Event('lexicon-sync-session'));setMessage('Signed out on this device. Local data is retained.')}}>Sign out</button></div>}
 <p role="status">{message}</p>{typeof last?.value==='number'&&<small>Last synced: {new Date(last.value).toLocaleString()}</small>}<p className="muted">Set up the SQL migration in docs/SYNC.md first. Never enter a service-role or secret key. Use separate browser profiles for different people.</p></section>;
}

/** Mount once at application root so sync does not depend on the Settings route. */
export function SyncLifecycle(){
 useEffect(()=>{
  let disposed=false;let active=false;
  const run=async()=>{if(active||disposed)return;const saved=sessionStorage.getItem(sessionKey);if(!saved)return;active=true;try{const setting=await db.settings.get('sync-config');if(typeof setting?.value!=='string')return;const config=JSON.parse(setting.value) as SyncConfig;let session=JSON.parse(saved) as SyncSession;if(session.expires_at*1000<Date.now()+60000){session=await authRequest(config,{refresh_token:session.refresh_token});sessionStorage.setItem(sessionKey,JSON.stringify(session))}if(!disposed){const result=await syncNow(supabaseProvider(config,session));window.dispatchEvent(new CustomEvent('lexicon-sync-status',{detail:`Synced ${result.uploaded} uploaded and ${result.downloaded} downloaded records.`}))}}catch(error){window.dispatchEvent(new CustomEvent('lexicon-sync-status',{detail:error instanceof Error?error.message:'Sync failed; local data retained.'}))}finally{active=false}};
  const online=()=>{void run()};const visible=()=>{if(document.visibilityState==='visible')void run()};
  window.addEventListener('online',online);window.addEventListener('lexicon-sync-session',online);document.addEventListener('visibilitychange',visible);void run();
  return()=>{disposed=true;window.removeEventListener('online',online);window.removeEventListener('lexicon-sync-session',online);document.removeEventListener('visibilitychange',visible)};
 },[]);return null;
}
