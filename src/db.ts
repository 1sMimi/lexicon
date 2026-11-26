import Dexie, { type EntityTable } from 'dexie';
import { DefaultScheduler } from 'ts-fsrs';

export type WordStatus = 'unassessed'|'known'|'unknown'|'learning'|'reviewing'|'mastered';
export interface Word { id:string; word:string; phonetic:string; translation:string; definition:string; pos:string; exchange:string; frequency:number; tags:string[] }
export interface Wordbook { id:string; name:string; wordIds:string[]; source:string; updatedAt?:number }
export interface UserState { id:string; status:WordStatus; bookmarked:boolean; updatedAt:number; masterySource?:'manual' }
export interface Note { id:string; text:string; updatedAt:number }
type Scheduler = Awaited<ReturnType<typeof DefaultScheduler>>;
export type Card = ReturnType<Scheduler['newCard']>;
export interface FsrsCard { id:string; card:Card; updatedAt:number }
export interface ReviewLog { id:string; wordId:string; reviewedAt:number; rating:number; questionType:string; correct:boolean; responseTime:number; retention?:number; log:ReturnType<Scheduler['review']>['revlog'] }
export interface DocumentRecord { id:string; title:string; text:string; format?:string; originalFile?:Blob; folder:string; createdAt:number; updatedAt:number }
export interface Chapter { id:string; documentId:string; title:string; text:string; order:number }
export interface ReadingPosition { id:string; documentId?:string; chapterId?:string; offset:number; updatedAt:number }
export interface Occurrence { id:string; wordId:string; documentId:string; chapterId:string; position:number; sentence:string }
export interface VocabularyTest { id:string; testDate:string; estimatedVocabularySize:number; sourceName:string; sourceURL:string; optionalNotes:string; optionalScreenshot?:string; createdAt:number; updatedAt:number; deletedAt?:number }
export interface Setting {id:string;value:string|number|boolean}
interface Outbox {id:string;table:string;recordId:string;updatedAt:number}
interface Sense {id:string;wordId:string;pos:string;definition:string;translation:string}
interface Membership {id:string;wordbookId:string;wordId:string}
export const db = new Dexie('lexicon') as Dexie & {
 words:EntityTable<Word,'id'>; wordbooks:EntityTable<Wordbook,'id'>; user_word_states:EntityTable<UserState,'id'>; notes:EntityTable<Note,'id'>; fsrs_cards:EntityTable<FsrsCard,'id'>; review_logs:EntityTable<ReviewLog,'id'>; documents:EntityTable<DocumentRecord,'id'>; document_chapters:EntityTable<Chapter,'id'>; reading_positions:EntityTable<ReadingPosition,'id'>; word_occurrences:EntityTable<Occurrence,'id'>; vocabulary_tests:EntityTable<VocabularyTest,'id'>; settings:EntityTable<Setting,'id'>;sync_outbox:EntityTable<Outbox,'id'>;word_senses:EntityTable<Sense,'id'>;wordbook_memberships:EntityTable<Membership,'id'>;
};
db.version(1).stores({words:'id,word,frequency,*tags',wordbooks:'id',user_word_states:'id,status,updatedAt',notes:'id,updatedAt',fsrs_cards:'id,card.dueAt',review_logs:'id,wordId,reviewedAt',documents:'id,updatedAt',document_chapters:'id,documentId',reading_positions:'id',word_occurrences:'id,wordId,documentId',vocabulary_tests:'id,testDate',settings:'id',sync_outbox:'id,updatedAt',word_senses:'id,wordId',wordbook_memberships:'id,wordbookId,wordId'});
export const normalizeWord=(word:string)=>word.trim().normalize('NFC').toLowerCase();
const enqueue=(table:string,recordId:string)=>db.sync_outbox.put({id:crypto.randomUUID(),table,recordId,updatedAt:Date.now()});
export async function setStatus(id:string,status:WordStatus) {
 id=normalizeWord(id);
 await db.transaction('rw',[db.user_word_states,db.sync_outbox],async()=>{const old=await db.user_word_states.get(id);await db.user_word_states.put({id,status,bookmarked:old?.bookmarked??false,updatedAt:Date.now(),...(status==='mastered'?{masterySource:'manual' as const}:{})});await enqueue('user_word_states',id);});
}
export async function setBookmark(id:string,bookmarked:boolean) {
 id=normalizeWord(id);
 await db.transaction('rw',[db.user_word_states,db.sync_outbox],async()=>{const old=await db.user_word_states.get(id);await db.user_word_states.put({...old,id,status:old?.status??'unassessed',bookmarked,updatedAt:Date.now()});await enqueue('user_word_states',id);});
}
export async function saveNote(id:string,text:string) {
 await db.transaction('rw',[db.notes,db.sync_outbox],async()=>{await db.notes.put({id:normalizeWord(id),text,updatedAt:Date.now()});await enqueue('notes',normalizeWord(id));});
}
export async function createWordbook(name:string,wordIds:string[]) {
 const book:Wordbook={id:crypto.randomUUID(),name:name.trim()||'Untitled',wordIds:[...new Set(wordIds.map(normalizeWord))],source:'Personal',updatedAt:Date.now()};
 await db.transaction('rw',[db.words,db.wordbooks,db.wordbook_memberships,db.sync_outbox],async()=>{for(const id of book.wordIds)if(!await db.words.get(id))await db.words.add({id,word:id,phonetic:'',translation:'',definition:'',pos:'',exchange:'',frequency:0,tags:[]});await db.wordbooks.add(book);await db.wordbook_memberships.bulkPut(book.wordIds.map(wordId=>({id:`${book.id}:${wordId}`,wordbookId:book.id,wordId})));await enqueue('wordbooks',book.id);});return book;
}
export async function reviewWord(id:string,rating:1|2|3|4,questionType:string,correct:boolean,responseTime:number) {
 const retention=Number((await db.settings.get('retention'))?.value??0.9);
 const scheduler=await DefaultScheduler({version:'FSRS-6',desiredRetention:Math.min(.97,Math.max(.7,retention)),enableFuzz:false});
 await db.transaction('rw',[db.fsrs_cards,db.review_logs,db.user_word_states,db.sync_outbox],async()=>{
 const now=new Date();const old=await db.fsrs_cards.get(id);const result=scheduler.review({card:old?.card??scheduler.newCard({now}),grade:rating,now});
 const state=await db.user_word_states.get(id);const status:WordStatus=result.card.stability>=30&&result.card.reps>=5&&correct?'mastered':result.card.state===2?'reviewing':'learning';
 await db.fsrs_cards.put({id,card:result.card,updatedAt:+now});
 const eventId=crypto.randomUUID();await db.review_logs.add({id:eventId,wordId:id,reviewedAt:+now,rating,questionType,correct,responseTime:Math.max(0,responseTime),retention:Math.min(.97,Math.max(.7,retention)),log:result.revlog});
 await db.user_word_states.put({id,status,bookmarked:state?.bookmarked??false,updatedAt:+now});
 await enqueue('review_logs',eventId);await enqueue('user_word_states',id);
 });
}
export async function initData() {
 if(await db.settings.get('coreResourceVersion'))return;
 const response=await fetch(`${import.meta.env.BASE_URL}data/core.json`);if(!response.ok)throw new Error('Dictionary resource unavailable. Please retry online.');
 const data=await response.json() as {words:Word[];wordbooks:Wordbook[]};
 await db.transaction('rw',[db.words,db.wordbooks,db.wordbook_memberships,db.settings],async()=>{await db.words.bulkPut(data.words);await db.wordbooks.bulkPut(data.wordbooks);await db.wordbook_memberships.bulkPut(data.wordbooks.flatMap(book=>book.wordIds.map(wordId=>({id:`${book.id}:${wordId}`,wordbookId:book.id,wordId}))));await db.settings.put({id:'coreResourceVersion',value:1});});
}
export async function exportBackup() {
 const tables:Record<string,object[]>={};
 for(const table of db.tables)if(table.name!=='sync_outbox'){
  const rows=await table.toArray();
  for(const row of rows)if(row.originalFile instanceof Blob){
   const bytes=new Uint8Array(await row.originalFile.arrayBuffer());let binary='';
   for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
   row.originalFile={encoding:'base64',type:row.originalFile.type,data:btoa(binary)};
  }
  tables[table.name]=rows;
 }
 return JSON.stringify({format:'lexicon-backup',version:1,createdAt:Date.now(),tables},null,2);
}
const isRecord=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const stringFields:Record<string,string[]>={words:['word','phonetic','translation','definition','pos','exchange'],wordbooks:['name','source'],user_word_states:['status'],notes:['text'],review_logs:['wordId','questionType'],documents:['title','text','folder'],document_chapters:['documentId','title','text'],word_occurrences:['wordId','documentId','chapterId','sentence'],vocabulary_tests:['testDate','sourceName','sourceURL','optionalNotes'],word_senses:['wordId','pos','definition','translation'],wordbook_memberships:['wordbookId','wordId']};
const numberFields:Record<string,string[]>={words:['frequency'],user_word_states:['updatedAt'],notes:['updatedAt'],fsrs_cards:['updatedAt'],review_logs:['reviewedAt','rating','responseTime'],documents:['createdAt','updatedAt'],document_chapters:['order'],reading_positions:['offset','updatedAt'],word_occurrences:['position'],vocabulary_tests:['estimatedVocabularySize','createdAt','updatedAt']};
export function validateRow(name:string,row:Record<string,unknown>) {
 const invalid=()=>{throw new Error(`Invalid ${name} record.`);};
 if((stringFields[name]??[]).some(key=>typeof row[key]!=='string')||(numberFields[name]??[]).some(key=>typeof row[key]!=='number'||!Number.isFinite(row[key])||Number(row[key])<0))invalid();
 if(name==='words'&&(!Array.isArray(row.tags)||row.tags.some(t=>typeof t!=='string')))invalid();
 if(name==='wordbooks'&&(!Array.isArray(row.wordIds)||row.wordIds.some(t=>typeof t!=='string')))invalid();
 if(name==='user_word_states'&&(!['unassessed','known','unknown','learning','reviewing','mastered'].includes(String(row.status))||typeof row.bookmarked!=='boolean'||(row.masterySource!==undefined&&(row.masterySource!=='manual'||row.status!=='mastered'))))invalid();
 if(name==='settings'&&!['string','number','boolean'].includes(typeof row.value))invalid();
 if(name==='review_logs'&&row.retention!==undefined&&(typeof row.retention!=='number'||!Number.isFinite(row.retention)||row.retention<.7||row.retention>.97))invalid();
 if(name==='review_logs'&&(!isRecord(row.log)||typeof row.correct!=='boolean'||![1,2,3,4].includes(Number(row.rating))))invalid();
 if(name==='vocabulary_tests'&&(!/^\d{4}-\d{2}-\d{2}$/.test(String(row.testDate))||!Number.isFinite(Date.parse(String(row.testDate)))||(row.optionalScreenshot!==undefined&&typeof row.optionalScreenshot!=='string')))invalid();
 if(name==='documents'&&row.originalFile!==undefined){
  if(!isRecord(row.originalFile)||row.originalFile.encoding!=='base64'||row.originalFile.type!=='application/pdf'||typeof row.originalFile.data!=='string'||row.originalFile.data.length>56_000_000)return invalid();
  try{const binary=atob(row.originalFile.data);const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));row.originalFile=new Blob([bytes],{type:'application/pdf'});}catch{return invalid();}
 }
 if(name==='fsrs_cards'){
  if(!isRecord(row.card))return invalid();const card=row.card;
  if(['stability','difficulty','reps','lapses','scheduledDays','state'].some(k=>typeof card[k]!=='number'||!Number.isFinite(card[k])||Number(card[k])<0)||!['new','learning','review','relearning'].includes(String(card.scheduleStatus))||!['string','number'].includes(typeof card.cardId)||!Number.isFinite(Date.parse(String(card.dueAt)))||(card.lastReviewAt!==null&&!Number.isFinite(Date.parse(String(card.lastReviewAt)))))invalid();
  card.dueAt=new Date(String(card.dueAt));if(card.lastReviewAt)card.lastReviewAt=new Date(String(card.lastReviewAt));
 }
}
/** Validate the entire import before writing. Preserve local versions and both note texts. */
export async function restoreBackup(text:string) {
 const backup:unknown=JSON.parse(text);if(!isRecord(backup)||backup.format!=='lexicon-backup'||backup.version!==1||!isRecord(backup.tables))throw new Error('Unsupported backup.');
 const allowed=new Set(db.tables.map(t=>t.name).filter(n=>n!=='sync_outbox'));const entries=Object.entries(backup.tables);
 for(const [name,rows]of entries){if(!allowed.has(name)||!Array.isArray(rows)||rows.some(row=>!isRecord(row)||typeof row.id!=='string'||!row.id))throw new Error('Invalid backup records.');for(const row of rows as Record<string,unknown>[])validateRow(name,row);}
 let added=0,conflicts=0;
 await db.transaction('rw',db.tables,async()=>{for(const[name,rows]of entries){for(const row of rows as Record<string,unknown>[]){const existing=await db.table(name).get(row.id as string);if(existing){if(JSON.stringify(existing)!==JSON.stringify(row)){conflicts++;if(name==='notes'&&existing.text!==row.text&&!String(existing.text).includes(String(row.text))){await db.notes.put({id:row.id as string,text:`${existing.text}\n\n--- Restored backup variant ---\n${String(row.text)}`,updatedAt:Date.now()});}}continue;}await db.table(name).add(row);added++;}}});return{added,conflicts};
}

export async function addWordToBook(bookId:string,wordId:string) {
 wordId=normalizeWord(wordId);
 await db.transaction('rw',[db.wordbooks,db.words,db.wordbook_memberships,db.sync_outbox],async()=>{
 const book=await db.wordbooks.get(bookId);if(!book)throw new Error('Wordbook not found.');
 if(!await db.words.get(wordId))await db.words.add({id:wordId,word:wordId,phonetic:'',translation:'',definition:'',pos:'',exchange:'',frequency:0,tags:[]});
 await db.wordbooks.put({...book,wordIds:[...new Set([...book.wordIds,wordId])],updatedAt:Date.now()});
 await db.wordbook_memberships.put({id:`${bookId}:${wordId}`,wordbookId:bookId,wordId});await enqueue('wordbooks',bookId);
 });
}
/** Rebuild derived scheduling after event merge, ordered by event time then stable ID. */
export async function replayReviewLogs(wordId:string) {
 const logs=(await db.review_logs.where('wordId').equals(wordId).toArray()).sort((a,b)=>a.reviewedAt-b.reviewedAt||a.id.localeCompare(b.id));
 if(!logs.length)return;
 const retentions=[...new Set(logs.map(log=>log.retention??.9))];
 const schedulers=new Map(await Promise.all(retentions.map(async retention=>[retention,await DefaultScheduler({version:'FSRS-6',desiredRetention:retention,enableFuzz:false})] as const)));
 const first=schedulers.get(logs[0].retention??.9)!;
 let card=first.newCard({now:new Date(logs[0].reviewedAt)});
 for(const event of logs){if(![1,2,3,4].includes(event.rating))throw new Error('Invalid review event rating.');card=schedulers.get(event.retention??.9)!.review({card,grade:event.rating as 1|2|3|4,now:new Date(event.reviewedAt)}).card;}
 await db.fsrs_cards.put({id:wordId,card,updatedAt:logs[logs.length-1].reviewedAt});
}
