'use client';

import { useEffect, useState } from 'react';
import { generateCsrfCookie } from './csrf-server-tools';

export const useCsrfToken = (consentChallenge: string) => {
  const [token, setToken] = useState<string | undefined>();

  useEffect(() => {
    generateCsrfCookie(consentChallenge)
      .then((csrfToken) => setToken(csrfToken))
      .catch((error: unknown) => {
        console.error('[ory-auth-app] consent.csrf.generate_failed', {
          consentChallenge,
          error,
        });
      });
  }, [consentChallenge]);

  return token;
};
