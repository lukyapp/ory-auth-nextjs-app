import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { OAuth2ConsentRequest } from '@ory/client-fetch';
import { redirect } from 'next/navigation';
import React from 'react';
import { toErrorPageHref } from '../hydra-flow-error';
import { isNextRedirectError } from '../is-next-redirect-error';
import { acceptConsentRequest } from './acceptConsentRequest';
import { ConsentUi } from './consent-ui';
import { getConsentRequest } from './getConsentRequest';

export default async function ConsentPage(props: {
  searchParams: Promise<{ consent_challenge: string }>;
}) {
  try {
    const searchParams = await props.searchParams;
    const consentChallenge = Array.isArray(searchParams.consent_challenge)
      ? searchParams.consent_challenge[0]
      : searchParams.consent_challenge;
    if (!consentChallenge) {
      return;
    }
    const consentRequest = await getConsentRequest(consentChallenge);
    const locale = await resolveOryLocale({ flow: consentRequest, searchParams });
    const oryConfig = createOryConfig(locale);
    if (shouldSkipConsent(consentRequest)) {
      const { redirectTo } = await acceptConsentRequest({ ...consentRequest });
      redirect(redirectTo);
    }
    return <ConsentUi consentRequest={consentRequest} oryConfig={oryConfig} />;
  } catch (error: unknown) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    redirect(toErrorPageHref(error));
  }
}

function shouldSkipConsent(consentRequest: OAuth2ConsentRequest) {
  return consentRequest.skip || consentRequest.client?.skip_consent;
}
