'use server';

import { cookies } from 'next/headers';

export async function generateCsrfCookie() {
  const csrfToken = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set('csrf_token', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 30,
  });
  return csrfToken;
}
