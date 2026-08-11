import 'server-only';
import { getLogoutFlow } from '@ory/nextjs/app';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logAuthFlow } from '../auth-flow-log';
import { noStoreHeaders } from '../auth-request';
import { HydraFlowError } from '../hydra-flow-error';

export async function performKratosLogout(request: NextRequest, redirectTo: URL) {
  const setCookies = await destroyKratosSession(request, redirectTo);
  return redirectAfterKratosLogout(redirectTo, setCookies);
}

export async function destroyKratosSession(request: NextRequest, returnTo: URL) {
  try {
    const flow = await getLogoutFlow({ returnTo: returnTo.toString() });
    const logoutResponse = await fetch(flow.logout_url, {
      headers: { cookie: request.headers.get('cookie') ?? '' },
      redirect: 'manual',
    });
    const setCookies = getSetCookies(logoutResponse.headers);

    if (logoutResponse.status < 300 || logoutResponse.status >= 400 || !setCookies.length) {
      throw new Error(`Unexpected Kratos logout response (${logoutResponse.status}).`);
    }

    logAuthFlow('logout.kratos.completed', { status: logoutResponse.status });
    return setCookies;
  } catch (error: unknown) {
    logAuthFlow('logout.kratos.failed', {
      errorCode: error instanceof HydraFlowError ? error.code : 'kratos_logout_failed',
    });
    throw new HydraFlowError('Kratos logout failed.', {
      cause: error,
      code: 'kratos_logout_failed',
      description: 'Unable to end your session. Please retry.',
      status: 502,
    });
  }
}

export function redirectAfterKratosLogout(redirectTo: URL, setCookies: string[]) {
  const response = NextResponse.redirect(redirectTo, {
    headers: noStoreHeaders(),
    status: 303,
  });
  for (const cookie of setCookies) response.headers.append('set-cookie', cookie);
  return response;
}

function getSetCookies(headers: Headers) {
  const withCookies = headers as Headers & { getSetCookie?: () => string[] };
  return (
    withCookies.getSetCookie?.() ?? (headers.get('set-cookie') ? [headers.get('set-cookie')!] : [])
  );
}
