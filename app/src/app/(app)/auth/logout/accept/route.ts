import { getServerSession } from '@ory/nextjs/app';
import { NextRequest, NextResponse } from 'next/server';
import { logAuthFlow } from '../../auth-flow-log';
import { verifyAuthIntentToken } from '../../auth-intent';
import { assertSameOriginPost, noStoreHeaders } from '../../auth-request';
import { HydraFlowError, toErrorPageHref } from '../../hydra-flow-error';
import { resolveHydraContinuationUrl, resolveInternalAppUrl } from '../../public-url';
import { acceptLogoutRequest } from '../acceptLogoutRequest';
import { getLogoutRequest } from '../getLogoutRequest';
import { destroyKratosSession, redirectAfterKratosLogout } from '../performKratosLogout';

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

    const [logoutRequest, session] = await Promise.all([
      getLogoutRequest(logoutChallenge),
      getServerSession(),
    ]);
    const subject = session?.identity?.id;
    if (
      !subject ||
      !logoutRequest.subject ||
      subject !== logoutRequest.subject ||
      !verifyAuthIntentToken(intentToken, {
        action: 'logout-confirm',
        challenge: logoutChallenge,
        subject,
      })
    ) {
      throw invalidIntent();
    }

    const fallbackDestination = resolveInternalAppUrl('/', request);
    const setCookies = await destroyKratosSession(request, fallbackDestination);
    const { redirectTo } = await acceptLogoutRequest(logoutChallenge);
    const destination = redirectTo ? resolveHydraContinuationUrl(redirectTo) : fallbackDestination;
    return redirectAfterKratosLogout(destination, setCookies);
  } catch (error: unknown) {
    logAuthFlow('logout.confirm.failed', {
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
