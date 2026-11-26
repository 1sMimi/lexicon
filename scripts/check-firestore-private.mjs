// Public, read-only probe: a hosted sync release must not expose anonymous reads.
const serialized = process.env.VITE_FIREBASE_WEB_CONFIG;
if (serialized) {
  const {projectId} = JSON.parse(serialized);
  if (typeof projectId !== 'string' || !/^[a-z][a-z0-9-]{4,29}$/.test(projectId)) {
    throw new Error('Invalid Firebase project identifier.');
  }
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/lexicon-deploy-probe/lexiconRecords`;
  const response = await fetch(url, {signal:AbortSignal.timeout(20_000)});
  const body = await response.json();
  if (response.status !== 403 || body?.error?.status !== 'PERMISSION_DENIED') {
    throw new Error(`Cannot verify anonymous Firestore reads are denied (HTTP ${response.status}). Hosted sync was not deployed.`);
  }
  console.log('Firestore rejects anonymous reads from the Lexicon records collection.');
}
