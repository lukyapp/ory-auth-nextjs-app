import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveLoginChallenge, resolveLoginRequestParameter } from './login-request-policy.ts';

test('detects swapping a query login challenge onto a different Kratos flow challenge', () => {
  assert.deepEqual(
    resolveLoginChallenge({
      flowLoginChallenge: 'flow-challenge',
      queryLoginChallenge: 'query-challenge',
    }),
    {
      loginChallenge: undefined,
      status: 'mismatch',
    },
  );
});

test('uses matching or single-source login challenges', () => {
  assert.equal(
    resolveLoginChallenge({
      flowLoginChallenge: 'challenge-a',
      queryLoginChallenge: 'challenge-a',
    }).loginChallenge,
    'challenge-a',
  );
  assert.equal(
    resolveLoginChallenge({ queryLoginChallenge: 'challenge-a' }).loginChallenge,
    'challenge-a',
  );
  assert.equal(
    resolveLoginChallenge({ flowLoginChallenge: 'challenge-a' }).loginChallenge,
    'challenge-a',
  );
});

test('Hydra request_url prompt cannot be weakened by browser query parameters', () => {
  const requestUrl = 'https://hydra.example/oauth2/auth?prompt=login&max_age=0';

  assert.equal(
    resolveLoginRequestParameter({
      param: 'prompt',
      queryValue: 'none',
      requestUrl,
    }),
    'login',
  );
  assert.equal(
    resolveLoginRequestParameter({
      param: 'max_age',
      queryValue: '',
      requestUrl,
    }),
    '0',
  );
});

test('falls back to browser query parameters only when Hydra did not provide them', () => {
  assert.equal(
    resolveLoginRequestParameter({
      param: 'prompt',
      queryValue: 'select_account',
      requestUrl: 'https://hydra.example/oauth2/auth?client_id=client-a',
    }),
    'select_account',
  );
});
