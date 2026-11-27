import { useEffect, useRef, useState } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { db } from './db';
import { hostedSyncConfig } from './hosted-sync-config';
import { supabaseProvider, syncNow } from './sync';

if (!hostedSyncConfig) throw new Error('Hosted sync is not configured.');
const config = hostedSyncConfig;
const auth = createClient(config.url, config.key, { auth: { flowType: 'pkce' } }).auth;
const githubEnabled = import.meta.env.VITE_SUPABASE_GITHUB_ENABLED === 'true';
const recoveryKey = 'lexicon-supabase-recovery';
const statusEvent = 'lexicon-hosted-sync-status';
const returnURL = new URL('./?auth=return', window.location.href).href;

// The SDK can consume the recovery callback before either React component mounts.
auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY' && session) sessionStorage.setItem(recoveryKey, session.user.id);
  if (event === 'SIGNED_OUT') sessionStorage.removeItem(recoveryKey);
});

function syncLearning(session: Session) {
  return syncNow(supabaseProvider(config, session)).then(({uploaded, downloaded}) =>
    `Synced ${uploaded} uploaded and ${downloaded} downloaded records.`);
}

export default function HostedSyncSettings() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryId, setRecoveryId] = useState(() => sessionStorage.getItem(recoveryKey));
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const emailInput = useRef<HTMLInputElement>(null);
  const active = useRef(false);
  const recovering = Boolean(session && session.user.id === recoveryId);

  useEffect(() => {
    const {data: {subscription}} = auth.onAuthStateChange((event, current) => {
      setSession(current);
      setLoading(false);
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_OUT') setRecoveryId(current?.user.id ?? null);
    });
    const status = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === 'string') setMessage(event.detail);
    };
    window.addEventListener(statusEvent, status);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener(statusEvent, status);
    };
  }, []);

  async function perform(action: () => Promise<string | void>) {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await action();
      if (result) setMessage(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The request failed. Local data is retained.');
    } finally {
      active.current = false;
      setBusy(false);
    }
  }

  function submit() {
    return perform(async () => {
      const credentials = {email: email.trim(), password};
      if (recovering && session) {
        const {error} = await auth.updateUser({password});
        if (error) throw error;
        sessionStorage.removeItem(recoveryKey);
        setRecoveryId(null);
        setPassword('');
        return 'Password updated.';
      }
      if (creating) {
        const {error} = await auth.signUp({...credentials, options: {emailRedirectTo: returnURL}});
        if (error) throw error;
        setPassword('');
        return 'Check your inbox for the confirmation link. Open it in this browser.';
      }
      const {error} = await auth.signInWithPassword(credentials);
      if (error) throw error;
      setPassword('');
    });
  }

  function resetPassword() {
    if (!emailInput.current?.reportValidity()) return;
    void perform(async () => {
      const {error} = await auth.resetPasswordForEmail(email.trim(), {redirectTo: returnURL});
      if (error) throw error;
      return 'If this email is registered, check your inbox for a reset link and open it in this browser.';
    });
  }

  function signOut() {
    return perform(async () => {
      const {error} = await auth.signOut({scope: 'local'});
      if (error) throw error;
      setPassword('');
      return 'Signed out on this device.';
    });
  }

  return <section className="panel"><h2>Cross-device sync</h2>
    <p className="muted">Sync learning records with your account. Original reading files stay on this device.</p>
    {loading ? <p>Checking sign-in…</p> : (!session || recovering) ? <>
      <form onSubmit={event => {event.preventDefault(); void submit();}}>
        {!session && <label className="field">Email<input ref={emailInput} required type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)}/></label>}
        <label className="field">{session ? 'New password' : 'Password'}<input required type="password" autoComplete={session || creating ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)}/></label>
        <div className="row">
          <button className="primary" disabled={busy}>{session ? 'Update password' : creating ? 'Create email account' : 'Sign in with email'}</button>
          {!session && <button type="button" disabled={busy} onClick={() => {setCreating(!creating); setMessage('');}}>{creating ? 'Use an existing account' : 'Create an account'}</button>}
          {!session && !creating && <button type="button" disabled={busy} onClick={resetPassword}>Forgot password?</button>}
          {recovering && <button type="button" disabled={busy} onClick={() => void signOut()}>Cancel and sign out</button>}
        </div>
      </form>
      {!session && githubEnabled && <button disabled={busy} onClick={() => void perform(async () => {
        const {error} = await auth.signInWithOAuth({provider: 'github', options: {redirectTo: returnURL}});
        if (error) throw error;
      })}>Continue with GitHub</button>}
    </> : <>
      <p>Signed in as {session.user.email ?? 'your account'}</p>
      <p className="muted">Choose Sync now to upload this browser’s learning records to your account.</p>
      <div className="row">
        <button className="primary" disabled={busy} onClick={() => void perform(() => syncLearning(session))}>Sync now</button>
        <button disabled={busy} onClick={() => void signOut()}>Sign out</button>
      </div>
    </>}
    {message && <p role="status">{message}</p>}
  </section>;
}

export function HostedSyncLifecycle() {
  const navigate = useNavigate();
  useEffect(() => {
    const current = new URL(window.location.href);
    if (current.searchParams.get('auth') !== 'return') return;
    current.searchParams.delete('auth');
    window.history.replaceState(window.history.state, '', current);
    navigate('/settings', {replace: true});
  }, [navigate]);
  useEffect(() => {
    let disposed = false;
    const run = async (session: Session | null) => {
      if (disposed || !session || !navigator.onLine || sessionStorage.getItem(recoveryKey)) return;
      try {
        const owner = await db.settings.get('sync-owner');
        if (disposed || owner?.value !== session.user.id) return;
        const message = await syncLearning(session);
        if (!disposed) window.dispatchEvent(new CustomEvent(statusEvent, {detail: message}));
      } catch (error) {
        if (!disposed) window.dispatchEvent(new CustomEvent(statusEvent, {detail: error instanceof Error ? error.message : 'Sync failed.'}));
      }
    };
    const {data: {subscription}} = auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') void run(session);
    });
    const online = () => {void auth.getSession().then(({data}) => run(data.session));};
    const visible = () => {if (document.visibilityState === 'visible') online();};
    window.addEventListener('online', online);
    document.addEventListener('visibilitychange', visible);
    return () => {
      disposed = true;
      subscription.unsubscribe();
      window.removeEventListener('online', online);
      document.removeEventListener('visibilitychange', visible);
    };
  }, []);
  return null;
}
