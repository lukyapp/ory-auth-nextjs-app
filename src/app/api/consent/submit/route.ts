import { logError, logWarn } from '@/app-utils/server-log';
import { acceptConsentRequest } from '@/app/(app)/auth/consent/acceptConsentRequest';
import {
  clearConsentCsrfCookie,
  readConsentCsrfCookie,
} from '@/app/(app)/auth/consent/csrf-server-tools';
import { getConsentRequest } from '@/app/(app)/auth/consent/getConsentRequest';
import { rejectConsentRequest } from '@/app/(app)/auth/consent/rejectConsentRequest';
import { toErrorResponse } from '@/app/(app)/auth/hydra-flow-error';
import { getServerSession } from '@ory/nextjs/app';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const ScopeSchema = z.enum(['openid', 'email', 'profile', 'offline_access']);

const BaseConsentBodySchema = z.object({
  csrf_token: z.string().min(1),
  grant_scope: z.array(ScopeSchema).optional(),
  remember: z.preprocess((val) => val === 'true' || val === true, z.boolean()),
  consent_challenge: z.string().min(1),
});

const ConsentBodySchema = z.discriminatedUnion('action', [
  BaseConsentBodySchema.extend({ action: z.literal('accept') }),
  BaseConsentBodySchema.extend({ action: z.literal('reject') }),
]);

const getBody = async (req: Request): Promise<unknown> => {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await req.json();
  }
  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const form = await req.formData();
    return Object.fromEntries(form.entries());
  }
  throw new Error(`Unsupported content type: ${contentType}`);
};

async function isCsrfTokenValid(consentChallenge: string, csrfToken: string): Promise<boolean> {
  const storedCsrfToken = await readConsentCsrfCookie(consentChallenge);

  return !(!storedCsrfToken || csrfToken !== storedCsrfToken);
}

export async function POST(
  req: Request,
): Promise<NextResponse<{ redirect_to: string } | { code?: string; error: string }>> {
  try {
    // 1. Verify user is authenticated
    const session = await getServerSession();
    if (!session?.identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const rawBody = await getBody(req);
    const parseResult = ConsentBodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      logWarn('consent.submit.invalid_payload', {
        error: z.treeifyError(parseResult.error),
      });
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const body = parseResult.data;

    // 3. Validate CSRF token
    const isValid = await isCsrfTokenValid(body.consent_challenge, body.csrf_token);
    if (!isValid) {
      await clearConsentCsrfCookie(body.consent_challenge);
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }
    await clearConsentCsrfCookie(body.consent_challenge);

    // 4. Fetch consent request and verify it belongs to the authenticated user
    const consentRequest = await getConsentRequest(body.consent_challenge);
    if (consentRequest.subject !== session.identity.id) {
      return NextResponse.json(
        { error: 'Consent challenge does not belong to this user' },
        { status: 403 },
      );
    }

    // 5. Process the consent action
    if (body.action === 'accept') {
      const { redirectTo } = await acceptConsentRequest({
        ...consentRequest,
        remember: body.remember,
      });
      return NextResponse.json({ redirect_to: redirectTo });
    }

    if (body.action === 'reject') {
      const { redirectTo } = await rejectConsentRequest(body.consent_challenge);
      return NextResponse.json({ redirect_to: redirectTo });
    }

    return NextResponse.json({ redirect_to: '/' });
  } catch (error: unknown) {
    logError('consent.submit.failed', { error });
    const response = toErrorResponse(error, 'Internal server error');
    return NextResponse.json(response.body, { status: response.status });
  }
}
