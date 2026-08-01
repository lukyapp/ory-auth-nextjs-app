import { createHash } from 'node:crypto';
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
    const selection = JSON.parse(
      Buffer.from(encodedSelection, 'base64url').toString('utf8'),
    ) as unknown;

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
    value: Buffer.from(JSON.stringify(selection), 'utf8').toString('base64url'),
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
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
