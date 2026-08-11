import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@/check-env';
import { cookies } from 'next/headers';

const ACCOUNT_SELECTION_COOKIE = 'ory_auth_account_selection';
const ACCOUNT_SELECTION_MAX_AGE_SECONDS = 10 * 60;

type AccountSelection = {
  identifier: string | null;
  loginChallengeHash: string;
};

export async function readAccountSelection(
  loginChallenge?: string | null,
): Promise<AccountSelection | null> {
  if (!loginChallenge) {
    return null;
  }

  const cookieStore = await cookies();
  const encodedSelection = cookieStore.get(ACCOUNT_SELECTION_COOKIE)?.value;

  if (!encodedSelection) {
    return null;
  }

  try {
    const [payload, signature, extra] = encodedSelection.split('.');
    if (!payload || !signature || extra || !isValidSignature(payload, signature)) return null;
    const selection = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as unknown;

    const normalizedSelection = normalizeAccountSelection(selection);

    return normalizedSelection?.loginChallengeHash === hashLoginChallenge(loginChallenge)
      ? normalizedSelection
      : null;
  } catch {
    return null;
  }
}

export function serializeAccountSelection({
  identifier,
  loginChallenge,
}: {
  identifier: string | null;
  loginChallenge: string;
}) {
  const selection: AccountSelection = {
    identifier,
    loginChallengeHash: hashLoginChallenge(loginChallenge),
  };

  return {
    name: ACCOUNT_SELECTION_COOKIE,
    options: {
      httpOnly: true,
      maxAge: ACCOUNT_SELECTION_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    },
    value: signSelection(selection),
  };
}

function normalizeAccountSelection(value: unknown): AccountSelection | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const selection = value as Record<string, unknown>;
  const loginChallengeHash = normalizeString(selection.loginChallengeHash);
  const identifier = normalizeString(selection.identifier);

  if (!loginChallengeHash) {
    return null;
  }

  return { identifier, loginChallengeHash };
}

function hashLoginChallenge(loginChallenge: string) {
  return createHash('sha256').update(loginChallenge).digest('base64url');
}

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 254) : null;
}

function signSelection(selection: AccountSelection) {
  const payload = Buffer.from(JSON.stringify(selection), 'utf8').toString('base64url');
  return `${payload}.${signature(payload)}`;
}

function isValidSignature(payload: string, provided: string) {
  const expected = Buffer.from(signature(payload), 'base64url');
  const actual = Buffer.from(provided, 'base64url');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function signature(payload: string) {
  return createHmac('sha256', env.AUTH_FLOW_SECRET)
    .update('account-selection-v1\0')
    .update(payload)
    .digest('base64url');
}
