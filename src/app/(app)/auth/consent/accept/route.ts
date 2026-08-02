import { NextRequest, NextResponse } from 'next/server';
import { logAuthFlow } from '../../auth-flow-log';
import { noStoreHeaders } from '../../auth-request';
import { toErrorPageHref } from '../../hydra-flow-error';
import { resolveHydraContinuationUrl, resolveInternalAppUrl } from '../../public-url';
import { acceptConsentRequest } from '../acceptConsentRequest';
import { getConsentRequest } from '../getConsentRequest';

export async function GET(request: NextRequest) {
  const consentChallenge = request.nextUrl.searchParams.get('consent_challenge')?.trim();

  if (!consentChallenge) {
    return NextResponse.redirect(resolveInternalAppUrl('/auth/consent', request), {
      headers: noStoreHeaders(),
    });
  }

  try {
    const consentRequest = await getConsentRequest(consentChallenge);

    if (!consentRequest.skip && !consentRequest.client?.skip_consent) {
      const consentUrl = resolveInternalAppUrl('/auth/consent', request);
      consentUrl.searchParams.set('consent_challenge', consentChallenge);
      return NextResponse.redirect(consentUrl, { headers: noStoreHeaders() });
    }

    const { accountHistoryCookie, redirectTo } = await acceptConsentRequest(consentChallenge);
    const response = NextResponse.redirect(resolveHydraContinuationUrl(redirectTo), {
      headers: noStoreHeaders(),
    });

    if (accountHistoryCookie) {
      response.cookies.set(
        accountHistoryCookie.name,
        accountHistoryCookie.value,
        accountHistoryCookie.options,
      );
    }

    logAuthFlow('consent.challenge.redirect', {
      clientId: consentRequest.client?.client_id ?? null,
      consentChallenge,
      redirectTo,
    });

    return response;
  } catch (error: unknown) {
    logAuthFlow('consent.flow.error', {
      errorCode: 'consent_flow_error',
    });

    return NextResponse.redirect(resolveInternalAppUrl(toErrorPageHref(error), request), {
      headers: noStoreHeaders(),
    });
  }
}
