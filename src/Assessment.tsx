import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, setStatus } from './db';

export default function Assessment() {
  const books = useLiveQuery(() => db.wordbooks.toArray());
  const saved = useLiveQuery(() => db.settings.get('assessment-book'));
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const book = books?.find(item => item.id === (selected || saved?.value)) ?? books?.find(item => item.name === 'High Frequency 3000');
  const batch = useLiveQuery(async () => {
    if (!book) return [];
    const cursor = Number((await db.settings.get(`assessment-cursor:${book.id}`))?.value ?? 0);
    const assessed = new Set((await db.user_word_states.toArray()).filter(item => item.status !== 'unassessed').map(item => item.id));
    return book.wordIds.map((id, index) => ({id, index})).slice(cursor).filter(item => !assessed.has(item.id)).slice(0, 10);
  }, [book?.id]);
  const [checked, setChecked] = useState<string[]>([]);
  async function mark(ids: string[], status?: 'known' | 'unknown' | 'unassessed') {
    if (!book || !ids.length || busy) return;
    setBusy(true); setError('');
    try {
      await db.transaction('rw', db.user_word_states, db.sync_outbox, db.settings, async () => {
        if (status) for (const id of ids) await setStatus(id, status);
        if (!status) {
          const index = batch?.find(item => item.id === ids[0])?.index;
          if (index !== undefined) await db.settings.put({id:`assessment-cursor:${book.id}`, value:index + 1});
        }
      });
      setChecked([]);
    } catch (failure) { setError(String(failure)); }
    finally { setBusy(false); }
  }
  const current = batch?.[0];
  return <section><h1>Quick assessment</h1><p className="muted">Choose Know it to keep a word out of first-time study. Skip for now leaves it unassessed. You can return to this assessment any time.</p>
    <div className="row"><Link className="button" to="/">Back to Today</Link><button disabled={!book || busy} onClick={() => book && void db.settings.delete(`assessment-cursor:${book.id}`).catch(failure => setError(String(failure)))}>Revisit skipped words</button></div>
    <label className="field">Wordbook<select value={book?.id ?? ''} onChange={event => {const id = event.target.value; setSelected(id); setChecked([]); void db.settings.put({id:'assessment-book',value:id}).catch(failure => setError(String(failure)));}}>{books?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    {current ? <><h2 className="word-title">{current.id}</h2><div className="row"><button className="primary" disabled={busy} onClick={() => void mark([current.id], 'known')}>Know it</button><button disabled={busy} onClick={() => void mark([current.id], 'unknown')}>Don't know it</button><button disabled={busy} onClick={() => void mark([current.id])}>Skip for now</button></div>
    <details className="panel"><summary>Assess several words</summary>{batch.map(item => <label className="row" key={item.id}><input type="checkbox" checked={checked.includes(item.id)} onChange={event => setChecked(previous => event.target.checked ? [...previous,item.id] : previous.filter(id => id !== item.id))}/>{item.id}</label>)}<div className="row"><button disabled={!checked.length || busy} onClick={() => void mark(checked,'known')}>Mark selected known</button><button disabled={!checked.length || busy} onClick={() => void mark(checked,'unknown')}>Mark selected unknown</button></div></details></> : <p className="empty">{batch ? 'No more unassessed words at this position.' : 'Opening wordbook…'}</p>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
