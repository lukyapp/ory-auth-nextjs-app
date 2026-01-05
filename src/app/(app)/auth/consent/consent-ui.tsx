'use client';

import {oryConfig} from "@/lib/ory/ory.config";
import {type OAuth2ConsentRequest} from '@ory/client-fetch';
import {useSession} from '@ory/elements-react/client';
import {Consent} from '@ory/elements-react/theme';
import React from 'react';

import {useCsrfToken} from './useCsrfToken';

export const ConsentUi = ({consentRequest}: {
    consentRequest: OAuth2ConsentRequest;
}) => {
    const session = useSession();
    const csrfToken = useCsrfToken();

    if (!session || !csrfToken) {
        return null;
    }

    return (
        <Consent
            config={oryConfig}
            // @ts-expect-error consent session
            session={session}
            consentChallenge={consentRequest}
            formActionUrl={'/api/consent/submit'}
            csrfToken={csrfToken}
        />
    );
};
