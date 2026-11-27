import type { SyncConfig } from './sync';

export function readHostedSyncConfig(url: unknown, key: unknown): SyncConfig | null {
  if (!url && !key) return null;
  if (typeof url !== 'string' || !url || typeof key !== 'string' || !key) throw new Error('Set both hosted Supabase build variables.');
  if (!URL.canParse(url)) throw new Error('Use an HTTPS Supabase project origin.');
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.pathname !== '/' || endpoint.search || endpoint.hash) throw new Error('Use an HTTPS Supabase project origin.');
  if (!key.startsWith('sb_publishable_')) throw new Error('Use a Supabase publishable key for hosted sync.');
  return { url: endpoint.origin, key };
}

export const hostedSyncConfig = readHostedSyncConfig(import.meta.env?.VITE_SUPABASE_URL, import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY);
