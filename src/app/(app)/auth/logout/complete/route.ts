import { NextRequest, NextResponse } from 'next/server';
import { logAuthFlow } from '../../auth-flow-log';
import { resolveAppRedirectUrl, sanitizeLogoutReturnTo } from '../logout-redirect';

export async function GET(request: NextRequest) {
  const returnTo = sanitizeLogoutReturnTo(request.nextUrl.searchParams.get('return_to'));

  logAuthFlow('logout.complete.redirect', {
    returnTo,
  });

  return NextResponse.redirect(resolveAppRedirectUrl(returnTo ?? '/', request));
}
