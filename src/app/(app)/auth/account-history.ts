import { cookies } from 'next/headers';

const ACCOUNT_HISTORY_COOKIE = 'ory_auth_account_history';
const ACCOUNT_HISTORY_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const MAX_REMEMBERED_ACCOUNTS = 8;

export type RememberedAccount = {
  id: string;
  identifier: string | null;
  label: string;
  lastSeenAt: number;
};

export async function readAccountHistory() {
  const cookieStore = await cookies();
  const rawHistory = cookieStore.get(ACCOUNT_HISTORY_COOKIE)?.value;

  if (!rawHistory) {
    return [];
  }

  try {
    const parsed = JSON.parse(Buffer.from(rawHistory, 'base64url').toString('utf8')) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeAccount)
      .filter((account): account is RememberedAccount => Boolean(account))
      .slice(0, MAX_REMEMBERED_ACCOUNTS);
  } catch {
    return [];
  }
}

export async function rememberAccount(account: Omit<RememberedAccount, 'lastSeenAt'>) {
  const cookieStore = await cookies();
  const previousAccounts = await readAccountHistory();
  const nextAccount = normalizeAccount({
    ...account,
    lastSeenAt: Date.now(),
  });

  if (!nextAccount) {
    return;
  }

  const nextAccounts = [
    nextAccount,
    ...previousAccounts.filter((previousAccount) => previousAccount.id !== nextAccount.id),
  ].slice(0, MAX_REMEMBERED_ACCOUNTS);

  try {
    cookieStore.set(
      ACCOUNT_HISTORY_COOKIE,
      Buffer.from(JSON.stringify(nextAccounts), 'utf8').toString('base64url'),
      {
        httpOnly: true,
        maxAge: ACCOUNT_HISTORY_MAX_AGE_SECONDS,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    );
  } catch {
    return;
  }
}

function normalizeAccount(value: unknown): RememberedAccount | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = normalizeString(record.id);
  const label = normalizeString(record.label);
  const identifier = normalizeString(record.identifier);
  const lastSeenAt = typeof record.lastSeenAt === 'number' ? record.lastSeenAt : 0;

  if (!id || !label) {
    return null;
  }

  return {
    id,
    identifier,
    label,
    lastSeenAt,
  };
}

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
