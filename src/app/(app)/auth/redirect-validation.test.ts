import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveRegisteredPostLogoutValues,
  validateContinuationUrl,
} from './redirect-validation.ts';

test('requires an exact registered post-logout URI and preserves state', () => {
  const redirect = 'https://client.example/post-logout';
  assert.deepEqual(
    resolveRegisteredPostLogoutValues(
      `https://hydra.example/logout?post_logout_redirect_uri=${encodeURIComponent(redirect)}&state=abc`,
      [redirect],
      'production',
    ),
    { redirectTo: redirect, state: 'abc' },
  );
  assert.throws(() =>
    resolveRegisteredPostLogoutValues(
      'https://hydra.example/logout?post_logout_redirect_uri=https://evil.example',
      [redirect],
      'production',
    ),
  );
});

test('rejects unsafe protocols and production localhost continuations', () => {
  assert.throws(() => validateContinuationUrl('javascript:alert(1)', 'development'));
  assert.throws(() => validateContinuationUrl('http://client.example/callback', 'production'));
  assert.throws(() => validateContinuationUrl('https://localhost/callback', 'production'));
  assert.equal(
    validateContinuationUrl('http://localhost:3000/callback', 'development').hostname,
    'localhost',
  );
});
