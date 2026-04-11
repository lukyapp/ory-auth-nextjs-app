'use server';

import { getOAuth2ApiFetchClient } from '@ory/sdk/server';
import { createHydraFlowError } from '../hydra-flow-error';

export async function rejectConsentRequest(challenge: string) {
  const hydra = await getOAuth2ApiFetchClient();
  try {
    const response = await hydra.rejectOAuth2ConsentRequest({
      consentChallenge: challenge,
      rejectOAuth2Request: {
        error: 'access_denied',
        error_description: 'The resource owner denied the request',
      },
    });

    return { redirectTo: response.redirect_to ?? '/' };
  } catch (error: unknown) {
    throw createHydraFlowError('reject consent request failed', error, {
      code: 'hydra_consent_reject_failed',
      description: 'Unable to reject the consent flow right now.',
    });
  }
}
