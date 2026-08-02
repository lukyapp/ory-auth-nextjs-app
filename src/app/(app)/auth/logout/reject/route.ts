import { NextRequest, NextResponse } from 'next/server';
import { logAuthFlow } from '../../auth-flow-log';
import { toErrorPageHref } from '../../hydra-flow-error';
import { resolveAppRedirectUrl } from '../logout-redirect';
import { rejectLogoutRequest } from '../rejectLogoutRequest';

export async function GET(request: NextRequest) {
  const logoutChallenge = request.nextUrl.searchParams.get('logout_challenge');

  if (!logoutChallenge) {
    return NextResponse.redirect(resolveAppRedirectUrl('/auth/logout', request));
  }

  try {
    await rejectLogoutRequest(logoutChallenge);

    logAuthFlow('logout.challenge.rejected', {
      logoutChallenge,
    });

    return NextResponse.redirect(resolveAppRedirectUrl('/', request));
  } catch (error: unknown) {
    logAuthFlow('logout.flow.error', {
      error: error instanceof Error ? error.message : 'unknown',
    });

    return NextResponse.redirect(resolveAppRedirectUrl(toErrorPageHref(error), request));
  }
}
