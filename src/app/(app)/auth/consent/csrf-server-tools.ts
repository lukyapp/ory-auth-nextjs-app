'use server';

import { createHash } from 'crypto';
import { cookies } from 'next/headers';

const CSRF_COOKIE_PREFIX = 'consent_csrf_';
const CSRF_COOKIE_MAX_AGE_SECONDS = 60 * 30;

export async function getConsentCsrfCookieName(consentChallenge: string) {
  const challengeHash = createHash('sha256').update(consentChallenge).digest('hex').slice(0, 24);
  return `${CSRF_COOKIE_PREFIX}${challengeHash}`;
}

export async function generateCsrfCookie(consentChallenge: string) {
  const csrfToken = crypto.randomUUID();
  const cookieStore = await cookies();
  const consentCsrfCookieName = await getConsentCsrfCookieName(consentChallenge);
  cookieStore.set(consentCsrfCookieName, csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: CSRF_COOKIE_MAX_AGE_SECONDS,
  });
  return csrfToken;
}

export async function readConsentCsrfCookie(consentChallenge: string) {
  const cookieStore = await cookies();
  const consentCsrfCookieName = await getConsentCsrfCookieName(consentChallenge);
  return cookieStore.get(consentCsrfCookieName)?.value;
}

export async function clearConsentCsrfCookie(consentChallenge: string) {
  const cookieStore = await cookies();
  const consentCsrfCookieName = await getConsentCsrfCookieName(consentChallenge);
  cookieStore.delete(consentCsrfCookieName);
}
