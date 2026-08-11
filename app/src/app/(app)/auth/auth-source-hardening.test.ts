import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const authRoot = new URL('./', import.meta.url);

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, authRoot), 'utf8');
}

test('Hydra helpers are server-only modules and are not Server Actions', () => {
  for (const file of [
    'login/acceptLoginRequest.ts',
    'login/getLoginRequest.ts',
    'consent/acceptConsentRequest.ts',
    'consent/getConsentRequest.ts',
    'consent/rejectConsentRequest.ts',
    'logout/acceptLogoutRequest.ts',
    'logout/getLogoutRequest.ts',
    'logout/rejectLogoutRequest.ts',
  ]) {
    const contents = source(file);
    assert.match(contents, /import 'server-only'/);
    assert.doesNotMatch(contents, /['"]use server['"]/);
  }
});

test('legacy account and logout GET routes cannot consume challenges', () => {
  for (const file of [
    'login/account/route.ts',
    'login/verification/complete/route.ts',
    'logout/accept/route.ts',
    'logout/reject/route.ts',
  ]) {
    const contents = source(file);
    assert.match(contents, /export async function GET\(\)/);
    assert.match(contents, /Method Not Allowed/);
    assert.match(contents, /status: 405/);
    assert.match(contents, /export async function POST\(/);
  }
});

test('consent submission does not use a closed scope enum or browser grants', () => {
  const contents = source('../../api/consent/submit/route.ts');
  assert.doesNotMatch(contents, /ScopeSchema|z\.enum\(\['openid'/);
  assert.doesNotMatch(contents, /grant_scope:\s*body\./);
  assert.match(contents, /acceptConsentRequest\(\s*body\.consent_challenge/);
});

test('Hydra login acceptance is gated by the verified email check', () => {
  const contents = source('login/acceptLoginRequest.ts');
  const verificationCheck = contents.indexOf('getVerifiedEmailStatus(identity)');
  const hydraClient = contents.indexOf('getOAuth2ApiFetchClient()');

  assert.notEqual(verificationCheck, -1);
  assert.notEqual(hydraClient, -1);
  assert.ok(verificationCheck < hydraClient);
});
