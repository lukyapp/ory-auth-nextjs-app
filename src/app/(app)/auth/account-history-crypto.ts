import 'server-only';
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from 'node:crypto';

const COOKIE_VERSION = 'v1';

export function accountHistoryIdWithSecret(secret: string, identityId: string) {
  return createHmac('sha256', deriveKey(secret, 'account-history-id'))
    .update(identityId)
    .digest('base64url')
    .slice(0, 32);
}

export function encryptAccountHistoryWithSecret(secret: string, value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(secret, 'account-history-cookie'), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return [
    COOKIE_VERSION,
    iv.toString('base64url'),
    ciphertext.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
  ].join('.');
}

export function decryptAccountHistoryWithSecret(secret: string, value: string) {
  const [version, encodedIv, encodedCiphertext, encodedTag, extra] = value.split('.');
  if (version !== COOKIE_VERSION || !encodedIv || !encodedCiphertext || !encodedTag || extra) {
    throw new Error('Invalid account history cookie');
  }
  const decipher = createDecipheriv(
    'aes-256-gcm',
    deriveKey(secret, 'account-history-cookie'),
    Buffer.from(encodedIv, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
  return JSON.parse(
    Buffer.concat([
      decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
      decipher.final(),
    ]).toString('utf8'),
  ) as unknown;
}

function deriveKey(secret: string, info: string) {
  return Buffer.from(hkdfSync('sha256', secret, 'ory-auth-nextjs-app', info, 32));
}
