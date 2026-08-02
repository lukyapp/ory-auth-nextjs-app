import { getLogoutFlow } from '@ory/nextjs/app';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { logAuthFlow } from '../../auth-flow-log';
import { resolveAppRedirectUrl, sanitizeLogoutReturnTo } from '../logout-redirect';

export async function GET(request: NextRequest) {
  const requestedReturnTo = sanitizeLogoutReturnTo(request.nextUrl.searchParams.get('return_to'));
  const finalReturnTo = requestedReturnTo ?? '/';
  const kratosReturnTo = toKratosReturnTo(finalReturnTo);

  try {
    const flow = await getLogoutFlow({ returnTo: kratosReturnTo });
    const requestHeaders = await headers();
    const logoutResponse = await fetch(flow.logout_url, {
      headers: {
        cookie: requestHeaders.get('cookie') ?? '',
      },
      redirect: 'manual',
    });
    const location = logoutResponse.headers.get('location');
    const redirectTo = location && !isErrorRedirect(location) ? location : finalReturnTo;
    const response = NextResponse.redirect(resolveAppRedirectUrl(redirectTo, request));

    for (const cookie of getSetCookies(logoutResponse.headers)) {
      response.headers.append('set-cookie', cookie);
    }

    logAuthFlow('logout.kratos.completed', {
      returnTo: finalReturnTo,
      status: logoutResponse.status,
    });

    return response;
  } catch (error: unknown) {
    logAuthFlow('logout.kratos.error', {
      error: error instanceof Error ? error.message : 'unknown',
      returnTo: finalReturnTo,
    });

    return NextResponse.redirect(resolveAppRedirectUrl(finalReturnTo, request));
  }
}

function isErrorRedirect(location: string) {
  try {
    return new URL(location, 'http://localhost').pathname === '/error';
  } catch {
    return false;
  }
}

function toKratosReturnTo(returnTo: string) {
  if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }

  return `/auth/logout/complete?return_to=${encodeURIComponent(returnTo)}`;
}

function getSetCookies(headers: Headers) {
  const headersWithCookies = headers as Headers & { getSetCookie?: () => string[] };
  const cookies = headersWithCookies.getSetCookie?.();

  if (cookies?.length) {
    return cookies;
  }

  const cookie = headers.get('set-cookie');

  return cookie ? [cookie] : [];
}
