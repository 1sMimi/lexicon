import { expect, it } from 'vitest';
import { readFirebaseWebConfig } from './firebase-config';

it('keeps visitors in the local experience unless a complete web config is supplied', () => {
  expect(readFirebaseWebConfig(undefined)).toBeNull();
  expect(readFirebaseWebConfig('{')).toBeNull();
  expect(readFirebaseWebConfig('{"projectId":"demo"}')).toBeNull();
  const config={apiKey:'public-test',authDomain:'example.invalid',projectId:'demo',appId:'web-app'};
  expect(readFirebaseWebConfig(JSON.stringify({...config,extra:'ignored'}))).toEqual(config);
});
