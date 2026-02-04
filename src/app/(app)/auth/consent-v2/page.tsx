import { redirect } from 'next/navigation';
import React from 'react';
import { acceptConsentRequest } from '../consent/acceptConsentRequest';
import { generateCsrfCookie } from '../consent/csrf-server-tools';
import { getConsentRequest } from '../consent/getConsentRequest';
import { ConsentV2Ui } from './consent-v2-ui';

export default async function ConsentV2Page(props: {
  searchParams: Promise<{ consent_challenge: string }>;
}) {
  const searchParams = await props.searchParams;
  const consentChallenge = searchParams.consent_challenge ?? undefined;
  if (!consentChallenge) {
    return;
  }

  const consentRequest = await getConsentRequest(consentChallenge);
  if (shouldSkipConsent(consentRequest)) {
    const { redirectTo } = await acceptConsentRequest({ ...consentRequest, remember: false });
    redirect(redirectTo);
  }

  const csrfToken = await generateCsrfCookie();

  return <ConsentV2Ui consentRequest={consentRequest} csrfToken={csrfToken} />;
}

function shouldSkipConsent(consentRequest: {
  skip?: boolean;
  client?: { skip_consent?: boolean | null };
}) {
  return consentRequest.skip || consentRequest.client?.skip_consent;
}
