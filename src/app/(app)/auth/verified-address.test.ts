import assert from 'node:assert/strict';
import test from 'node:test';
import { getVerifiedEmailStatus } from './verified-address.ts';

test('accepts only the verified address matching the current email trait', () => {
  assert.deepEqual(
    getVerifiedEmailStatus({
      traits: { email: ' Person@Example.com ' },
      verifiable_addresses: [
        { value: 'other@example.com', verified: true, via: 'email' },
        { value: 'person@example.com', verified: true, via: 'email' },
      ],
    }),
    { email: 'person@example.com', verified: true },
  );
});

test('rejects an unverified current email even when another address is verified', () => {
  assert.deepEqual(
    getVerifiedEmailStatus({
      traits: { email: 'person@example.com' },
      verifiable_addresses: [
        { value: 'person@example.com', verified: false, via: 'email' },
        { value: 'other@example.com', verified: true, via: 'email' },
      ],
    }),
    { email: 'person@example.com', verified: false },
  );
});

test('rejects missing and non-email traits', () => {
  assert.deepEqual(getVerifiedEmailStatus({ traits: {} }), { email: null, verified: false });
  assert.deepEqual(getVerifiedEmailStatus({ traits: { email: 42 } }), {
    email: null,
    verified: false,
  });
});

test('does not treat a verified non-email address as a verified email', () => {
  assert.deepEqual(
    getVerifiedEmailStatus({
      traits: { email: 'person@example.com' },
      verifiable_addresses: [{ value: 'person@example.com', verified: true, via: 'sms' }],
    }),
    { email: 'person@example.com', verified: false },
  );
});
