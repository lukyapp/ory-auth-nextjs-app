import { NextRequest, NextResponse } from 'next/server';
import { logAuthFlow } from '../../auth-flow-log';

export async function GET(request: NextRequest) {
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get('return_to'));

  logAuthFlow('logout.complete.redirect', {
    returnTo,
  });

  return NextResponse.redirect(new URL(returnTo ?? '/', request.url));
}

function sanitizeReturnTo(returnTo: string | null) {
  if (!returnTo) {
    return null;
  }

  if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }

  try {
    const url = new URL(returnTo);
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

    return isLocalhost && ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}
