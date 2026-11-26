export function readFirebaseWebConfig(text: unknown) {
  if (typeof text !== 'string' || !text.trim()) return null;
  try {
    const config: unknown = JSON.parse(text);
    if (typeof config !== 'object' || config === null) return null;
    const {apiKey, authDomain, projectId, appId} = config as Record<string, unknown>;
    if (typeof apiKey!=='string'||typeof authDomain!=='string'||typeof projectId!=='string'||typeof appId!=='string'||!apiKey||!authDomain||!projectId||!appId) return null;
    return {apiKey, authDomain, projectId, appId};
  } catch { return null; }
}

export const firebaseWebConfig=readFirebaseWebConfig(import.meta.env.VITE_FIREBASE_WEB_CONFIG);
