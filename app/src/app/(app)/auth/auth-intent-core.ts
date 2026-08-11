import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

const AUTH_INTENT_VERSION = 1;
const AUTH_INTENT_TTL_SECONDS = 10 * 60;

export type AuthIntentAction =
  | 'consent-accept'
  | 'consent-reject'
  | 'login-account'
  | 'login-current'
  | 'login-verify'
  | 'logout-cancel'
  | 'logout-confirm';

export type AuthIntent = {
  accountId?: string | null;
  action: AuthIntentAction;
  challenge?: string | null;
  returnTo?: string | null;
  subject?: string | null;
};

type AuthIntentPayload = AuthIntent & {
  expiresAt: number;
  version: typeof AUTH_INTENT_VERSION;
};

export function createAuthIntentTokenWithSecret(
  secret: string,
  intent: AuthIntent,
  now = Date.now(),
) {
  const payload: AuthIntentPayload = {
    ...normalizeIntent(intent),
    expiresAt: Math.floor(now / 1000) + AUTH_INTENT_TTL_SECONDS,
    version: AUTH_INTENT_VERSION,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encodedPayload}.${sign(secret, encodedPayload)}`;
}

export function verifyAuthIntentTokenWithSecret(
  secret: string,
  token: string | null | undefined,
  expectedIntent: AuthIntent,
  now = Date.now(),
) {
  if (!token) return false;
  const [encodedPayload, encodedSignature, extra] = token.split('.');
  if (!encodedPayload || !encodedSignature || extra) return false;

  const expectedSignature = Buffer.from(sign(secret, encodedPayload), 'base64url');
  const actualSignature = Buffer.from(encodedSignature, 'base64url');
  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as Partial<AuthIntentPayload>;
    const expected = normalizeIntent(expectedIntent);
    return (
      payload.version === AUTH_INTENT_VERSION &&
      typeof payload.expiresAt === 'number' &&
      payload.expiresAt >= Math.floor(now / 1000) &&
      payload.action === expected.action &&
      normalizeOptionalString(payload.challenge) === expected.challenge &&
      normalizeOptionalString(payload.subject) === expected.subject &&
      normalizeOptionalString(payload.accountId) === expected.accountId &&
      normalizeOptionalString(payload.returnTo) === expected.returnTo
    );
  } catch {
    return false;
  }
}

function normalizeIntent(intent: AuthIntent) {
  return {
    accountId: normalizeOptionalString(intent.accountId),
    action: intent.action,
    challenge: normalizeOptionalString(intent.challenge),
    returnTo: normalizeOptionalString(intent.returnTo),
    subject: normalizeOptionalString(intent.subject),
  };
}

function normalizeOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function sign(secret: string, payload: string) {
  return createHmac('sha256', secret)
    .update('ory-auth-intent-v1\0')
    .update(payload)
    .digest('base64url');
}
