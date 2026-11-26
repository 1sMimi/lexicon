import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from './db';
import { localDate, readReminder, reminderDue, reminderKey, type Reminder } from './reminder';

const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const dismissedKey = 'daily-reminder-dismissed';

export function ReminderSettings() {
  const saved = useLiveQuery(() => db.settings.get(reminderKey), [], null);
  const current = readReminder(saved?.value);
  const [error,setError] = useState('');
  async function update(change: (current: Reminder) => Reminder) {
    setError('');
    try {
      await db.transaction('rw', db.settings, async () => {
        const latest = await db.settings.get(reminderKey);
        await db.settings.put({id:reminderKey,value:JSON.stringify(change(readReminder(latest?.value)))});
      });
    } catch { setError('Could not save reminder.'); }
  }
  return <section className="panel"><h2>Daily reminder</h2>
    <p className="muted">Shows on Today while Lexicon is open. Uses this device’s local time.</p>
    <label className="row"><input type="checkbox" checked={current.enabled} onChange={event => {const enabled=event.target.checked;void update(previous=>({...previous,enabled}));}}/> Show a daily study reminder</label>
    {current.enabled && <><label className="field">Reminder time<input type="time" value={current.time} onChange={event=>{const time=event.target.value;if(time)void update(previous=>({...previous,time}));}}/></label>
    <fieldset><legend>Days</legend><div className="row">{days.map((name, day)=><label key={name} className="row"><input type="checkbox" checked={current.days.includes(day)} onChange={event=>{const checked=event.target.checked;void update(previous=>({...previous,days:checked?[...previous.days,day]:previous.days.filter(value=>value!==day)}));}}/>{name}</label>)}</div></fieldset></>}
    {error && <p role="alert">{error}</p>}
  </section>;
}

export function DailyReminder() {
  const saved = useLiveQuery(() => db.settings.bulkGet([reminderKey,dismissedKey]));
  const [now,setNow] = useState(() => new Date());
  const [error,setError] = useState('');
  useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),15_000);return()=>window.clearInterval(timer);},[]);
  if (!saved || !reminderDue(readReminder(saved[0]?.value),now,saved[1]?.value)) return null;
  return <section className="panel" aria-label="Study reminder"><p>Your scheduled study time has arrived.</p><div className="row"><Link className="button primary" to="/study">Open Study</Link><button onClick={()=>void db.settings.put({id:dismissedKey,value:localDate(new Date())}).catch(()=>setError('Could not dismiss reminder.'))}>Dismiss today</button></div>{error && <p role="alert">{error}</p>}</section>;
}
