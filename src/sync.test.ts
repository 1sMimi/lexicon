import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { mergeConflict, syncTables, validateConfig } from './sync';
describe('sync boundaries',()=>{
 it('preserves both versions of conflicting notes',()=>{const merged=mergeConflict('notes',{id:'word',text:'Local meaning',updatedAt:2},{id:'word',text:'Remote meaning',updatedAt:3});expect(merged.text).toContain('Local meaning');expect(merged.text).toContain('Remote meaning')});
 it('keeps unique review events immutable',()=>{const remote={id:'event',correct:true};expect(mergeConflict('review_logs',{id:'event',correct:false},remote)).toEqual(remote)});
 it('does not upload reading files, chapters, or derived FSRS cards',()=>{expect(syncTables).not.toContain('documents');expect(syncTables).not.toContain('document_chapters');expect(syncTables).not.toContain('fsrs_cards')});
 it('rejects insecure endpoints and secret keys',()=>{expect(()=>validateConfig({url:'http://example.com',key:'public'})).toThrow('HTTPS');expect(()=>validateConfig({url:'https://example.com',key:'sb_secret_unsafe'})).toThrow('Secret')});
});

import { beforeEach } from 'vitest';
import { db } from './db';
import { syncNow, type SyncProvider, type RemoteRow } from './sync';
beforeEach(async()=>{await db.transaction('rw',db.tables,async()=>{for(const table of db.tables)await table.clear()})});
it('merges cloud notes, avoids repeat writes, and refuses cross-account uploads',async()=>{
 await db.notes.put({id:'word',text:'Local',updatedAt:2});
 let remote:RemoteRow={table_name:'notes',record_id:'word',payload:{id:'word',text:'Cloud',updatedAt:3},version:1,updated_at:'2026-01-01T00:00:00Z'};
 let writes=0;
 const provider:SyncProvider={userId:'account-a',pull:async()=>[remote],push:async(table,row,version)=>{expect(version).toBe(remote.version);writes++;remote={table_name:table,record_id:row.id,payload:row,version:version+1,updated_at:'2026-01-02T00:00:00Z'};return remote}};
 await syncNow(provider);expect((await db.notes.get('word'))?.text).toContain('Local');expect((await db.notes.get('word'))?.text).toContain('Cloud');expect(writes).toBe(1);
 await syncNow(provider);expect(writes).toBe(1);
 await expect(syncNow({...provider,userId:'account-b'})).rejects.toThrow('another account');
});
it('retains local changes and queued work when cloud writes fail',async()=>{
 await db.notes.put({id:'word',text:'Keep this text',updatedAt:1});
 const provider:SyncProvider={userId:'account-a',pull:async()=>[],push:async()=>{throw new Error('Offline')}};
 await expect(syncNow(provider)).rejects.toThrow('Offline');expect((await db.notes.get('word'))?.text).toBe('Keep this text');expect(await db.sync_outbox.count()).toBeGreaterThan(0);
});
