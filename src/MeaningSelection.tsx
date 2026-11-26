import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Word } from './db';
import { changeMeaningSelection, dictionaryMeanings, excludedMeanings, excludedMeaningsKey } from './study-meaning';

export default function MeaningSelection({word, onMessage}: {word: Word; onMessage: (message: string)=>void}) {
  const key=excludedMeaningsKey(word.id);
  const setting=useLiveQuery(()=>db.settings.get(key),[key]);
  const items=dictionaryMeanings(word.translation,word.definition);
  const [preview,setPreview]=useState<Set<string>|null>(null);
  const hidden=preview??excludedMeanings(setting?.value);
  const gesture=useRef<{timer:ReturnType<typeof setTimeout>; pointer:number; active:boolean; startX:number; startY:number; exclude:boolean; draft:Set<string>}|null>(null);
  const suppressClick=useRef(false);
  useEffect(()=>()=>{if(gesture.current)clearTimeout(gesture.current.timer);},[]);

  function persist(next:Set<string>) {
    setPreview(next);
    void db.settings.put({id:key,value:JSON.stringify([...next])}).catch(()=>{setPreview(null);onMessage('Could not save the study selection.');});
  }
  function toggle(id:string) {
    const next=changeMeaningSelection(items,hidden,id,!hidden.has(id));
    if (next) persist(next); else onMessage('Keep at least one meaning in study.');
  }
  function applyGesture(id:string) {
    const current=gesture.current;
    if (!current) return;
    const next=changeMeaningSelection(items,current.draft,id,current.exclude);
    if (next) {current.draft=next;setPreview(next);} else onMessage('Keep at least one meaning in study.');
  }
  if (items.length<2) return <div className="definition" lang={word.translation?'zh':'en'}>{items[0]?[items[0].prefix,items[0].text].filter(Boolean).join(' '):'Definition unavailable.'}</div>;
  return <section className="meaning-selection" aria-label="Dictionary meanings"
    onPointerMove={event=>{const current=gesture.current;if(!current||event.pointerId!==current.pointer)return;if(!current.active){if(Math.hypot(event.clientX-current.startX,event.clientY-current.startY)>10){clearTimeout(current.timer);gesture.current=null;suppressClick.current=true;}return;}
      const id=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('[data-meaning-id]')?.dataset.meaningId;
      if(id&&items.some(item=>item.id===id)&&current.draft.has(id)!==current.exclude)applyGesture(id);}}
    onPointerUp={event=>{const current=gesture.current;if(!current||event.pointerId!==current.pointer)return;clearTimeout(current.timer);gesture.current=null;if(current.active)persist(current.draft);}}
    onPointerCancel={()=>{if(gesture.current)clearTimeout(gesture.current.timer);gesture.current=null;setPreview(null);}}>
    <div className="row meaning-items" lang={word.translation?'zh':'en'}>
    {items.map(item=><button type="button" key={item.id} className="meaning-chip" data-meaning-id={item.id} aria-pressed={hidden.has(item.id)}
      onContextMenu={event=>event.preventDefault()}
      onPointerDown={event=>{if(event.button!==0)return;suppressClick.current=false;const target=event.currentTarget;const pointer=event.pointerId;target.setPointerCapture(pointer);gesture.current={pointer,active:false,startX:event.clientX,startY:event.clientY,exclude:!hidden.has(item.id),draft:new Set(hidden),timer:setTimeout(()=>{if(!gesture.current)return;gesture.current.active=true;suppressClick.current=true;applyGesture(item.id);},420)};}}
      onClick={event=>{if(suppressClick.current){suppressClick.current=false;return;}if(event.detail>1)return;toggle(item.id);}}>
      {item.prefix && <small>{item.prefix}</small>} {item.text}</button>)}
    </div>
    <p className="muted">Tap a meaning to exclude or restore it. Hold and drag to change several.</p>
  </section>;
}
