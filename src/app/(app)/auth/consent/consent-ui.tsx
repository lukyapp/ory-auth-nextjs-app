'use client';

import { type OAuth2ConsentRequest } from '@ory/client-fetch';
import type { OryClientConfiguration } from '@ory/elements-react';
import { useSession } from '@ory/elements-react/client';
import { Consent } from '@ory/elements-react/theme';
import React from 'react';
import { useCsrfToken } from './useCsrfToken';

export const ConsentUi = ({
  consentRequest,
  oryConfig,
}: {
  consentRequest: OAuth2ConsentRequest;
  oryConfig: OryClientConfiguration;
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
