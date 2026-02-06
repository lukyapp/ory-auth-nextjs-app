import { acceptConsentRequest } from '@/app/(app)/auth/consent/acceptConsentRequest';
import { getConsentRequest } from '@/app/(app)/auth/consent/getConsentRequest';
import { rejectConsentRequest } from '@/app/(app)/auth/consent/rejectConsentRequest';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type Scope = 'openid' | 'email' | 'profile' | 'offline';

type WithCsrfToken = {
  csrf_token: string;
};

type BaseConsentBody = WithCsrfToken & {
  grant_scope: Scope[] | undefined;
  remember: boolean;
  consent_challenge: string;
};

type AcceptConsentBody = BaseConsentBody & {
  action: 'accept';
};

type RejectConsentBody = BaseConsentBody & {
  action: 'reject';
};

type ConsentBody = AcceptConsentBody | RejectConsentBody;

const getBody = async <T>(req: Request) => {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await req.json();
    return data as T;
  }
  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const form = await req.formData();
    const data = Object.fromEntries(form.entries());
    return data as T;
  }
  throw new Error(`Unsupported content type: ${contentType}`);
};

async function checkCsrfToken(body: WithCsrfToken) {
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get('csrf_token')?.value;

  if (!csrfToken || body.csrf_token !== csrfToken) {
    throw new Error('Invalid CSRF token');
    // return NextResponse.json({error: "Invalid CSRF token"}, {status: 403})
  }
}

export async function POST(req: Request): Promise<NextResponse<{ redirect_to: string }>> {
  // TODO validate body
  const body = await getBody<ConsentBody>(req);
  await checkCsrfToken(body);

  if (body.action === 'accept') {
    const consentRequest = await getConsentRequest(body.consent_challenge);
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
}
