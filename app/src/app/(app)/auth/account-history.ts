import 'server-only';
import { env } from '@/check-env';
import { cookies } from 'next/headers';
import {
  accountHistoryIdWithSecret,
  decryptAccountHistoryWithSecret,
  encryptAccountHistoryWithSecret,
} from './account-history-crypto';

const ACCOUNT_HISTORY_COOKIE = 'ory_auth_account_history';
const ACCOUNT_HISTORY_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const MAX_REMEMBERED_ACCOUNTS = 8;
const MAX_COOKIE_VALUE_LENGTH = 3_800;
const MAX_LABEL_LENGTH = 120;
const MAX_IDENTIFIER_LENGTH = 254;
const COOKIE_VERSION = 'v1';

export type RememberedAccount = {
  id: string;
  identifier: string | null;
  label: string;
  lastSeenAt: number;
};

export async function readAccountHistory() {
  return (await readAccountHistoryState()).accounts;
}

async function readAccountHistoryState() {
  const cookieStore = await cookies();
  const rawHistory = cookieStore.get(ACCOUNT_HISTORY_COOKIE)?.value;

  if (!rawHistory) {
    return { accounts: [], legacy: false };
  }

  try {
    const legacy = !rawHistory.startsWith(`${COOKIE_VERSION}.`);
    const parsed = !legacy
      ? decryptAccountHistoryWithSecret(env.AUTH_FLOW_SECRET, rawHistory)
      : JSON.parse(Buffer.from(rawHistory, 'base64url').toString('utf8'));

    if (!Array.isArray(parsed)) {
      return { accounts: [], legacy };
    }

    return {
      accounts: parsed
        .map(normalizeAccount)
        .filter((account): account is RememberedAccount => Boolean(account))
        .slice(0, MAX_REMEMBERED_ACCOUNTS),
      legacy,
    };
  } catch {
    return { accounts: [], legacy: false };
  }
}

export async function serializeAccountHistory(account: Omit<RememberedAccount, 'lastSeenAt'>) {
  const history = await readAccountHistoryState();
  const previousAccounts = history.legacy
    ? history.accounts.map((previousAccount) => ({
        ...previousAccount,
        id: accountHistoryId(previousAccount.id),
      }))
    : history.accounts;
  const nextAccount = normalizeAccount({
    ...account,
    id: accountHistoryId(account.id),
    lastSeenAt: Date.now(),
  });

  if (!nextAccount) {
    return null;
  }

  const nextAccounts: RememberedAccount[] = [
    nextAccount,
    ...previousAccounts.filter((previousAccount) => previousAccount.id !== nextAccount.id),
  ].slice(0, MAX_REMEMBERED_ACCOUNTS);

  let value = encryptAccountHistoryWithSecret(env.AUTH_FLOW_SECRET, nextAccounts);

  while (value.length > MAX_COOKIE_VALUE_LENGTH && nextAccounts.length > 1) {
    nextAccounts.pop();
    value = encryptAccountHistoryWithSecret(env.AUTH_FLOW_SECRET, nextAccounts);
  }

  if (value.length > MAX_COOKIE_VALUE_LENGTH) {
    return null;
  }

  return {
    name: ACCOUNT_HISTORY_COOKIE,
    options: {
      httpOnly: true,
      maxAge: ACCOUNT_HISTORY_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    },
    value,
  };
}

export function accountHistoryId(identityId: string) {
  return accountHistoryIdWithSecret(env.AUTH_FLOW_SECRET, identityId);
}

function normalizeAccount(value: unknown): RememberedAccount | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = normalizeString(record.id, 64);
  const label = normalizeString(record.label, MAX_LABEL_LENGTH);
  const identifier = normalizeString(record.identifier, MAX_IDENTIFIER_LENGTH);
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

function normalizeString(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim().slice(0, maxLength)
    : null;
}
