import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAuthIntentTokenWithSecret,
  verifyAuthIntentTokenWithSecret,
} from './auth-intent-core.ts';

const secret = 'a'.repeat(32);
const now = Date.UTC(2026, 7, 2);
const intent = {
  action: 'login-current' as const,
  challenge: 'challenge-a',
  subject: 'subject-a',
};

test('accepts only the exact signed intent', () => {
  const token = createAuthIntentTokenWithSecret(secret, intent, now);
  assert.equal(verifyAuthIntentTokenWithSecret(secret, token, intent, now), true);
  assert.equal(
    verifyAuthIntentTokenWithSecret(secret, token, { ...intent, challenge: 'challenge-b' }, now),
    false,
  );
  assert.equal(
    verifyAuthIntentTokenWithSecret(secret, token, { ...intent, subject: 'subject-b' }, now),
    false,
  );
});

test('rejects missing, tampered, and expired tokens', () => {
  const token = createAuthIntentTokenWithSecret(secret, intent, now);
  assert.equal(verifyAuthIntentTokenWithSecret(secret, null, intent, now), false);
  assert.equal(verifyAuthIntentTokenWithSecret(secret, `${token}x`, intent, now), false);
  assert.equal(
    verifyAuthIntentTokenWithSecret(secret, token, intent, now + 10 * 60 * 1000 + 1_000),
    false,
  );
});

test('binds account, destination, and action', () => {
  const logoutIntent = {
    accountId: 'account-a',
    action: 'logout-cancel' as const,
    challenge: 'challenge-a',
    returnTo: 'https://client.example/post-logout',
    subject: 'subject-a',
  };
  const token = createAuthIntentTokenWithSecret(secret, logoutIntent, now);
  assert.equal(verifyAuthIntentTokenWithSecret(secret, token, logoutIntent, now), true);
  assert.equal(
    verifyAuthIntentTokenWithSecret(
      secret,
      token,
      { ...logoutIntent, action: 'logout-confirm' },
      now,
    ),
    false,
  );
});

test('binds an email verification continuation to its subject and challenge', () => {
  const verificationIntent = {
    action: 'login-verify' as const,
    challenge: 'challenge-a',
    subject: 'subject-a',
  };
  const token = createAuthIntentTokenWithSecret(secret, verificationIntent, now);

  assert.equal(verifyAuthIntentTokenWithSecret(secret, token, verificationIntent, now), true);
  assert.equal(
    verifyAuthIntentTokenWithSecret(
      secret,
      token,
      { ...verificationIntent, subject: 'subject-b' },
      now,
    ),
    false,
  );
});
