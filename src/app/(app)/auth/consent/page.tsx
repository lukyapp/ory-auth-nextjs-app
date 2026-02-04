import {OAuth2ConsentRequest} from "@ory/client-fetch";
import {redirect} from 'next/navigation';
import React from 'react';

import {acceptConsentRequest} from './acceptConsentRequest';
import {ConsentUi} from './consent-ui';
import {getConsentRequest} from './getConsentRequest';

export default async function ConsentPage(props: {
    searchParams: Promise<{ consent_challenge: string }>;
}) {
    const searchParams = await props.searchParams;
    const consentChallenge = searchParams.consent_challenge ?? undefined;
    if (!consentChallenge) {
        return;
    }
    const consentRequest = await getConsentRequest(consentChallenge);
    if (shouldSkipConsent(consentRequest)) {
        const {redirectTo} = await acceptConsentRequest({ ...consentRequest, remember: false });
        redirect(redirectTo);
    }
    return <ConsentUi consentRequest={consentRequest}/>;
}

function shouldSkipConsent(consentRequest: OAuth2ConsentRequest) {
    return consentRequest.skip || consentRequest.client?.skip_consent
}
