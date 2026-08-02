import { NextRequest, NextResponse } from 'next/server';
import { logAuthFlow } from '../../auth-flow-log';
import { verifyAuthIntentToken } from '../../auth-intent';
import { assertSameOriginPost, noStoreHeaders } from '../../auth-request';
import { HydraFlowError, toErrorPageHref } from '../../hydra-flow-error';
import { resolveHydraContinuationUrl, resolveInternalAppUrl } from '../../public-url';
import { getLogoutRequest } from '../getLogoutRequest';
import { resolveRegisteredPostLogout } from '../logout-post-redirect';
import { rejectLogoutRequest } from '../rejectLogoutRequest';

export async function GET() {
  return new NextResponse('Method Not Allowed', {
    headers: { ...noStoreHeaders(), Allow: 'POST' },
    status: 405,
  });
}

export async function POST(request: NextRequest) {
  try {
    assertSameOriginPost(request);
    const form = await request.formData();
    const logoutChallenge = readString(form.get('logout_challenge'));
    const intentToken = readString(form.get('intent_token'));
    if (!logoutChallenge) throw invalidIntent();

    const logoutRequest = await getLogoutRequest(logoutChallenge);
    const { redirectTo, state } = resolveRegisteredPostLogout(logoutRequest);
    if (
      !verifyAuthIntentToken(intentToken, {
        action: 'logout-cancel',
        challenge: logoutChallenge,
        returnTo: redirectTo,
        subject: logoutRequest.subject,
      })
    ) {
      throw invalidIntent();
    }

    await rejectLogoutRequest(logoutChallenge);
    const destination = redirectTo
      ? resolveHydraContinuationUrl(redirectTo)
      : resolveInternalAppUrl('/', request);
    if (state) destination.searchParams.set('state', state);

    logAuthFlow('logout.challenge.rejected', {
      logoutChallenge,
      redirectTo: destination.toString(),
    });
    return NextResponse.redirect(destination, { headers: noStoreHeaders(), status: 303 });
  } catch (error: unknown) {
    logAuthFlow('logout.cancel.failed', {
      errorCode: error instanceof HydraFlowError ? error.code : 'auth_flow_error',
    });
    return NextResponse.redirect(resolveInternalAppUrl(toErrorPageHref(error), request), {
      headers: noStoreHeaders(),
      status: 303,
    });
  }
}

function invalidIntent() {
  return new HydraFlowError('Invalid logout intent.', {
    code: 'auth_intent_invalid',
    description: 'This logout action expired or is invalid. Please try again.',
    status: 403,
  });
}

function readString(value: FormDataEntryValue | null) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
