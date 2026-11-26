import {useState} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {db} from './db';
import {downloadDictionaryPack} from './dictionary';
export default function DictionaryResources(){
 const settings=useLiveQuery(()=>db.settings.toArray())??[];
 const [letter,setLetter]=useState('a'),[progress,setProgress]=useState<number|null>(null),[message,setMessage]=useState('');
 const loaded=settings.filter(s=>s.id.startsWith('dictionary-pack-'));
 const download=async()=>{setProgress(0);setMessage('');try{await downloadDictionaryPack(letter,setProgress);setMessage(`Dictionary ${letter.toUpperCase()} is available offline.`);}catch(error){setMessage(error instanceof Error?error.message:'Download failed.');}finally{setProgress(null);}};
 return <section className="resource-manager"><h2>Offline dictionary</h2><p>The four study wordbooks are included. Download additional alphabetic dictionary packs for wider offline lookup.</p><p>{loaded.length} of 26 extra packs · {(loaded.reduce((n,s)=>n+Number(s.value),0)/1024/1024).toFixed(1)} MB of dictionary data</p><label>Dictionary pack <select value={letter} onChange={e=>setLetter(e.target.value)}>{Array.from('abcdefghijklmnopqrstuvwxyz').map(l=><option key={l} value={l}>{l.toUpperCase()}{loaded.some(s=>s.id===`dictionary-pack-${l}`)?' — downloaded':''}</option>)}</select></label><button onClick={()=>void download()} disabled={progress!==null}>{progress===null?'Download pack':`Downloading ${progress}%`}</button>{progress!==null&&<progress value={progress} max={100}/>}<p role="status">{message}</p><p>Data: <a href="https://github.com/skywind3000/ECDICT" target="_blank" rel="noreferrer">ECDICT</a> · <a href={`${import.meta.env.BASE_URL}data/ECDICT-LICENSE.txt`} target="_blank" rel="noreferrer">MIT license</a>. Browser storage may be reclaimed; keep a backup.</p></section>;
}
