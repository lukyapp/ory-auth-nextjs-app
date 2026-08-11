import assert from 'node:assert/strict';
import test from 'node:test';
import {
  accountHistoryIdWithSecret,
  decryptAccountHistoryWithSecret,
  encryptAccountHistoryWithSecret,
} from './account-history-crypto.ts';

const secret = 'a'.repeat(32);

test('encrypts account history and pseudonymizes stable identity IDs', () => {
  const accounts = [{ id: 'identity-id', identifier: 'user@example.com', label: 'User' }];
  const encrypted = encryptAccountHistoryWithSecret(secret, accounts);
  assert.equal(encrypted.startsWith('v1.'), true);
  assert.equal(encrypted.includes('identity-id'), false);
  assert.deepEqual(decryptAccountHistoryWithSecret(secret, encrypted), accounts);
  assert.equal(
    accountHistoryIdWithSecret(secret, 'identity-id'),
    accountHistoryIdWithSecret(secret, 'identity-id'),
  );
  assert.notEqual(accountHistoryIdWithSecret(secret, 'identity-id'), 'identity-id');
});

test('rejects account history tampering and the wrong key', () => {
  const encrypted = encryptAccountHistoryWithSecret(secret, [{ id: 'account' }]);
  assert.throws(() => decryptAccountHistoryWithSecret(secret, `${encrypted}x`));
  assert.throws(() => decryptAccountHistoryWithSecret('b'.repeat(32), encrypted));
});
