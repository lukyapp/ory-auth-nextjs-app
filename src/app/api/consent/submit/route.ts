import { acceptConsentRequest } from '@/app/(app)/auth/consent/acceptConsentRequest';
import { getConsentRequest } from '@/app/(app)/auth/consent/getConsentRequest';
import { rejectConsentRequest } from '@/app/(app)/auth/consent/rejectConsentRequest';
import { getServerSession } from '@ory/nextjs/app';
import { cookies } from 'next/headers';
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

async function isCsrfTokenValid(csrfToken: string): Promise<boolean> {
  const cookieStore = await cookies();
  const storedCsrfToken = cookieStore.get('csrf_token')?.value;

  return !(!storedCsrfToken || csrfToken !== storedCsrfToken);
}

export async function POST(
  req: Request,
): Promise<NextResponse<{ redirect_to: string } | { error: string }>> {
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
      console.log(parseResult.error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const body = parseResult.data;

    // 3. Validate CSRF token
    const isValid = await isCsrfTokenValid(body.csrf_token);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

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
    console.error('Consent submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
