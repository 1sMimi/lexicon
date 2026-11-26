import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { Timestamp, collection, doc, getDocsFromServer, initializeFirestore, limit, orderBy, query, runTransaction, serverTimestamp, startAfter, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { validateRow } from './db';
import { firebaseWebConfig } from './firebase-config';
import { isSyncedSetting, syncTables, type RemoteRow, type SyncProvider } from './sync';

const options=firebaseWebConfig;
if (!options) throw new Error('Firebase Web App configuration is incomplete.');
const projectId=options.projectId;
const app=getApps()[0]??initializeApp(options);
export const firebaseAuth=getAuth(app);
const firestore=initializeFirestore(app,{ignoreUndefinedProperties:true});

function readRow(raw: DocumentData): RemoteRow {
  const {table_name,record_id,payload,version,updated_at}=raw;
  if (!syncTables.includes(table_name) || typeof record_id!=='string' || !payload || typeof payload!=='object' || payload.id!==record_id || !Number.isSafeInteger(version) || version<1 || !(updated_at instanceof Timestamp)) throw new Error('Invalid cloud record.');
  if (table_name==='settings' && !isSyncedSetting(record_id)) throw new Error('Cloud record contains reserved local settings.');
  validateRow(table_name,payload);
  return {table_name,record_id,payload,version,updated_at:updated_at.toDate().toISOString()};
}

export function firebaseProvider(uid: string): SyncProvider {
  const rows=collection(firestore,'users',uid,'lexiconRecords');
  return {
    userId:`firebase:${projectId}:${uid}`,
    async pull(since) {
      const clauses=[where('updated_at','>=',Timestamp.fromDate(new Date(since))),orderBy('updated_at'),limit(500)];
      let after: QueryDocumentSnapshot | undefined;
      const result: RemoteRow[]=[];
      for (let page=0;page<200;page++) {
        const snapshot=await getDocsFromServer(after?query(rows,...clauses,startAfter(after)):query(rows,...clauses));
        result.push(...snapshot.docs.map(item=>readRow(item.data())));
        if (snapshot.size<500) return result;
        after=snapshot.docs.at(-1);
      }
      throw new Error('Sync batch limit reached. No partial cloud response was applied.');
    },
    async push(table,row,version) {
      const reference=doc(rows,encodeURIComponent(`${table}:${row.id}`));
      const next={table_name:table,record_id:row.id,payload:row,version:version+1};
      const saved=await runTransaction(firestore,async transaction=>{
        const previous=await transaction.get(reference);
        if ((previous.exists()?readRow(previous.data()).version:0)!==version) return false;
        transaction.set(reference,{...next,updated_at:serverTimestamp()});
        return true;
      });
      return saved?{...next,updated_at:new Date().toISOString()}:null;
    },
  };
}
