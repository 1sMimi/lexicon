import { useEffect, useRef, useState } from 'react';
import { createUserWithEmailAndPassword, GithubAuthProvider, GoogleAuthProvider, onAuthStateChanged, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup, signOut, type User } from 'firebase/auth';
import { firebaseAuth, firebaseProvider } from './firebase-sync';
import { syncNow } from './sync';

const githubEnabled = import.meta.env.VITE_FIREBASE_GITHUB_ENABLED === 'true';
const googleEnabled = import.meta.env.VITE_FIREBASE_GOOGLE_ENABLED === 'true';

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The request failed. Local data was retained.';
}

export default function FirebaseSyncSettings() {
  const [user,setUser]=useState<User|null>(null);
  const [verified,setVerified]=useState(false);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [create,setCreate]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const active=useRef(false);

  useEffect(()=>onAuthStateChanged(firebaseAuth,value=>{setUser(value);setVerified(value?.emailVerified??false);}),[]);
  useEffect(()=>{
    const listener=(event:Event)=>{if(event instanceof CustomEvent&&typeof event.detail==='string')setMessage(event.detail);};
    window.addEventListener('lexicon-firebase-status',listener);
    return ()=>window.removeEventListener('lexicon-firebase-status',listener);
  },[]);

  async function perform(action:()=>Promise<void>) {
    if(active.current)return;
    active.current=true;setBusy(true);setMessage('');
    try { await action(); } catch(error){setMessage(errorMessage(error));}
    finally {active.current=false;setBusy(false);}
  }
  const login=()=>perform(async()=>{
    const result=create?await createUserWithEmailAndPassword(firebaseAuth,email,password):await signInWithEmailAndPassword(firebaseAuth,email,password);
    setPassword('');
    if(create&&!result.user.emailVerified){await sendEmailVerification(result.user);setMessage('Verification email sent. Confirm your address, then return here.');}
  });
  const sync=()=>perform(async()=>{
    if(!user)return;
    const result=await syncNow(firebaseProvider(user.uid));
    setMessage(`Synced ${result.uploaded} uploaded and ${result.downloaded} downloaded records.`);
  });

  return <section className="panel"><h2>Cross-device sync</h2>
    <p className="muted">Sign in to sync your learning records. Reading files stay on this device. Use the same sign-in method on each device.</p>
    {!user?<><form onSubmit={event=>{event.preventDefault();void login();}}>
      <label className="field">Email<input type="email" required autoComplete="username" value={email} onChange={event=>setEmail(event.target.value)}/></label>
      <label className="field">Password<input type="password" required autoComplete={create?'new-password':'current-password'} value={password} onChange={event=>setPassword(event.target.value)}/></label>
      <div className="row"><button className="primary" disabled={busy}>{create?'Create email account':'Sign in with email'}</button><button type="button" disabled={busy} onClick={()=>setCreate(!create)}>{create?'Use an existing account':'Create an account'}</button></div>
    </form><div className="row">
      {googleEnabled && <button className="button" disabled={busy} onClick={()=>void perform(async()=>{await signInWithPopup(firebaseAuth,new GoogleAuthProvider());})}>Continue with Google</button>}
      {githubEnabled && <button className="button" disabled={busy} onClick={()=>void perform(async()=>{await signInWithPopup(firebaseAuth,new GithubAuthProvider());})}>Continue with GitHub</button>}
    </div></>:<>
      <p>Signed in as {user.email??'your account'}</p>
      <div className="row">{verified?<button className="primary" disabled={busy} onClick={()=>void sync()}>Sync now</button>:<>
        <button disabled={busy||!user.email} onClick={()=>void perform(async()=>{await sendEmailVerification(user);setMessage('Verification email sent.');})}>Send verification email</button>
        <button disabled={busy} onClick={()=>void perform(async()=>{await user.reload();await user.getIdToken(true);setVerified(user.emailVerified);if(user.emailVerified)await syncNow(firebaseProvider(user.uid));setMessage(user.emailVerified?'Email verified. Sync complete.':'Your email is still unverified.');})}>I verified my email</button>
      </>}<button disabled={busy} onClick={()=>void perform(()=>signOut(firebaseAuth))}>Sign out</button></div>
    </>}
    {message&&<p role="status">{message}</p>}
  </section>;
}

export function FirebaseSyncLifecycle() {
  useEffect(()=>{
    let disposed=false;
    const run=async(user=firebaseAuth.currentUser)=>{
      if(disposed||!navigator.onLine||!user?.emailVerified)return;
      try {
        const result=await syncNow(firebaseProvider(user.uid));
        if(!disposed)window.dispatchEvent(new CustomEvent('lexicon-firebase-status',{detail:`Synced ${result.uploaded} uploaded and ${result.downloaded} downloaded records.`}));
      }catch(error){if(!disposed)window.dispatchEvent(new CustomEvent('lexicon-firebase-status',{detail:errorMessage(error)}));}
    };
    const unsubscribe=onAuthStateChanged(firebaseAuth,user=>void run(user));
    const online=()=>void run();
    const visible=()=>{if(document.visibilityState==='visible')void run();};
    window.addEventListener('online',online);
    document.addEventListener('visibilitychange',visible);
    return ()=>{disposed=true;unsubscribe();window.removeEventListener('online',online);document.removeEventListener('visibilitychange',visible);};
  },[]);
  return null;
}
