import { logAuthFlow } from '@/app/(app)/auth/auth-flow-log';
import { verifyAuthIntentToken } from '@/app/(app)/auth/auth-intent';
import { assertSameOriginPost, noStoreHeaders } from '@/app/(app)/auth/auth-request';
import { acceptConsentRequest } from '@/app/(app)/auth/consent/acceptConsentRequest';
import { getConsentRequest } from '@/app/(app)/auth/consent/getConsentRequest';
import { rejectConsentRequest } from '@/app/(app)/auth/consent/rejectConsentRequest';
import { HydraFlowError, toErrorResponse } from '@/app/(app)/auth/hydra-flow-error';
import { resolveHydraContinuationUrl } from '@/app/(app)/auth/public-url';
import { getServerSession } from '@ory/nextjs/app';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ConsentBodySchema = z.object({
  action: z.enum(['accept', 'reject']),
  consent_challenge: z.string().trim().min(1),
  csrf_token: z.string().min(1),
  grant_scope: z.unknown().optional(),
  remember: z.unknown().optional(),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOriginPost(request);
    const parseResult = ConsentBodySchema.safeParse(await getBody(request));
    if (!parseResult.success) {
      logAuthFlow('consent.submit.invalid_payload');
      return json({ error: 'Invalid request body' }, 400);
    }

    const body = parseResult.data;
    const [session, consentRequest] = await Promise.all([
      getServerSession(),
      getConsentRequest(body.consent_challenge),
    ]);
    const subject = session?.identity?.id;

    if (!subject || !consentRequest.subject || consentRequest.subject !== subject) {
      throw new HydraFlowError('Consent subject mismatch.', {
        code: 'hydra_consent_subject_mismatch',
        description: 'The consent request does not match the current authenticated session.',
        status: 403,
      });
    }

    if (
      !verifyAuthIntentToken(body.csrf_token, {
        action: body.action === 'accept' ? 'consent-accept' : 'consent-reject',
        challenge: body.consent_challenge,
        subject,
      })
    ) {
      throw new HydraFlowError('Invalid consent intent.', {
        code: 'auth_intent_invalid',
        description: 'This consent action expired or is invalid. Please try again.',
        status: 403,
      });
    }

    if (body.action === 'accept') {
      const { accountHistoryCookie, redirectTo } = await acceptConsentRequest(
        body.consent_challenge,
      );
      const response = json(
        { redirect_to: resolveHydraContinuationUrl(redirectTo).toString() },
        200,
      );
      if (accountHistoryCookie) {
        response.cookies.set(
          accountHistoryCookie.name,
          accountHistoryCookie.value,
          accountHistoryCookie.options,
        );
      }
      return response;
    }

    const { redirectTo } = await rejectConsentRequest(body.consent_challenge);
    return json({ redirect_to: resolveHydraContinuationUrl(redirectTo).toString() }, 200);
  } catch (error: unknown) {
    logAuthFlow('consent.submit.failed', {
      errorCode: error instanceof HydraFlowError ? error.code : 'auth_flow_error',
    });
    const response = toErrorResponse(error, 'Unable to complete the consent action.');
    return json(response.body, response.status);
  }
}

async function getBody(request: NextRequest): Promise<unknown> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return request.json();
  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    return Object.fromEntries((await request.formData()).entries());
  }
  throw new HydraFlowError('Unsupported consent content type.', {
    code: 'auth_request_invalid',
    description: 'Invalid authentication request.',
    status: 415,
  });
}

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { headers: noStoreHeaders(), status });
}
