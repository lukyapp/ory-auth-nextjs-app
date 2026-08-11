import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logAuthFlow } from '../../../auth-flow-log';
import { assertSameOriginPost, noStoreHeaders } from '../../../auth-request';
import { HydraFlowError, toErrorPageHref } from '../../../hydra-flow-error';
import { resolveHydraContinuationUrl, resolveInternalAppUrl } from '../../../public-url';
import { acceptLoginRequest } from '../../acceptLoginRequest';
import { validateLoginVerification } from '../../login-verification';

const LoginVerificationCompletionSchema = z.object({
  intent_token: z.string().min(1),
  login_challenge: z.string().trim().min(1),
});

export async function GET() {
  return new NextResponse('Method Not Allowed', {
    headers: { ...noStoreHeaders(), Allow: 'POST' },
    status: 405,
  });
}

export async function POST(request: NextRequest) {
  try {
    assertSameOriginPost(request);
    const parsed = LoginVerificationCompletionSchema.safeParse(
      Object.fromEntries((await request.formData()).entries()),
    );
    if (!parsed.success) throw invalidIntent();

    const continuation = await validateLoginVerification(parsed.data);
    const loginAcceptance = await acceptLoginRequest(continuation.loginChallenge);
    if (loginAcceptance.status === 'verification_required') {
      throw new HydraFlowError('Email verification was not retained.', {
        code: 'hydra_login_email_unverified',
        description: 'Verify your email address before continuing.',
        status: 403,
      });
    }
    if (!loginAcceptance.redirectTo) {
      throw new Error('Hydra did not return a login continuation URL.');
    }

    logAuthFlow('login.verification.accepted');
    return NextResponse.redirect(resolveHydraContinuationUrl(loginAcceptance.redirectTo), {
      headers: noStoreHeaders(),
      status: 303,
    });
  } catch (error: unknown) {
    logAuthFlow('login.verification.accept_failed', {
      errorCode: error instanceof HydraFlowError ? error.code : 'auth_flow_error',
    });
    return NextResponse.redirect(resolveInternalAppUrl(toErrorPageHref(error), request), {
      headers: noStoreHeaders(),
      status: 303,
    });
  }
}

function invalidIntent() {
  return new HydraFlowError('Invalid email verification completion.', {
    code: 'auth_intent_invalid',
    description: 'This verification request expired or is invalid. Please sign in again.',
    status: 403,
  });
}
