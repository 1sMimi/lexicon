import { expect, it } from 'vitest';
import { readHostedSyncConfig } from './hosted-sync-config';

it('builds a hosted configuration only from an HTTPS origin and publishable key', () => {
  expect(readHostedSyncConfig('', '')).toBeNull();
  expect(readHostedSyncConfig('https://example.supabase.co/', 'sb_publishable_test')).toEqual({
    url: 'https://example.supabase.co', key: 'sb_publishable_test',
  });
  expect(() => readHostedSyncConfig('https://example.supabase.co', 'sb_secret_test')).toThrow();
  expect(() => readHostedSyncConfig('https://example.supabase.co/subpath', 'sb_publishable_test')).toThrow();
  expect(() => readHostedSyncConfig('http://example.supabase.co', 'sb_publishable_test')).toThrow();
  expect(() => readHostedSyncConfig('https://example.supabase.co', undefined)).toThrow();
});
