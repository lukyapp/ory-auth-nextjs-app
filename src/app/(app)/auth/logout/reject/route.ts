import { NextRequest, NextResponse } from 'next/server';
import { logAuthFlow } from '../../auth-flow-log';
import { toErrorPageHref } from '../../hydra-flow-error';
import { getLogoutRequest } from '../getLogoutRequest';
import { resolveAppRedirectUrl } from '../logout-redirect';
import { rejectLogoutRequest } from '../rejectLogoutRequest';

export async function GET(request: NextRequest) {
  const logoutChallenge = request.nextUrl.searchParams.get('logout_challenge');

  if (!logoutChallenge) {
    return NextResponse.redirect(resolveAppRedirectUrl('/auth/logout', request));
  }

  try {
    const logoutRequest = await getLogoutRequest(logoutChallenge);
    const redirectTo = resolvePostLogoutRedirectUri(logoutRequest.request_url) ?? '/';
    await rejectLogoutRequest(logoutChallenge);

    logAuthFlow('logout.challenge.rejected', {
      logoutChallenge,
      redirectTo,
    });

    return NextResponse.redirect(resolveAppRedirectUrl(redirectTo, request));
  } catch (error: unknown) {
    logAuthFlow('logout.flow.error', {
      error: error instanceof Error ? error.message : 'unknown',
    });

    return NextResponse.redirect(resolveAppRedirectUrl(toErrorPageHref(error), request));
  }
}

function resolvePostLogoutRedirectUri(requestUrl?: string | null) {
  if (!requestUrl) {
    return null;
  }

  try {
    return (
      new URL(requestUrl, 'http://localhost').searchParams
        .get('post_logout_redirect_uri')
        ?.trim() || null
    );
  } catch {
    return null;
  }
}
