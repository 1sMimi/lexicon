import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db } from './db';

export default function StudySettings() {
  const settings = useLiveQuery(() => db.settings.toArray()) ?? [];
  const [message, setMessage] = useState('');
  async function save(id: string, value: string | number | boolean) {
    try { await db.settings.put({ id, value }); setMessage('Study preferences saved on this device.'); }
    catch { setMessage('Could not save preferences. Please retry.'); }
  }
  return <section className="panel"><h2>Your study rhythm</h2><div className="grid"><label className="field">Daily new-word limit<select value={Number(settings.find(setting => setting.id === 'dailyNew')?.value ?? 20)} onChange={event => void save('dailyNew', Number(event.target.value))}>{[5, 10, 20, 30, 50, 100].map(value => <option key={value} value={value}>{value} words</option>)}</select></label><label className="field">Target retention<select value={Number(settings.find(setting => setting.id === 'retention')?.value ?? 0.9)} onChange={event => void save('retention', Number(event.target.value))}>{[0.8, 0.85, 0.9, 0.95, 0.97].map(value => <option key={value} value={value}>{Math.round(value * 100)}%</option>)}</select></label></div><p className="muted">Higher target retention means more frequent reviews. Changes apply when a word is next reviewed; existing due dates stay intact.</p><label className="row"><input type="checkbox" checked={Boolean(settings.find(setting => setting.id === 'alwaysShowNotes')?.value ?? false)} onChange={event => void save('alwaysShowNotes', event.target.checked)} /> Show personal notes before answering review questions</label><p className="muted">Notes are always shown during new-word recognition and after answering. Showing them earlier may reveal the answer.</p><p role="status">{message}</p></section>;
}
