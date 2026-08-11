import { getServerSession } from '@ory/nextjs/app';
import { NextRequest, NextResponse } from 'next/server';
import { logAuthFlow } from '../../auth-flow-log';
import { verifyAuthIntentToken } from '../../auth-intent';
import { assertSameOriginPost, noStoreHeaders } from '../../auth-request';
import { HydraFlowError, toErrorPageHref } from '../../hydra-flow-error';
import { resolveInternalAppUrl } from '../../public-url';
import { performKratosLogout } from '../performKratosLogout';

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
    const returnTo = sanitizeLocalReturnTo(form.get('return_to')) ?? '/';
    const session = await getServerSession();
    const subject = session?.identity?.id;

    if (
      !subject ||
      !verifyAuthIntentToken(readString(form.get('intent_token')), {
        action: 'logout-confirm',
        returnTo,
        subject,
      })
    ) {
      throw new HydraFlowError('Invalid logout intent.', {
        code: 'auth_intent_invalid',
        description: 'This logout action expired or is invalid. Please try again.',
        status: 403,
      });
    }

    return await performKratosLogout(request, resolveInternalAppUrl(returnTo, request));
  } catch (error: unknown) {
    logAuthFlow('logout.kratos.failed', {
      errorCode: error instanceof HydraFlowError ? error.code : 'auth_flow_error',
    });
    return NextResponse.redirect(resolveInternalAppUrl(toErrorPageHref(error), request), {
      headers: noStoreHeaders(),
      status: 303,
    });
  }
}

function sanitizeLocalReturnTo(value: FormDataEntryValue | null) {
  const returnTo = readString(value);
  return returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : null;
}

function readString(value: FormDataEntryValue | null) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
