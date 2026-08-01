import { NextRequest, NextResponse } from 'next/server';
import { logAuthFlow } from '../../auth-flow-log';
import { toErrorPageHref } from '../../hydra-flow-error';
import { completeLogoutRequest } from '../completeLogoutRequest';

export async function GET(request: NextRequest) {
  const logoutChallenge = request.nextUrl.searchParams.get('logout_challenge');

  if (!logoutChallenge) {
    return NextResponse.redirect(new URL('/auth/logout', request.url));
  }

  try {
    const { hydraRedirectTo, redirectTo } = await completeLogoutRequest(logoutChallenge);
    logAuthFlow('logout.challenge.redirect', {
      hydraRedirectTo,
      logoutChallenge,
      redirectTo,
    });

    return NextResponse.redirect(new URL(redirectTo ?? '/', request.url));
  } catch (error: unknown) {
    logAuthFlow('logout.flow.error', {
      error: error instanceof Error ? error.message : 'unknown',
    });

    return NextResponse.redirect(new URL(toErrorPageHref(error), request.url));
  }
}
