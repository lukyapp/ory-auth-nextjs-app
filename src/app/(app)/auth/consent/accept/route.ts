import { NextRequest, NextResponse } from 'next/server';
import { logAuthFlow } from '../../auth-flow-log';
import { toErrorPageHref } from '../../hydra-flow-error';
import { resolveAppRedirectUrl } from '../../public-url';
import { acceptConsentRequest } from '../acceptConsentRequest';
import { getConsentRequest } from '../getConsentRequest';

export async function GET(request: NextRequest) {
  const consentChallenge = request.nextUrl.searchParams.get('consent_challenge')?.trim();

  if (!consentChallenge) {
    return NextResponse.redirect(resolveAppRedirectUrl('/auth/consent', request));
  }

  try {
    const consentRequest = await getConsentRequest(consentChallenge);

    if (!consentRequest.skip && !consentRequest.client?.skip_consent) {
      const consentUrl = resolveAppRedirectUrl('/auth/consent', request);
      consentUrl.searchParams.set('consent_challenge', consentChallenge);
      return NextResponse.redirect(consentUrl);
    }

    const { accountHistoryCookie, redirectTo } = await acceptConsentRequest({
      ...consentRequest,
    });
    const response = NextResponse.redirect(resolveAppRedirectUrl(redirectTo, request));

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
      error: error instanceof Error ? error.message : 'unknown',
    });

    return NextResponse.redirect(resolveAppRedirectUrl(toErrorPageHref(error), request));
  }
}
