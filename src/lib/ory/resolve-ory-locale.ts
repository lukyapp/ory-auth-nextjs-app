/* eslint-disable */
import { OryLocales } from '@ory/elements-react';
import { cookies, headers } from 'next/headers';

const DEFAULT_LOCALE = 'en';
const COOKIE_NAMES = ['NEXT_LOCALE', 'locale', 'lang', 'i18n_redirected'] as const;
const QUERY_KEYS = ['ui_locales', 'locale', 'lang'] as const;

type SearchParams = Record<string, string | string[] | undefined> | URLSearchParams | undefined;

type FlowLike = {
  oidc_context?: {
    ui_locales?: string | string[] | null;
  } | null;
  request_url?: string | null;
  ui_locales?: string | string[] | null;
} | null;

export type OryLocale = keyof typeof OryLocales;

function isSupportedLocale(value: string): value is OryLocale {
  return value in OryLocales;
}

function normalizeLocale(input?: string | string[] | null): OryLocale | null {
  if (!input) {
    return null;
  }

  const rawValue = Array.isArray(input) ? input.join(' ') : input;
  const candidates = rawValue
    .split(/[,\s]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = String(candidates[index]);

    if (isSupportedLocale(candidate)) {
      return candidate;
    }

    const separatorIndex = candidate.search(/[-_]/);
    const baseLocale = separatorIndex === -1 ? candidate : candidate.slice(0, separatorIndex);
    if (baseLocale && isSupportedLocale(baseLocale)) {
      return baseLocale;
    }
  }

  return null;
}

function getSearchParam(searchParams: SearchParams, key: string): string | null {
  if (!searchParams) {
    return null;
  }

  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(key);
  }

  const value = searchParams[key];
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function extractLocaleFromSearchParams(searchParams: SearchParams): OryLocale | null {
  for (const key of QUERY_KEYS) {
    const locale = normalizeLocale(getSearchParam(searchParams, key));
    if (locale) {
      return locale;
    }
  }

  return null;
}

function extractLocaleFromRequestUrl(requestUrl?: string | null): OryLocale | null {
  if (!requestUrl) {
    return null;
  }

  try {
    const url = new URL(requestUrl);
    return extractLocaleFromSearchParams(url.searchParams);
  } catch {
    return null;
  }
}

function extractLocaleFromFlow(flow?: FlowLike): OryLocale | null {
  if (!flow) {
    return null;
  }

  return (
    normalizeLocale(flow.ui_locales) ??
    normalizeLocale(flow.oidc_context?.ui_locales) ??
    extractLocaleFromRequestUrl(flow.request_url)
  );
}

async function extractLocaleFromCookies(): Promise<OryLocale | null> {
  const cookieStore = await cookies();

  for (const cookieName of COOKIE_NAMES) {
    const locale = normalizeLocale(cookieStore.get(cookieName)?.value);
    if (locale) {
      return locale;
    }
  }

  return null;
}

async function extractLocaleFromHeaders(): Promise<OryLocale | null> {
  const headerStore = await headers();
  return normalizeLocale(headerStore.get('accept-language'));
}

export async function resolveOryLocale(options?: {
  searchParams?: SearchParams;
  flow?: FlowLike;
}): Promise<OryLocale> {
  return (
    extractLocaleFromSearchParams(options?.searchParams) ??
    extractLocaleFromFlow(options?.flow) ??
    (await extractLocaleFromCookies()) ??
    (await extractLocaleFromHeaders()) ??
    DEFAULT_LOCALE
  );
}
