import { db, replayReviewLogs, validateRow } from './db';
export const syncTables = ['words','wordbooks','wordbook_memberships','user_word_states','notes','review_logs','reading_positions','vocabulary_tests','settings'] as const;
type SyncTable = typeof syncTables[number];
export interface SyncRow { id:string; updatedAt?:number; text?:string; [key:string]:unknown }
export interface RemoteRow { table_name:SyncTable;record_id:string;payload:SyncRow;version:number;updated_at:string }
export interface SyncProvider { userId:string; pull(since:string):Promise<RemoteRow[]>; push(table:SyncTable,row:SyncRow,version:number):Promise<RemoteRow|null> }
export interface SyncSession { access_token:string;refresh_token:string;expires_at:number;user:{id:string} }
export interface SyncConfig { url:string;key:string }
interface Metadata { cursor:string;rows:Record<string,{version:number;fingerprint:string}> }
const fingerprint=(row:SyncRow)=>JSON.stringify(row);
export const isSyncedSetting=(id:string)=>['dailyNew','retention','reader-size','reader-line-height','reader-width','reader-markings'].includes(id);
const rowKey=(table:string,id:string)=>`${table}:${id}`;
const isObject=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
export function mergeConflict(table:SyncTable,local:SyncRow,remote:SyncRow):SyncRow {
  if(table==='notes' && local.text!==remote.text) return {...local,text:`${local.text??''}\n\n---\nSync conflict — preserved other-device version:\n${remote.text??''}`,updatedAt:Date.now()};
  if(table==='review_logs') return remote;
  return Number(local.updatedAt??0)>=Number(remote.updatedAt??0)?local:remote;
}
export function validateConfig(config:SyncConfig) {
  const url=new URL(config.url);if(url.protocol!=='https:'||url.username||url.password)throw new Error('Use an HTTPS Supabase project URL.');
  if(!config.key.trim())throw new Error('Enter the public anon or publishable key.');
  if(config.key.startsWith('sb_secret_'))throw new Error('Secret keys must never be used in a browser.');
  if(config.key.split('.').length===3) { try { const claims:unknown=JSON.parse(atob(config.key.split('.')[1]));if(isObject(claims)&&claims.role==='service_role')throw new Error('Service-role keys must never be used in a browser.'); }catch(error){if(error instanceof Error&&error.message.startsWith('Service-role'))throw error;} }
}
export async function authRequest(config:SyncConfig,body:{email:string;password:string}|{refresh_token:string}):Promise<SyncSession> {
 validateConfig(config);const response=await fetch(`${config.url.replace(/\/$/,'')}/auth/v1/token?grant_type=${'email'in body?'password':'refresh_token'}`,{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(!response.ok)throw new Error(`Sign-in failed (${response.status}). Check account details or project settings.`);
 const data:unknown=await response.json();if(!isObject(data)||typeof data.access_token!=='string'||typeof data.refresh_token!=='string'||!isObject(data.user)||typeof data.user.id!=='string')throw new Error('Invalid authentication response.');
 return {access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Number(data.expires_at)||Math.floor(Date.now()/1000)+Number(data.expires_in||3600),user:{id:data.user.id}};
}
function parseRemote(value:unknown):RemoteRow {
 if(!isObject(value)||!syncTables.includes(value.table_name as SyncTable)||typeof value.record_id!=='string'||!isObject(value.payload)||value.payload.id!==value.record_id||typeof value.version!=='number'||typeof value.updated_at!=='string')throw new Error('Invalid cloud row. Sync stopped before applying it.');
 if(value.table_name==='settings'&&!isSyncedSetting(value.record_id))throw new Error('Cloud row contains reserved local settings.');
 validateRow(String(value.table_name),value.payload);
 return value as unknown as RemoteRow;
}
export function supabaseProvider(config:SyncConfig,session:Pick<SyncSession,'access_token'|'user'>):SyncProvider {
 validateConfig(config);const base=config.url.replace(/\/$/,'');
 const headers={apikey:config.key,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'};
 return { userId:session.user.id,
 async pull(since){const all:RemoteRow[]=[];let last:RemoteRow|undefined;for(let page=0;page<200;page++){const query=new URLSearchParams({select:'*',order:'updated_at.asc,table_name.asc,record_id.asc',limit:'500',updated_at:`gte.${since}`});if(last)query.set('or',`(updated_at.gt.${last.updated_at},and(updated_at.eq.${last.updated_at},table_name.gt.${last.table_name}),and(updated_at.eq.${last.updated_at},table_name.eq.${last.table_name},record_id.gt.${JSON.stringify(last.record_id)}))`);const response=await fetch(`${base}/rest/v1/lexicon_records?${query}`,{headers});if(!response.ok)throw new Error(`Cloud read failed (${response.status}). Check migration and account access.`);const json:unknown=await response.json();if(!Array.isArray(json))throw new Error('Invalid cloud response.');const rows=json.map(parseRemote);all.push(...rows);if(rows.length<500)return all;last=rows.at(-1);}throw new Error('Sync batch limit reached; no partial cloud response was applied.');},
 async push(table,row,version){const response=await fetch(`${base}/rest/v1/rpc/lexicon_write`,{method:'POST',headers,body:JSON.stringify({p_table:table,p_id:row.id,p_payload:row,p_version:version})});if(!response.ok)throw new Error(`Cloud write failed (${response.status}); changes remain on this device.`);const json:unknown=await response.json();if(!Array.isArray(json))throw new Error('Invalid cloud response.');return json.length?parseRemote(json[0]):null;}
 };
}
let running:Promise<{uploaded:number;downloaded:number}>|undefined;
export function syncNow(provider:SyncProvider) { if(running)return running;running=runSync(provider).finally(()=>{running=undefined});return running; }
async function runSync(provider:SyncProvider) {
 const owner=await db.settings.get('sync-owner');if(owner&&owner.value!==provider.userId)throw new Error('This browser is bound to another account. Use a separate browser profile to avoid mixing private records.');
 await db.settings.put({id:'sync-owner',value:provider.userId});
 const metaId=`sync-meta:${provider.userId}`;const saved=await db.settings.get(metaId);
 const meta:Metadata=typeof saved?.value==='string'?JSON.parse(saved.value) as Metadata:{cursor:'1970-01-01T00:00:00Z',rows:{}};
 let uploaded=0,downloaded=0;const replay=new Set<string>();
 const remoteRows=await provider.pull(meta.cursor);
 for(const remote of remoteRows){
   const key=rowKey(remote.table_name,remote.record_id),old=meta.rows[key];
   if(old?.version===remote.version){if(remote.updated_at>meta.cursor)meta.cursor=remote.updated_at;continue;}
   await db.transaction('rw',db.table(remote.table_name),db.settings,async()=>{
     const local=await db.table(remote.table_name).get(remote.record_id) as SyncRow|undefined;
     const dirty=local && fingerprint(local)!==old?.fingerprint;
     const next=local&&dirty?mergeConflict(remote.table_name,local,remote.payload):remote.payload;
     await db.table(remote.table_name).put(next);downloaded++;
     meta.rows[key]={version:remote.version,fingerprint:fingerprint(remote.payload)};
     await db.settings.put({id:metaId,value:JSON.stringify(meta)});
     if(remote.table_name==='review_logs'&&typeof next.wordId==='string')replay.add(next.wordId);
   });
   if(remote.updated_at>meta.cursor)meta.cursor=remote.updated_at;
 }
 for(const wordId of replay)await replayReviewLogs(wordId);
 await db.settings.put({id:metaId,value:JSON.stringify(meta)});
 // The snapshot detects every local write, including modules that do not yet enqueue directly.
 const books=await db.wordbooks.toArray();const personalBookIds=new Set(books.filter(book=>book.source==='Personal').map(book=>book.id));const personalIds=new Set(books.filter(book=>book.source==='Personal').flatMap(book=>book.wordIds));
 for(const table of syncTables){
   const rows=await db.table(table).toArray() as SyncRow[];
   for(const row of rows){if(table==='wordbooks'&&!personalBookIds.has(row.id))continue;if(table==='wordbook_memberships'&&!personalBookIds.has(String(row.wordbookId)))continue;if(table==='settings'&&!isSyncedSetting(row.id))continue;if(table==='words'&&!personalIds.has(row.id))continue;
     const key=rowKey(table,row.id),previous=meta.rows[key];if(previous?.fingerprint===fingerprint(row))continue;
     const queueId=`sync:${provider.userId}:${key}`;await db.sync_outbox.put({id:queueId,table,recordId:row.id,updatedAt:Date.now()});
     const result=await provider.push(table,row,previous?.version??0);
     if(!result){await db.settings.put({id:metaId,value:JSON.stringify(meta)});throw new Error('Another device changed this record. Changes are retained; sync again to merge.');}
     meta.rows[key]={version:result.version,fingerprint:fingerprint(row)};await db.transaction('rw',db.settings,db.sync_outbox,async()=>{await db.settings.put({id:metaId,value:JSON.stringify(meta)});await db.sync_outbox.delete(queueId)});uploaded++;
   }
 }
 await db.settings.put({id:metaId,value:JSON.stringify(meta)});await db.settings.put({id:'sync-last',value:Date.now()});
 return {uploaded,downloaded};
}
