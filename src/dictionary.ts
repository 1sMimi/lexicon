import { db, normalizeWord, type Word } from './db';
export interface DictionaryProvider { lookup(surface:string):Promise<Word|undefined> }
export const localDictionary:DictionaryProvider={lookup:surface=>db.words.get(normalizeWord(surface))};
export async function downloadDictionaryPack(letter:string,onProgress:(percent:number)=>void) {
 if(!/^[a-z]$/.test(letter))throw new Error('Invalid resource.');
 const response=await fetch(`${import.meta.env.BASE_URL}data/dictionary-${letter}.json`);
 if(!response.ok||!response.body)throw new Error('Resource download failed. Try again online.');
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let received=0;const total=Number(response.headers.get('content-length'));
 for(;;){const {done,value}=await reader.read();if(done)break;chunks.push(value);received+=value.length;onProgress(total?Math.min(99,Math.round(received/total*100)):0);}
 const buffer=new Uint8Array(received);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}
 const words=JSON.parse(new TextDecoder().decode(buffer)) as Word[];
 if(!Array.isArray(words)||words.some(w=>typeof w.id!=='string'||typeof w.translation!=='string'))throw new Error('Invalid dictionary resource.');
 await db.transaction('rw',[db.words,db.settings],async()=>{await db.words.bulkPut(words);await db.settings.put({id:`dictionary-pack-${letter}`,value:received});});onProgress(100);
}
